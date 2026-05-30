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


class ConversationRequest(BaseModel):
    """Request for conversation mode - transcribe, detect language, translate, and generate audio"""
    pass


@api_router.post("/handsfree-check")
async def handsfree_check(audio: UploadFile = File(...)):
    """
    Check audio for trigger phrases:
    - "translator listen" / "traductor escucha" -> start recording
    - "translator stop" / "traductor para" / "traductor alto" -> stop and process
    """
    try:
        audio_content = await audio.read()
        
        if len(audio_content) < 500:
            return {"trigger": None, "text": ""}
        
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        import io
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.webm"
        
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="json"
        )
        
        text = response.text.strip().lower()
        
        # Check for start triggers
        start_triggers = [
            "translator listen", "translate listen", "translator lissen",
            "traductor escucha", "traductor escuchar", "translator escucha",
            "start listening", "empieza a escuchar", "escucha"
        ]
        
        # Check for stop triggers  
        stop_triggers = [
            "translator stop", "translate stop", "translator stap",
            "traductor para", "traductor alto", "traductor parar",
            "stop listening", "para de escuchar", "alto", "para"
        ]
        
        # Check for hallucinations first
        hallucination_patterns = [
            "thank you", "thanks for watching", "thank you for watching",
            "thanks for listening", "thank you for listening", "subscribe"
        ]
        
        is_hallucination = any(pattern in text for pattern in hallucination_patterns)
        if is_hallucination:
            return {"trigger": None, "text": ""}
        
        for trigger in start_triggers:
            if trigger in text:
                logger.info(f"Start trigger detected: '{text}'")
                return {"trigger": "start", "text": text}
        
        for trigger in stop_triggers:
            if trigger in text:
                logger.info(f"Stop trigger detected: '{text}'")
                return {"trigger": "stop", "text": text}
        
        return {"trigger": None, "text": text}
        
    except Exception as e:
        logger.error(f"Handsfree check error: {e}")
        return {"trigger": None, "text": ""}


@api_router.post("/handsfree-translate")
async def handsfree_translate(audio: UploadFile = File(...)):
    """
    Process accumulated hands-free audio - transcribe, translate, and generate TTS.
    Strips out trigger phrases from the transcription.
    """
    try:
        audio_content = await audio.read()
        
        if len(audio_content) < 1000:
            return {"skipped": True}
        
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        import io
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.webm"
        
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="verbose_json"
        )
        
        original_text = response.text.strip()
        
        # Remove trigger phrases from the text
        trigger_phrases = [
            "translator listen", "translate listen", "traductor escucha",
            "translator stop", "translate stop", "traductor para", "traductor alto",
            "start listening", "stop listening", "escucha", "para", "alto"
        ]
        
        cleaned_text = original_text
        for phrase in trigger_phrases:
            cleaned_text = cleaned_text.lower().replace(phrase, "").strip()
        
        # Clean up extra punctuation
        import re
        cleaned_text = re.sub(r'^[\s.,!?¿¡]+|[\s.,!?¿¡]+$', '', cleaned_text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        if not cleaned_text or len(cleaned_text) < 2:
            return {"skipped": True}
        
        # Restore original case by finding the cleaned portion in original
        # For simplicity, just capitalize first letter
        cleaned_text = cleaned_text[0].upper() + cleaned_text[1:] if len(cleaned_text) > 1 else cleaned_text.upper()
        
        # Detect language and translate
        detected_lang = getattr(response, 'language', None)
        
        if detected_lang == "spanish" or detected_lang == "es":
            source_lang = "es"
            target_lang = "en"
            source_name = "Spanish"
            target_name = "English"
        else:
            source_lang = "en"
            target_lang = "es"
            source_name = "English"
            target_name = "Spanish"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"handsfree-{uuid.uuid4()}",
            system_message=f"You are a professional translator. Translate the following text from {source_name} to {target_name}. Only respond with the translation, nothing else."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=cleaned_text)
        translated_text = await chat.send_message(user_message)
        
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_bytes = await tts.generate_speech(
            text=translated_text,
            model="tts-1",
            voice="nova",
            response_format="mp3"
        )
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Store in history
        history_entry = TranslationHistory(
            original_text=cleaned_text,
            translated_text=translated_text,
            source_lang=source_lang,
            target_lang=target_lang
        )
        doc = history_entry.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.translation_history.insert_one(doc)
        
        return {
            "detected_language": source_lang,
            "original_text": cleaned_text,
            "translated_text": translated_text,
            "target_language": target_lang,
            "audio": audio_base64,
            "skipped": False
        }
        
    except Exception as e:
        logger.error(f"Handsfree translate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/conversation")
async def conversation_mode(audio: UploadFile = File(...)):
    """
    Conversation mode: 
    1. Transcribe audio (auto-detect language)
    2. Detect if English or Spanish
    3. Translate to the other language
    4. Return transcription, translation, detected language, and audio
    """
    try:
        # Read audio file
        audio_content = await audio.read()
        
        if len(audio_content) < 1000:  # Too short, likely silence
            return {
                "detected_language": None,
                "original_text": "",
                "translated_text": "",
                "audio": None,
                "skipped": True
            }
        
        # Initialize STT (auto-detect language by not specifying language)
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        import io
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.webm"
        
        # Transcribe with verbose_json to get detected language
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="verbose_json"
        )
        
        original_text = response.text.strip()
        
        # Filter out Whisper hallucinations (common patterns when given silence)
        hallucination_patterns = [
            "thank you", "thanks for watching", "thank you for watching",
            "thanks for listening", "thank you for listening",
            "subscribe", "like and subscribe", "see you next time",
            "goodbye", "bye", "bye bye",
            "silence", "music", "applause",
            "...", ". .", "..", "。", "،",
        ]
        
        # Check if it's likely a hallucination
        lower_text = original_text.lower().strip()
        is_hallucination = (
            not original_text or
            len(original_text) < 3 or
            original_text in [".", "..", "...", ". .", ". . ."] or
            any(lower_text == pattern or lower_text.startswith(pattern + ".") or lower_text.startswith(pattern + " ") 
                for pattern in hallucination_patterns) or
            all(c in '.,!?¿¡ \n\t' for c in original_text)  # Only punctuation
        )
        
        if is_hallucination:
            logger.info(f"Filtered hallucination: '{original_text}'")
            return {
                "detected_language": None,
                "original_text": "",
                "translated_text": "",
                "audio": None,
                "skipped": True
            }
        
        # Get detected language from Whisper
        detected_lang = getattr(response, 'language', None)
        
        # Determine source and target languages
        # If Whisper detected Spanish, translate to English. Otherwise, translate to Spanish.
        if detected_lang == "spanish" or detected_lang == "es":
            source_lang = "es"
            target_lang = "en"
            source_name = "Spanish"
            target_name = "English"
        else:
            # Default to English -> Spanish
            source_lang = "en"
            target_lang = "es"
            source_name = "English"
            target_name = "Spanish"
        
        # Translate using GPT-5.2
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"conversation-{uuid.uuid4()}",
            system_message=f"You are a professional translator. Translate the following text from {source_name} to {target_name}. Only respond with the translation, nothing else."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=original_text)
        translated_text = await chat.send_message(user_message)
        
        # Generate TTS for the translation
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_bytes = await tts.generate_speech(
            text=translated_text,
            model="tts-1",
            voice="nova",
            response_format="mp3"
        )
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Store in history
        history_entry = TranslationHistory(
            original_text=original_text,
            translated_text=translated_text,
            source_lang=source_lang,
            target_lang=target_lang
        )
        doc = history_entry.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.translation_history.insert_one(doc)
        
        return {
            "detected_language": source_lang,
            "original_text": original_text,
            "translated_text": translated_text,
            "target_language": target_lang,
            "audio": audio_base64,
            "skipped": False
        }
        
    except Exception as e:
        logger.error(f"Conversation mode error: {e}")
        raise HTTPException(status_code=500, detail=f"Conversation mode failed: {str(e)}")


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
