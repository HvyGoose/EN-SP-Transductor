# English-Spanish Real-Time Translator PRD

## Original Problem Statement
Build a quick English to Spanish real-time translator with:
- AI-powered translation (GPT-5.2)
- Speech-to-text input (Whisper)
- Text-to-speech output (OpenAI TTS)
- Bidirectional support (English ↔ Spanish)

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations library
- **Frontend**: React with Swiss Brutalist design (grid borders, no rounded corners)
- **AI Services**: GPT-5.2 for translation, Whisper for STT, OpenAI TTS for voice output

## User Personas
- Language learners needing quick translations
- Travelers communicating across language barriers
- Business professionals in bilingual environments

## Core Requirements (Static)
1. Real-time text translation with debounce
2. Bidirectional English ↔ Spanish support
3. Voice input (speech-to-text)
4. Audio output (text-to-speech)
5. Copy to clipboard functionality
6. Clean, functional UI

## What's Been Implemented (Jan 2026)
- ✅ GPT-5.2 powered translation API
- ✅ Whisper speech-to-text API
- ✅ OpenAI TTS text-to-speech API
- ✅ Bidirectional language swap
- ✅ Real-time translation with 500ms debounce
- ✅ Swiss Brutalist UI design
- ✅ Mobile responsive layout
- ✅ Translation history stored in MongoDB

## API Endpoints
- POST /api/translate - Text translation
- POST /api/speech-to-text - Audio transcription
- POST /api/text-to-speech - Generate audio
- GET /api/history - Translation history

## Environment
- EMERGENT_LLM_KEY for all OpenAI services
- MongoDB for translation history

## Prioritized Backlog
- P0: ✅ Complete (MVP)
- P1: Add language detection, more language pairs
- P2: Translation history UI, favorites

## Next Tasks
1. Add more language pairs (French, German, etc.)
2. Show translation history in UI
3. Add keyboard shortcuts
