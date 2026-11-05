# Off-Emergent Deployment Guide — EN-SP-Transductor

This backend no longer depends on Emergent. Everything below uses your own
OpenAI and Stripe accounts. Frontend is unchanged — it already reads
`REACT_APP_BACKEND_URL` at build time.

## 1. Accounts you need (all free to create)

| Account | What it's for | Cost |
|---|---|---|
| OpenAI (platform.openai.com) | Translation + speech | pay-per-use, a few $/mo at your traffic |
| Stripe (dashboard.stripe.com) | Premium $4.99 checkout | per-transaction fee only |
| Railway (railway.app) or Render | Host the backend + frontend | ~$5–7/mo |
| MongoDB Atlas (mongodb.com/atlas) | Database | free M0 tier |

## 2. MongoDB Atlas (free)

1. Create an M0 (free) cluster.
2. Database → Connect → Drivers → Python → copy the connection string
   (`mongodb+srv://...`). Set a database user password when asked.
3. Network Access → allow your host's IP (or `0.0.0.0/0` for any host).

## 3. OpenAI key

platform.openai.com → API keys → Create. Set a small monthly budget cap
(e.g. $10) under Usage/Billing so a bug or abuse can't run up a bill.

## 4. Stripe keys

1. Dashboard → Developers → API keys: copy the **secret** key.
2. Activate the account before going live (needed for real charges).
3. Webhooks: Add endpoint `https://YOUR-APP-URL.up.railway.app/api/webhook/stripe`,
   select the `checkout.session.completed` event, copy the endpoint's
   **Signing secret** (`whsec_...`).

## 5. Deploy backend on Railway

1. Push this repo to GitHub (done — HvyGoose/EN-SP-Transductor).
2. railway.app → New Project → Deploy from GitHub repo.
3. Add a **Root Directory** service variable pointing at the repo root, or add
   a `railway.toml`/`nixpacks.toml`; simplest: create the service, then in
   Settings set the start command to:
   ```
   cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
   ```
   and the build to `pip install -r backend/requirements.txt`.
4. Variables (Railway → Variables):
   - `MONGO_URL` = Atlas connection string
   - `DB_NAME` = `translator`
   - `OPENAI_API_KEY` = your OpenAI key
   - `STRIPE_API_KEY` = your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = the whsec_ from step 4
   - `CORS_ORIGINS` = `*` for now; tighten to your frontend URL later
5. Deploy → copy the generated URL (e.g. `https://xxx.up.railway.app`).

## 6. Deploy frontend on Railway (same project, second service)

1. New service → same repo, root directory `frontend`.
2. Variables: `REACT_APP_BACKEND_URL` = the backend URL from step 5
   (no trailing slash).
3. Build command: `yarn install && yarn build`; serve `build/` with any static
   server (e.g. `npx serve -s build -l $PORT`).

## 7. Repoint the Microsoft Store app

The installed app calls `REACT_APP_BACKEND_URL` baked in at build time. After
the new frontend is live: rebuild with the new URL, repackage, and submit an
update to the Store listing. Reviews/ratings/installs are unaffected.

## 8. Local dev (no Emergent, no cloud)

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # fill in keys; local mongod works for MONGO_URL
uvicorn server:app --reload --port 8000
```

## What changed vs. the Emergent version

- `services/translation_service.py` — OpenAI Chat Completions directly
- `services/speech_service.py` — OpenAI Whisper STT + TTS directly
- `services/payment_service.py` — Stripe library directly (adds
  `STRIPE_WEBHOOK_SECRET`)
- `server.py` — `EMERGENT_LLM_KEY` replaced by `OPENAI_API_KEY`
- `requirements.txt` — trimmed to 9 packages (was 110+)
