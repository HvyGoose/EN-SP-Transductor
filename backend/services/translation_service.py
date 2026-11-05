"""Translation via the OpenAI API directly (no Emergent proxy)."""
import os
import uuid
from typing import Tuple

from openai import AsyncOpenAI


LANGUAGE_NAMES = {'en': 'English', 'es': 'Spanish'}
DEFAULT_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-5.2')


def resolve_language_names(source_lang: str, target_lang: str) -> Tuple[str, str]:
    return LANGUAGE_NAMES.get(source_lang, 'English'), LANGUAGE_NAMES.get(target_lang, 'Spanish')


async def translate_text_content(api_key: str, text: str, source_lang: str, target_lang: str, *, session_prefix: str = 'translate') -> str:
    source_name, target_name = resolve_language_names(source_lang, target_lang)
    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[
            {
                'role': 'system',
                'content': (
                    f'You are a professional translator. Translate the following text from {source_name} '
                    f'to {target_name}. Only respond with the translation, nothing else. '
                    'Do not add explanations or notes.'
                ),
            },
            {'role': 'user', 'content': text},
        ],
    )
    return response.choices[0].message.content.strip()
