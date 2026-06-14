import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage


LANGUAGE_NAMES = {'en': 'English', 'es': 'Spanish'}


def resolve_language_names(source_lang, target_lang):
    return LANGUAGE_NAMES.get(source_lang, 'English'), LANGUAGE_NAMES.get(target_lang, 'Spanish')


async def translate_text_content(api_key, text, source_lang, target_lang, *, session_prefix='translate'):
    source_name, target_name = resolve_language_names(source_lang, target_lang)
    chat = LlmChat(
        api_key=api_key,
        session_id=f'{session_prefix}-{uuid.uuid4()}',
        system_message=(
            f'You are a professional translator. Translate the following text from {source_name} '
            f'to {target_name}. Only respond with the translation, nothing else. '
            'Do not add explanations or notes.'
        )
    ).with_model('openai', 'gpt-5.2')

    return await chat.send_message(UserMessage(text=text))