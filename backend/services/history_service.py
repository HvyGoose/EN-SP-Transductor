from datetime import datetime
from typing import Any, Dict, List

from models import TranslationHistory


async def save_translation_history(db: Any, *, original_text: str, translated_text: str, source_lang: str, target_lang: str) -> None:
    history_entry = TranslationHistory(
        original_text=original_text,
        translated_text=translated_text,
        source_lang=source_lang,
        target_lang=target_lang,
    )
    document = history_entry.model_dump()
    document['timestamp'] = document['timestamp'].isoformat()
    await db.translation_history.insert_one(document)


async def get_recent_translation_history(db: Any, limit: int = 50) -> List[Dict[str, Any]]:
    history: List[Dict[str, Any]] = await db.translation_history.find({}, {'_id': 0}).sort('timestamp', -1).limit(limit).to_list(limit)

    for entry in history:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])

    return history