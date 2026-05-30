# English-Spanish Real-Time Translator PRD

## Original Problem Statement
Build a quick English to Spanish real-time translator with:
- AI-powered translation (GPT-5.2)
- Speech-to-text input (Whisper)
- Text-to-speech output (OpenAI TTS)
- Bidirectional support (English ↔ Spanish)
- Hands-free conversation mode with silence detection
- PWA support for mobile installation

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations library
- **Frontend**: React with Swiss Brutalist design (grid borders, no rounded corners)
- **AI Services**: GPT-5.2 for translation, Whisper for STT, OpenAI TTS for voice output
- **PWA**: Service worker, manifest, installable on mobile

## User Personas
- Language learners needing quick translations
- Travelers communicating across language barriers
- Business professionals in bilingual environments
- People needing hands-free translation (driving, cooking, etc.)

## Core Requirements (Static)
1. Real-time text translation with debounce
2. Bidirectional English ↔ Spanish support
3. Voice input (speech-to-text)
4. Audio output (text-to-speech)
5. Copy to clipboard functionality
6. Conversation mode (Press & Hold + Hands-Free)
7. Adjustable settings (Pause Duration, Noise Filter)
8. PWA installable on mobile

## What's Been Implemented (Jan 2026)
- ✅ GPT-5.2 powered translation API
- ✅ Whisper speech-to-text API
- ✅ OpenAI TTS text-to-speech API
- ✅ Bidirectional language swap
- ✅ Real-time translation with 500ms debounce
- ✅ Swiss Brutalist UI design
- ✅ Mobile responsive layout
- ✅ Translation history stored in MongoDB
- ✅ Conversation Mode - Press & Hold
- ✅ Conversation Mode - Hands-Free with silence detection
- ✅ Adjustable Pause Duration (1-5 seconds)
- ✅ Adjustable Noise Filter (Quiet → Noisy)
- ✅ Audio level visualization
- ✅ PWA support (installable on iOS/Android)
- ✅ User documentation (/guide.html)

## API Endpoints
- POST /api/translate - Text translation
- POST /api/speech-to-text - Audio transcription
- POST /api/text-to-speech - Generate audio
- POST /api/conversation - Full conversation flow (STT + translate + TTS)
- GET /api/history - Translation history

## Environment
- EMERGENT_LLM_KEY for all OpenAI services
- MongoDB for translation history

## Prioritized Backlog
- P0: ✅ Complete (MVP + Hands-Free + PWA)
- P1: More language pairs, native mobile app
- P2: Translation history UI, favorites, offline mode

## Next Tasks
1. Build native mobile app via Emergent Mobile Agent
2. Add more language pairs (French, German, etc.)
3. Show translation history in UI
4. Add keyboard shortcuts
