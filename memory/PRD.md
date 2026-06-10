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
- Stripe payment integration for premium unlock

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations library
- **Frontend**: React with Swiss Brutalist design (grid borders, no rounded corners)
- **AI Services**: GPT-5.2 for translation, Whisper for STT, OpenAI TTS for voice output
- **PWA**: Service worker, manifest, installable on mobile
- **Offline**: Browser Speech APIs + cached phrasebook (250+ phrases)
- **Payments**: Stripe Checkout for premium upgrade ($4.99 one-time)

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
9. Free/Premium tier with Stripe payments
10. Offline mode (premium)

## What's Been Implemented

### Jan 2026 - MVP & Features
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
- ✅ Phrasebook browser (book button)

### Jun 2026 - Stripe Payment Integration
- ✅ Stripe Checkout integration (test mode ready, live when account approved)
- ✅ Payment modal with email capture (Crown button)
- ✅ POST /api/payments/create-checkout endpoint
- ✅ GET /api/payments/status/{session_id} endpoint
- ✅ POST /api/payments/check-premium endpoint
- ✅ Email-based premium status tracking in MongoDB
- ✅ "Restore Previous Purchase" functionality
- ✅ PaymentSuccess page with status polling
- ✅ React Router integration for /payment-success route
- ✅ Proper 404 handling for invalid session IDs

## Monetization
- **Free Tier**: Online translation, voice features, ads shown
- **Premium Tier**: $4.99 one-time payment, offline mode, no ads
- **Premium Tracking**: Email-based (no full auth system needed)

## API Endpoints

### Translation
- POST /api/translate - Text translation
- POST /api/speech-to-text - Audio transcription
- POST /api/text-to-speech - Generate audio
- POST /api/conversation - Full conversation flow (STT + translate + TTS)
- GET /api/history - Translation history

### Payments
- POST /api/payments/create-checkout - Create Stripe checkout session
- GET /api/payments/status/{session_id} - Check payment status
- POST /api/payments/check-premium - Check if email has premium
- POST /api/webhook/stripe - Stripe webhook handler

## Database Collections
- `translation_history` - Translation logs
- `payment_transactions` - Stripe session tracking
- `premium_users` - Email-based premium status

## Environment
- EMERGENT_LLM_KEY - All OpenAI services
- STRIPE_API_KEY - Stripe payments (test key in environment)
- MongoDB - Data persistence

## Prioritized Backlog
- P0: ✅ COMPLETE - MVP + Hands-Free + PWA + Offline + Stripe Payments
- P1: Deploy to production, submit to app stores
- P2: Native mobile app via Mobile Agent for full offline AI

## Next Tasks
1. Complete Stripe account setup (user in progress)
2. Switch Stripe test keys to live keys when account approved
3. Deploy to production
4. Submit to Microsoft Store (PWABuilder)
5. Submit to Google Play (TWA wrapper)

## Future Enhancements
- Build native iOS/Android app via Mobile Agent for Option 3 full offline
- Add more language pairs
- Voice profiles/personalization
