import base64
import io
from typing import Any, Optional, Tuple

from fastapi import HTTPException
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech


MIN_STT_AUDIO_BYTES = 1200
VALID_STT_LANGUAGES = {'en', 'es'}
STT_PROMPT = 'Short spoken English or Spanish phrase for a real-time translator app.'
DEFAULT_TTS_VOICE = 'nova'


def create_audio_file(audio_content: bytes, filename: Optional[str]):
    audio_file = io.BytesIO(audio_content)
    audio_file.name = filename or 'audio.webm'
    return audio_file


async def transcribe_audio_bytes(
    api_key: str,
    audio_content: bytes,
    filename: Optional[str],
    *,
    language: Optional[str] = None,
    response_format: str = 'verbose_json',
    prompt: Optional[str] = STT_PROMPT,
) -> Tuple[Any, Optional[str]]:
    if len(audio_content) < MIN_STT_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail='Audio too short. Hold the mic a little longer and try again.')

    stt = OpenAISpeechToText(api_key=api_key)
    request_data = {
        'file': create_audio_file(audio_content, filename),
        'model': 'whisper-1',
        'response_format': response_format,
        'prompt': prompt,
        'temperature': 0.0,
    }

    normalized_language = (language or '').lower()
    if normalized_language in VALID_STT_LANGUAGES:
        request_data['language'] = normalized_language

    response = await stt.transcribe(**request_data)
    transcript = response.text.strip()
    if not transcript:
        raise HTTPException(status_code=422, detail='No speech detected. Please try again.')

    return response, normalized_language or language


async def transcribe_upload(api_key: str, audio: Any, *, language: Optional[str] = None) -> Tuple[str, Optional[str]]:
    audio_content = await audio.read()
    response, normalized_language = await transcribe_audio_bytes(
        api_key,
        audio_content,
        audio.filename,
        language=language,
    )
    return response.text.strip(), normalized_language


async def synthesize_speech_base64(api_key: str, text: str, *, voice: str = DEFAULT_TTS_VOICE) -> str:
    tts = OpenAITextToSpeech(api_key=api_key)
    audio_bytes = await tts.generate_speech(text=text, model='tts-1', voice=voice, response_format='mp3')
    return base64.b64encode(audio_bytes).decode('utf-8')