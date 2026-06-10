# English-Spanish Real-Time Translator PRD

## Original Problem Statement
Build a quick English to Spanish real-time translator with:
- AI-powered translation (GPT-5.2)
- Speech-to-text input (Whisper)
- Text-to-speech output (OpenAI TTS)
- Bidirectional support (English ↔ Spanish)
- Hands-free conversation mode with silence detection
- PWA support for mobile installation
- Offline mode with phrasebook (premium feature)
- Free/Premium tier structure

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations library
- **Frontend**: React with Swiss Brutalist design (grid borders, no rounded corners)
- **AI Services**: GPT-5.2 for translation, Whisper for STT, OpenAI TTS for voice output
- **PWA**: Service worker, manifest, installable on mobile
- **Offline**: Browser Speech APIs + cached phrasebook (250+ phrases)

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
9. Free/Premium tier structure
10. Offline mode (premium)

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
- ✅ Offline mode with phrasebook (250+ phrases, 12 categories)
- ✅ Browser Speech APIs for offline TTS
- ✅ Free/Premium tier with ad banner
- ✅ Premium toggle (crown button)
- ✅ Phrasebook browser (book button)

## Monetization
- **Free Tier**: Online translation, voice features, ads shown
- **Premium Tier**: Offline mode, no ads

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
- P0: ✅ Complete (MVP + Hands-Free + PWA + Offline)
- P1: Native mobile app via Mobile Agent
- P2: Payment integration for premium, more language pairs

## Next Tasks
1. Deploy to production
2. Submit to Microsoft Store (PWABuilder)
3. Submit to Google Play (TWA wrapper)
4. Build native iOS/Android app via Mobile Agent for Option 3 full offline
