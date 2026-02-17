# Vox - AI Voice Telephony Platform

A real-time AI voice platform for building intelligent phone agents with sub-800ms round-trip latency.

## Features

- **Real-time Voice AI** - Sub-800ms response latency for natural conversations
- **Multi-tenant** - Support for multiple clients, assistants, and phone numbers
- **LLM Integration** - OpenRouter support for various LLM providers
- **Text-to-Speech** - Minimax TTS with streaming PCM output
- **Speech-to-Text** - Deepgram streaming transcription
- **Telephony** - Asterisk PBX + LiveKit WebRTC/SIP gateway
- **Barge-in** - Interrupt AI responses with voice activity detection

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                    http://localhost:3000                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                   Control Plane (FastAPI)                    │
│    REST API (8000) │ FastAGI (4573) │ Redis Routing (6379)  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌────────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
│   PostgreSQL    │  │   Agent Worker  │  │   LiveKit   │
│   (Port 5432)   │  │   AI Pipeline   │  │  (WebRTC)   │
└─────────────────┘  └─────────────────┘  └─────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
│   OpenRouter    │  │     Minimax     │  │   Deepgram  │
│    (LLM API)    │  │   (TTS API)     │  │  (STT API)  │
└─────────────────┘  └─────────────────┘  └─────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Frontend | Next.js 14, Tailwind CSS, Radix UI |
| Database | PostgreSQL 15, Alembic migrations |
| Cache | Redis 7 |
| Media | LiveKit, Asterisk PBX |
| LLM | OpenRouter (Llama 3.1 70B) |
| TTS | Minimax Speech-01-Turbo |
| STT | Deepgram Nova-2 |
| Auth | Supabase |
| Deployment | Docker Compose |

## Quick Start

### Prerequisites

- Docker Desktop
- Git
- API Keys (see Environment Variables)

### 1. Clone the repository

```bash
git clone https://github.com/leslieleefook/vox.git
cd vox
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start services

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
docker exec vox-control-plane alembic upgrade head
```

### 5. Access the application

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/v1/health

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `MINIMAX_API_KEY` | Minimax API key | Yes |
| `MINIMAX_GROUP_ID` | Minimax group ID | Yes |
| `DEEPGRAM_API_KEY` | Deepgram API key | Yes |
| `LIVEKIT_API_KEY` | LiveKit API key | No (dev mode) |
| `LIVEKIT_API_SECRET` | LiveKit API secret | No (dev mode) |

## API Endpoints

### Clients
- `POST /api/v1/clients` - Create a client
- `GET /api/v1/clients` - List clients
- `GET /api/v1/clients/{id}` - Get client
- `PATCH /api/v1/clients/{id}` - Update client
- `DELETE /api/v1/clients/{id}` - Delete client

### Assistants
- `POST /api/v1/assistants` - Create an assistant
- `GET /api/v1/assistants` - List assistants
- `GET /api/v1/assistants/{id}` - Get assistant
- `PATCH /api/v1/assistants/{id}` - Update assistant
- `DELETE /api/v1/assistants/{id}` - Delete assistant

### Phone Numbers
- `POST /api/v1/phone-numbers` - Assign phone number
- `GET /api/v1/phone-numbers` - List phone numbers
- `DELETE /api/v1/phone-numbers/{number}` - Unassign phone number

### Call Logs
- `POST /api/v1/call-logs` - Create call log
- `GET /api/v1/call-logs` - List call logs (paginated)
- `GET /api/v1/call-logs/{id}` - Get call log

### Health
- `GET /api/v1/health` - System health status

## Project Structure

```
vox/
├── agent-worker/          # AI voice pipeline worker
│   ├── app/
│   │   ├── handlers/      # Barge-in handler
│   │   ├── pipeline/      # Bot pipeline
│   │   └── services/      # LLM, TTS, STT, VAD
│   └── Dockerfile
├── control-plane/         # FastAPI REST API
│   ├── alembic/           # Database migrations
│   ├── app/
│   │   ├── api/           # REST & AGI endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   └── services/      # Redis routing
│   └── Dockerfile
├── frontend/              # Next.js dashboard
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   └── components/    # Vox UI components
│   └── tests/             # Playwright tests
├── telephony/             # Telephony configs
│   ├── asterisk/          # PJSIP, dialplan, RTP
│   └── livekit/           # LiveKit & SIP gateway
├── scripts/               # Test scripts
├── docs/                  # Documentation
└── docker-compose.yml
```

## Latency Targets

| Component | Target | Typical |
|-----------|--------|---------|
| TTS First Chunk | <200ms | 150-300ms |
| STT First Result | <200ms | 100-250ms |
| LLM First Token | <500ms | 300-600ms |
| **Total Round-trip** | **<800ms** | **600-900ms** |

## Development

### Run tests

```bash
# Control plane tests
docker exec vox-control-plane pytest

# Frontend tests
cd frontend && npm run test
```

### Latency tests

```bash
# TTS latency
python scripts/test_tts_simple.py

# STT latency
python scripts/test_stt_simple.py
```

### View logs

```bash
docker compose logs -f control-plane
docker compose logs -f frontend
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
