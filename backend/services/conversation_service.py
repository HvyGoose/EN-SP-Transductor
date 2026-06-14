import re
from typing import Any, Dict, Optional, Tuple

from services.history_service import save_translation_history
from services.speech_service import create_audio_file, synthesize_speech_base64, transcribe_audio_bytes
from services.translation_service import translate_text_content


MIN_HANDSFREE_AUDIO_BYTES = 500
MIN_CONVERSATION_AUDIO_BYTES = 1000
HANDSFREE_TRIGGER_PHRASES = [
    'translator listen', 'translate listen', 'traductor escucha',
    'translator stop', 'translate stop', 'traductor para', 'traductor alto',
    'start listening', 'stop listening', 'escucha', 'para', 'alto'
]
HANDSFREE_HALLUCINATIONS = [
    'thank you', 'thanks for watching', 'thank you for watching',
    'thanks for listening', 'thank you for listening', 'subscribe',
    'transcribed by', 'otter', 'thank you so much'
]
CONVERSATION_HALLUCINATIONS = [
    'thank you', 'thanks for watching', 'thank you for watching', 'thanks for listening',
    'thank you for listening', 'subscribe', 'like and subscribe', 'see you next time',
    'goodbye', 'bye', 'bye bye', 'see you', 'see ya', 'silence', 'music', 'applause',
    'laughter', '...', '. .', '..', '。', '،', 'you', 'the', 'a', 'i', 'it', 'is', 'to',
    'and', 'oh', 'ah', 'um', 'uh', 'hmm', 'hm', 'okay', 'ok', 'yeah', 'yes', 'no', 'so',
    'whisper', 'transcribed', 'otter', 'subtitles', 'inaudible', 'indistinct',
    'unintelligible', 'foreign', 'speaking foreign language', 'music playing',
    'background noise'
]
START_TRIGGERS = [
    'translator listen', 'translate listen', 'translator lissen', 'translator listing',
    'translate listing', 'translator listening', 'traductor escucha', 'traductor escuchar',
    'translator escucha', 'start listening', 'empieza a escuchar', 'escucha traductor',
    'hey translator', 'okay translator', 'translator start', 'translator', 'translate'
]
STOP_TRIGGERS = [
    'translator stop', 'translate stop', 'translator stap', 'translator stopped',
    'traductor para', 'traductor alto', 'traductor parar', 'traductor stop',
    'stop listening', 'para de escuchar', 'stop translator', 'translator done',
    'translate done', 'traductor listo', 'thats it', 'eso es todo', 'finish',
    'finished', 'done', 'stop', 'para', 'alto', 'end', 'translator end',
    'translate end', 'traductor termina', 'bon appetit'
]


def normalize_transcript_text(raw_text: str) -> str:
    normalized = re.sub(r'[^\w\s]', '', raw_text.lower()).strip()
    return re.sub(r'\s+', ' ', normalized)


def is_handsfree_hallucination(text: str) -> bool:
    return any(pattern in text for pattern in HANDSFREE_HALLUCINATIONS)


def _matches_trigger(text: str, trigger: str) -> bool:
    clean_trigger = re.sub(r'[^\w\s]', '', trigger).strip()
    return clean_trigger in text or text == clean_trigger


def _detect_from_trigger_list(text: str, raw_text: str, logger: Any, triggers: list[str], trigger_type: str) -> Optional[Dict[str, str]]:
    for trigger in triggers:
        if _matches_trigger(text, trigger):
            clean_trigger = re.sub(r'[^\w\s]', '', trigger).strip()
            logger.info(f"{trigger_type.upper()} trigger detected: '{clean_trigger}' in '{text}'")
            return {'trigger': trigger_type, 'text': raw_text}
    return None


def _detect_stop_word_match(text_words: list[str], text: str, raw_text: str, logger: Any) -> Optional[Dict[str, str]]:
    if any(word in ['stop', 'para', 'alto', 'done', 'finish', 'end', 'finished'] for word in text_words):
        logger.info(f"STOP trigger (word match) in: '{text}'")
        return {'trigger': 'stop', 'text': raw_text}
    return None


def _detect_start_word_match(text_words: list[str], text: str, raw_text: str, logger: Any) -> Optional[Dict[str, str]]:
    if any(word in ['translator', 'translate', 'traductor'] for word in text_words) and any(
        word in ['listen', 'listening', 'escucha', 'start', 'lissen'] for word in text_words
    ):
        logger.info(f"START trigger (word match) in: '{text}'")
        return {'trigger': 'start', 'text': raw_text}
    return None


def _detect_single_word_start(text: str, raw_text: str, logger: Any) -> Optional[Dict[str, str]]:
    if text in ['listen', 'listening', 'escucha', 'escuchar']:
        logger.info(f"START trigger (single word) in: '{text}'")
        return {'trigger': 'start', 'text': raw_text}
    return None


def detect_trigger(text: str, raw_text: str, logger: Any) -> Dict[str, Optional[str]]:
    stop_match = _detect_from_trigger_list(text, raw_text, logger, STOP_TRIGGERS, 'stop')
    if stop_match:
        return stop_match

    start_match = _detect_from_trigger_list(text, raw_text, logger, START_TRIGGERS, 'start')
    if start_match:
        return start_match

    text_words = text.split()
    stop_word_match = _detect_stop_word_match(text_words, text, raw_text, logger)
    if stop_word_match:
        return stop_word_match

    start_word_match = _detect_start_word_match(text_words, text, raw_text, logger)
    if start_word_match:
        return start_word_match

    single_word_start = _detect_single_word_start(text, raw_text, logger)
    if single_word_start:
        return single_word_start

    return {'trigger': None, 'text': raw_text}


def clean_handsfree_text(original_text: str) -> str:
    cleaned_text = original_text
    for phrase in HANDSFREE_TRIGGER_PHRASES:
        cleaned_text = cleaned_text.lower().replace(phrase, '').strip()

    cleaned_text = re.sub(r'^[\s.,!?¿¡]+|[\s.,!?¿¡]+$', '', cleaned_text)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    if not cleaned_text or len(cleaned_text) < 2:
        return ''

    return cleaned_text[0].upper() + cleaned_text[1:] if len(cleaned_text) > 1 else cleaned_text.upper()


def resolve_language_pair(detected_language: Optional[str]) -> Tuple[str, str]:
    if detected_language in {'spanish', 'es'}:
        return 'es', 'en'
    return 'en', 'es'


def _is_empty_or_too_short(clean_text: str, original_text: str) -> bool:
    return not original_text or len(clean_text) < 3 or original_text in ['.', '..', '...', '. .', '. . .']


def _matches_known_hallucination(clean_text: str) -> bool:
    return clean_text in CONVERSATION_HALLUCINATIONS or any(clean_text == pattern for pattern in CONVERSATION_HALLUCINATIONS)


def _starts_like_hallucination(clean_text: str) -> bool:
    return any(clean_text.startswith(f'{pattern} ') for pattern in ['thank', 'thanks', 'subscribe', 'like'])


def _is_only_punctuation(original_text: str) -> bool:
    return all(character in '.,!?¿¡ \n\t' for character in original_text)


def _is_single_word_hallucination(clean_text: str) -> bool:
    return len(clean_text.split()) == 1 and clean_text in CONVERSATION_HALLUCINATIONS


def is_conversation_hallucination(original_text: str) -> bool:
    lower_text = original_text.lower().strip()
    clean_text = re.sub(r'[^\w\s]', '', lower_text).strip()
    return (
        _is_empty_or_too_short(clean_text, original_text)
        or _matches_known_hallucination(clean_text)
        or _starts_like_hallucination(clean_text)
        or _is_only_punctuation(original_text)
        or _is_single_word_hallucination(clean_text)
    )


async def process_handsfree_check(audio: Any, api_key: str, logger: Any) -> Dict[str, Optional[str]]:
    audio_content = await audio.read()
    if len(audio_content) < MIN_HANDSFREE_AUDIO_BYTES:
        return {'trigger': None, 'text': ''}

    response, _ = await transcribe_audio_bytes(api_key, audio_content, audio.filename, response_format='json')
    raw_text = response.text.strip()
    text = normalize_transcript_text(raw_text)
    logger.info(f"Handsfree transcription: '{raw_text}' -> cleaned: '{text}'")

    if is_handsfree_hallucination(text):
        logger.info(f"Filtered hallucination: '{text}'")
        return {'trigger': None, 'text': ''}

    return detect_trigger(text, raw_text, logger)


async def process_handsfree_translation(audio: Any, api_key: str, db: Any) -> Dict[str, Any]:
    audio_content = await audio.read()
    if len(audio_content) < MIN_CONVERSATION_AUDIO_BYTES:
        return {'skipped': True}

    response, _ = await transcribe_audio_bytes(api_key, audio_content, audio.filename, response_format='verbose_json', prompt=None)
    cleaned_text = clean_handsfree_text(response.text.strip())
    if not cleaned_text:
        return {'skipped': True}

    source_lang, target_lang = resolve_language_pair(getattr(response, 'language', None))
    translated_text = await translate_text_content(api_key, cleaned_text, source_lang, target_lang, session_prefix='handsfree')
    audio_base64 = await synthesize_speech_base64(api_key, translated_text)
    await save_translation_history(
        db,
        original_text=cleaned_text,
        translated_text=translated_text,
        source_lang=source_lang,
        target_lang=target_lang,
    )

    return {
        'detected_language': source_lang,
        'original_text': cleaned_text,
        'translated_text': translated_text,
        'target_language': target_lang,
        'audio': audio_base64,
        'skipped': False,
    }


async def process_conversation_audio(audio: Any, api_key: str, db: Any, logger: Any) -> Dict[str, Any]:
    audio_content = await audio.read()
    if len(audio_content) < MIN_CONVERSATION_AUDIO_BYTES:
        return {
            'detected_language': None,
            'original_text': '',
            'translated_text': '',
            'audio': None,
            'skipped': True,
        }

    response, _ = await transcribe_audio_bytes(api_key, audio_content, audio.filename, response_format='verbose_json', prompt=None)
    original_text = response.text.strip()
    if is_conversation_hallucination(original_text):
        logger.info(f"Filtered hallucination: '{original_text}'")
        return {
            'detected_language': None,
            'original_text': '',
            'translated_text': '',
            'audio': None,
            'skipped': True,
        }

    source_lang, target_lang = resolve_language_pair(getattr(response, 'language', None))
    translated_text = await translate_text_content(api_key, original_text, source_lang, target_lang, session_prefix='conversation')
    audio_base64 = await synthesize_speech_base64(api_key, translated_text)
    await save_translation_history(
        db,
        original_text=original_text,
        translated_text=translated_text,
        source_lang=source_lang,
        target_lang=target_lang,
    )

    return {
        'detected_language': source_lang,
        'original_text': original_text,
        'translated_text': translated_text,
        'target_language': target_lang,
        'audio': audio_base64,
        'skipped': False,
    }