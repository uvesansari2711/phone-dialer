# Phone Dialer

A mobile-first Twilio dialer application. Enter a phone number on a traditional keypad UI, place outbound calls through your browser using the Twilio Voice SDK, and view persistent call history.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Twilio Voice SDK
- **Backend:** Node.js, Express, TypeScript, Twilio Node SDK
- **Database:** MongoDB (call history + webhook-driven status updates)

## Architecture

```
Browser (React + Voice SDK)
        │ REST API
        ▼
Express Backend ──► Twilio ──► Destination Phone
        │
        ▼
     MongoDB ◄── Twilio status webhooks
```

Twilio credentials never reach the frontend. The backend issues short-lived access tokens and serves TwiML/webhooks.

## Prerequisites

- Node.js 20+
- MongoDB (local, Docker, or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Twilio account with:
  - A Voice-enabled phone number
  - An API Key + Secret
  - A TwiML App

## Installation

```bash
git clone <repo-url>
cd phone-dialer
npm install
```

## Environment Setup

### Server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:5000

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_API_KEY_SID=SK...
TWILIO_API_KEY_SECRET=...
TWILIO_TWIML_APP_SID=AP...

MONGODB_URI=mongodb://localhost:27017/phone-dialer
```

### Client

```bash
cp client/.env.example client/.env
```

```env
VITE_API_URL=http://localhost:5000
```

## Twilio Console Setup

1. **Get credentials** from the [Twilio Console](https://console.twilio.com):
   - Account SID and Auth Token
   - Purchase or use an existing Voice-capable phone number

2. **Create an API Key:**
   - Console → Account → API Keys → Create new key
   - Save the SID (`SK...`) and Secret

3. **Create a TwiML App:**
   - Console → Voice → TwiML Apps → Create
   - Voice Request URL: `{PUBLIC_BASE_URL}/api/twilio/voice`
   - HTTP POST
   - Save the App SID (`AP...`)

4. **Expose backend publicly for local dev** (required for Twilio webhooks):

   Using ngrok:
   ```bash
   ngrok http 5000
   ```

   Set `PUBLIC_BASE_URL` in `server/.env` to the ngrok HTTPS URL (e.g. `https://abc123.ngrok.io`).

   Update the TwiML App Voice URL in Twilio Console to match.

## Running Locally

### Start MongoDB (if not using Atlas)

```bash
docker run -d -p 27017:27017 --name phone-dialer-mongo mongo
```

### Start the app

```bash
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

Open http://localhost:5173 on your phone or desktop browser.

## Testing a Call

1. Ensure MongoDB is running and env vars are set.
2. Start the app with `npm run dev`.
3. Expose port 5000 via ngrok and update `PUBLIC_BASE_URL`.
4. Open the dialer in Chrome (microphone permission required).
5. Enter a number, e.g. `+919512168389`.
6. Tap **Call** — you'll see Calling → Ringing → Connected with a timer.
7. Tap **End** to hang up.
8. The call appears in **Call History**.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/twilio/token` | Voice SDK access token |
| POST | `/api/calls` | Create call record, validate number |
| PATCH | `/api/calls/:callId/sid` | Link Twilio CallSid to record |
| GET | `/api/calls` | List call history |
| GET | `/api/calls/:callSid` | Get call by Twilio SID |
| POST | `/api/calls/:callSid/end` | End active call |
| POST | `/api/twilio/voice` | TwiML webhook (Twilio only) |
| POST | `/api/twilio/status` | Status callback webhook |

## Running Tests

```bash
npm test
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing required environment variable` | Incomplete `.env` | Fill all vars in `server/.env` |
| `Unable to get microphone permission` | Browser blocked mic | Allow microphone in browser settings |
| `Invalid Access Token` | Wrong API Key or TwiML App SID | Verify `TWILIO_API_KEY_*` and `TWILIO_TWIML_APP_SID` |
| Calls fail immediately | Webhook URL not reachable | Use ngrok; set `PUBLIC_BASE_URL` |
| Error 21211 | Invalid phone number | Use E.164 format (`+countrycode...`) |
| Error 20003 | Auth failure | Check Account SID and Auth Token |
| Insufficient balance | Twilio account balance | Add funds in Twilio Console |
| No call history updates | MongoDB not connected | Check `MONGODB_URI` and MongoDB is running |

## Project Structure

```
phone-dialer/
├── client/          # React frontend
├── server/          # Express backend
├── package.json     # Root workspace scripts
└── README.md
```

## Security Notes

- Twilio Auth Token and API Key Secret are server-only
- Webhook endpoints validate Twilio request signatures
- Frontend cannot set the caller ID — `TWILIO_PHONE_NUMBER` is enforced server-side
- Error responses never expose stack traces or internal details
