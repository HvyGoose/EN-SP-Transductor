from datetime import datetime, timezone
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class TranslationRequest(BaseModel):
    text: str
    source_lang: str = 'en'
    target_lang: str = 'es'


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str


class TTSRequest(BaseModel):
    text: str
    lang: str = 'en'


class TranslationHistory(BaseModel):
    model_config = ConfigDict(extra='ignore')

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CreateCheckoutRequest(BaseModel):
    origin_url: str
    email: Optional[str] = None


class CheckPremiumRequest(BaseModel):
    email: str