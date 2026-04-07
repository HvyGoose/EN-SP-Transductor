from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64

# Load environment variables FIRST
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import emergent integrations after loading env
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Models
class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "en"  # "en" or "es"
    target_lang: str = "es"  # "es" or "en"


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str


class TTSRequest(BaseModel):
    text: str
    lang: str = "en"  # Language for voice selection


class TranslationHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Routes
@api_router.get("/")
async def root():
    return {"message": "Real-time Translator API"}


@api_router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """Translate text using GPT-5.2"""
    if not request.text.strip():
        return TranslationResponse(
            original_text=request.text,
            translated_text="",
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
    
    try:
        # Determine language names
        lang_map = {"en": "English", "es": "Spanish"}
        source_name = lang_map.get(request.source_lang, "English")
        target_name = lang_map.get(request.target_lang, "Spanish")
        
        # Create chat instance for translation
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"translate-{uuid.uuid4()}",
            system_message=f"You are a professional translator. Translate the following text from {source_name} to {target_name}. Only respond with the translation, nothing else. Do not add explanations or notes."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=request.text)
        translated_text = await chat.send_message(user_message)
        
        # Store in history
        history_entry = TranslationHistory(
            original_text=request.text,
            translated_text=translated_text,
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
        doc = history_entry.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.translation_history.insert_one(doc)
        
        return TranslationResponse(
            original_text=request.text,
            translated_text=translated_text,
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@api_router.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...), language: Optional[str] = "en"):
    """Convert speech to text using Whisper"""
    try:
        # Read audio file
        audio_content = await audio.read()
        
        # Initialize STT
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        # Create a file-like object from bytes
        import io
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.webm"
        
        # Transcribe
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="json",
            language=language
        )
        
        return {"text": response.text, "language": language}
        
    except Exception as e:
        logger.error(f"Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=f"Speech-to-text failed: {str(e)}")


@api_router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using OpenAI TTS"""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Initialize TTS
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        
        # Choose voice based on language (shimmer for a neutral, clear voice)
        voice = "nova"  # Energetic and clear for both languages
        
        # Generate speech
        audio_bytes = await tts.generate_speech(
            text=request.text,
            model="tts-1",
            voice=voice,
            response_format="mp3"
        )
        
        # Return audio as base64 for easy frontend handling
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return {"audio": audio_base64, "format": "mp3"}
        
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {str(e)}")


@api_router.get("/history", response_model=List[TranslationHistory])
async def get_translation_history():
    """Get recent translation history"""
    history = await db.translation_history.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    for entry in history:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return history


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
