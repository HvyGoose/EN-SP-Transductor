import logging
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, File, HTTPException, Request, UploadFile
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

from models import (
    CheckPremiumRequest,
    CreateCheckoutRequest,
    TTSRequest,
    TranslationHistory,
    TranslationRequest,
    TranslationResponse,
)
from services.conversation_service import (
    process_conversation_audio,
    process_handsfree_check,
    process_handsfree_translation,
)
from services.history_service import get_recent_translation_history, save_translation_history
from services.payment_service import (
    check_premium_status,
    create_checkout_session,
    get_checkout_status,
    process_stripe_webhook,
)
from services.speech_service import synthesize_speech_base64, transcribe_upload
from services.translation_service import translate_text_content


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
PREMIUM_PRICE = 4.99

app = FastAPI()
api_router = APIRouter(prefix='/api')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@api_router.get('/')
async def root():
    return {'message': 'Real-time Translator API'}


@api_router.post('/translate', response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    if not request.text.strip():
        return TranslationResponse(
            original_text=request.text,
            translated_text='',
            source_lang=request.source_lang,
            target_lang=request.target_lang,
        )

    try:
        translated_text = await translate_text_content(
            EMERGENT_LLM_KEY,
            request.text,
            request.source_lang,
            request.target_lang,
        )
        await save_translation_history(
            db,
            original_text=request.text,
            translated_text=translated_text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
        )
        return TranslationResponse(
            original_text=request.text,
            translated_text=translated_text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
        )
    except Exception as error:
        logger.error(f'Translation error: {error}')
        raise HTTPException(status_code=500, detail=f'Translation failed: {error}')


@api_router.post('/speech-to-text')
async def speech_to_text(audio: UploadFile = File(...), language: str = 'en'):
    try:
        transcript, normalized_language = await transcribe_upload(EMERGENT_LLM_KEY, audio, language=language)
        return {'text': transcript, 'language': normalized_language}
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'Speech-to-text error: {error}')
        raise HTTPException(status_code=500, detail=f'Speech-to-text failed: {error}')


@api_router.post('/handsfree-check')
async def handsfree_check(audio: UploadFile = File(...)):
    try:
        return await process_handsfree_check(audio, EMERGENT_LLM_KEY, logger)
    except Exception as error:
        logger.error(f'Handsfree check error: {error}')
        return {'trigger': None, 'text': ''}


@api_router.post('/handsfree-translate')
async def handsfree_translate(audio: UploadFile = File(...)):
    try:
        return await process_handsfree_translation(audio, EMERGENT_LLM_KEY, db)
    except Exception as error:
        logger.error(f'Handsfree translate error: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@api_router.post('/conversation')
async def conversation_mode(audio: UploadFile = File(...)):
    try:
        return await process_conversation_audio(audio, EMERGENT_LLM_KEY, db, logger)
    except Exception as error:
        logger.error(f'Conversation mode error: {error}')
        raise HTTPException(status_code=500, detail=f'Conversation mode failed: {error}')


@api_router.post('/text-to-speech')
async def text_to_speech(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail='Text cannot be empty')

    try:
        audio_base64 = await synthesize_speech_base64(EMERGENT_LLM_KEY, request.text)
        return {'audio': audio_base64, 'format': 'mp3'}
    except Exception as error:
        logger.error(f'Text-to-speech error: {error}')
        raise HTTPException(status_code=500, detail=f'Text-to-speech failed: {error}')


@api_router.get('/history', response_model=List[TranslationHistory])
async def get_translation_history():
    return await get_recent_translation_history(db)


@api_router.post('/payments/create-checkout')
async def create_checkout(request: CreateCheckoutRequest, http_request: Request):
    try:
        return await create_checkout_session(
            db,
            STRIPE_API_KEY,
            request.origin_url,
            http_request.base_url,
            request.email,
            PREMIUM_PRICE,
            logger,
        )
    except Exception as error:
        logger.error(f'Create checkout error: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@api_router.get('/payments/status/{session_id}')
async def get_payment_status(session_id: str, http_request: Request):
    return await get_checkout_status(db, STRIPE_API_KEY, session_id, http_request.base_url, logger)


@api_router.post('/payments/check-premium')
async def check_premium(request: CheckPremiumRequest):
    try:
        return await check_premium_status(db, request.email)
    except Exception as error:
        logger.error(f'Check premium error: {error}')
        return {'is_premium': False, 'email': request.email}


@api_router.post('/webhook/stripe')
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get('Stripe-Signature')
        return await process_stripe_webhook(db, STRIPE_API_KEY, request.base_url, body, signature, logger)
    except Exception as error:
        logger.error(f'Webhook error: {error}')
        return {'received': False, 'error': str(error)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('shutdown')
async def shutdown_db_client():
    client.close()