# Project Vox - Progress Tracker

## Current Status
**Phase:** Tool Testing Feature - Completed
**Last Updated:** 2026-02-19

## Tool Testing Feature (2026-02-19)

### Backend Files Modified
- `control-plane/app/api/v1/schemas.py` - Added ToolTestRequest, ToolTestResponse schemas
- `control-plane/app/api/v1/endpoints.py` - Added POST /tools/{id}/test endpoint with credential resolution
- `control-plane/requirements.txt` - Added pytest, pytest-asyncio for testing

### Backend Files Created
- `control-plane/tests/__init__.py` - Test package init
- `control-plane/tests/conftest.py` - Pytest fixtures (mock_db, mock_tool, mock_credential, mock_httpx_response)
- `control-plane/tests/test_tool_endpoint.py` - 12 test cases for tool test endpoint
- `control-plane/pyproject.toml` - Pytest configuration

### Frontend Files Created
- `frontend/src/components/ui/dialog.tsx` - shadcn/ui Dialog component
- `frontend/src/components/tools/ToolTestModal.tsx` - Tool test modal with JSON input and result display

### Frontend Files Modified
- `frontend/src/lib/api/types.ts` - Added ToolTestRequest, ToolTestResponse interfaces
- `frontend/src/lib/api/tools.ts` - Added test() method to toolsApi
- `frontend/src/components/tools/ToolEditor.tsx` - Integrated ToolTestModal, enabled Test button

### Frontend Tests Modified
- `frontend/tests/tools.spec.ts` - Added 6 E2E tests for tool testing feature

### Features
- Test button enabled for saved tools (disabled for new unsaved tools)
- Test modal with JSON parameter input
- Credential resolution and auth header injection (bearer, api_key, basic)
- Custom headers from server_config
- Response truncation (10KB limit)
- Error handling for timeout, connection, and auth errors
- Visual feedback with status icons and colored result panels

### API Endpoint Added
- `POST /api/v1/tools/{id}/test` - Test tool connectivity
  - Accepts optional `parameters` object
  - Returns `success`, `status_code`, `response_time_ms`, `response_body`, `error`, `error_type`

### Test Results
- Frontend TypeScript: ✓ Compiles without errors
- Frontend Build: ✓ Successful (Next.js 14.1.0)
- Frontend ESLint: ✓ No warnings or errors
- Backend Tests: 12 test cases created (require database to run)

## Next Steps
1. Tool code view - JSON preview
2. Credential creation flow - Full credential manager
3. Run backend tests with database connection

---

## Tool-to-Assistant Linking (2026-02-19)

### New Database Table
- `assistant_tools` - Many-to-many junction table
  - assistant_id (FK to assistants.id, ON DELETE CASCADE)
  - tool_id (FK to tools.id, ON DELETE CASCADE)
  - created_at
  - PRIMARY KEY (assistant_id, tool_id)

### Backend Files Created
- `control-plane/alembic/versions/006_assistant_tools.py` - DB migration

### Backend Files Modified
- `control-plane/app/models/models.py` - Added assistant_tools Table, Assistant.tools and Tool.assistants relationships
- `control-plane/app/api/v1/schemas.py` - Added tool_ids to AssistantCreate/Update/Response, added ToolBrief schema
- `control-plane/app/api/v1/endpoints.py` - Updated assistant CRUD to handle tool associations with direct junction table inserts

### Frontend Files Created
- `frontend/src/components/assistants/ToolsSelectionSection.tsx` - Collapsible accordion for tool selection

### Frontend Files Modified
- `frontend/src/lib/api/types.ts` - Added tool_ids to Assistant, AssistantCreate, AssistantUpdate; added ToolBrief
- `frontend/src/lib/api/tools.ts` - Added listBrief() method for lightweight tool fetching
- `frontend/src/components/assistants/AssistantFormModal.tsx` - Integrated ToolsSelectionSection

### Features
- Checkbox list of available tools in assistant form
- Auto-expands when tools are already selected (editing)
- Shows count badge of selected tools
- Empty state when no tools available
- Sync tool associations on create/update

### API Changes
- `POST /assistants` - Accepts optional `tool_ids` array
- `PATCH /assistants/{id}` - Accepts optional `tool_ids` array (empty clears associations)
- `GET /assistants/{id}` - Returns `tool_ids` array
- `GET /assistants` - Returns `tool_ids` array for each assistant

### End-to-End Test Results
- Migration 006_assistant_tools applied successfully ✓
- API POST /assistants with tool_ids creates associations ✓
- API GET /assistants returns tool_ids ✓
- API PATCH /assistants syncs tool associations ✓
- Frontend TypeScript compiles without errors ✓
- Frontend build successful ✓
- ESLint passes with no warnings ✓

### Repository Cleanup (2026-02-19)

**Files Added:**
- `frontend/src/lib/supabase/client.ts` - Browser Supabase client
- `frontend/src/lib/supabase/server.ts` - Server Supabase client
- `frontend/src/lib/supabase/database.types.ts` - TypeScript type definitions
- `frontend/src/lib/utils.ts` - shadcn/ui cn() utility function
- `frontend/tests/tools.spec.ts` - Playwright E2E tests for Tools page

**Files Removed:**
- Screenshot files (7 *.png files in frontend/)
- Windows artifact files (nul files)
- Build cache (tsconfig.tsbuildinfo)

**.gitignore Updates:**
- Added `supabase/volumes/` (database data)
- Added `*.tsbuildinfo` (TypeScript build cache)
- Added `next-env.d.ts` (auto-generated Next.js TypeScript references)

## Next Steps
1. Tool testing feature - Test button functionality
2. Tool code view - JSON preview
3. Credential creation flow - Full credential manager

---

## Tools (MCP) Configuration Module (2026-02-18)

### New Database Tables
- `tools` - MCP Tool configuration for assistants
  - id, client_id, name, description, type
  - server_config (JSON), mcp_config (JSON), messages (JSON array)
- `credentials` - Secure credential storage for tools
  - id, client_id, name, type, value_encrypted

### Backend Files Created
- `control-plane/app/models/models.py` - Added Tool and Credential models
- `control-plane/app/api/v1/schemas.py` - Added Tool/Credential Pydantic schemas
- `control-plane/app/api/v1/endpoints.py` - Added CRUD endpoints for /tools and /credentials
- `control-plane/app/services/encryption.py` - Fernet encryption for credential storage
- `control-plane/alembic/versions/005_tools_credentials.py` - DB migration

### Frontend Files Created
- `frontend/src/app/(dashboard)/tools/page.tsx` - Tools list page
- `frontend/src/app/(dashboard)/tools/[id]/page.tsx` - Tool editor page
- `frontend/src/components/tools/ToolEditor.tsx` - Main tool editor component
- `frontend/src/components/tools/ToolSettingsSection.tsx` - Tool name/description
- `frontend/src/components/tools/ServerSettingsSection.tsx` - URL, timeout, headers, encryption
- `frontend/src/components/tools/McpSettingsSection.tsx` - Protocol selection (SHTTP/SSE)
- `frontend/src/components/tools/MessagesSection.tsx` - Dynamic messages list
- `frontend/src/components/tools/DynamicList.tsx` - Reusable add/remove list component
- `frontend/src/components/tools/ProtocolCard.tsx` - Radio card for protocol selection
- `frontend/src/components/ui/accordion.tsx` - Accordion component
- `frontend/src/lib/api/tools.ts` - Tool API service
- `frontend/src/lib/api/credentials.ts` - Credential API service
- `frontend/src/lib/constants/toolTypes.ts` - Tool type definitions

### Files Modified
- `control-plane/app/models/__init__.py` - Export Tool, Credential
- `control-plane/app/api/v1/__init__.py` - Export new schemas
- `control-plane/app/services/__init__.py` - Export encryption functions
- `control-plane/requirements.txt` - Added cryptography
- `frontend/src/lib/api/types.ts` - Added Tool, Credential interfaces
- `frontend/src/app/(dashboard)/layout.tsx` - Added Tools navigation link

### Tool Configuration Features
- Tool name validation (alphanumeric, underscore, hyphen only)
- Server URL input with validation
- Timeout setting (1-300 seconds)
- Credential dropdown for authorization
- Dynamic HTTP headers (add/remove)
- Encryption paths for sensitive JSON fields
- MCP Protocol selection (SHTTP vs SSE radio cards)
- Conversational messages (On Start, On Success, On Error)
- Save/Delete tool functionality

### JSON Schema Examples

**server_config:**
```json
{
  "url": "https://api.example.com/function",
  "timeoutSeconds": 20,
  "credentialId": null,
  "headers": [{"key": "X-Custom-Header", "value": "custom-value"}],
  "encryption": {"paths": ["user.ssn", "payment.cardNumber"]}
}
```

**mcp_config:**
```json
{"protocol": "shttp"}
```

**messages:**
```json
[
  {"trigger": "on_start", "message": "Let me look that up for you..."},
  {"trigger": "on_success", "message": "I found what you need."},
  {"trigger": "on_error", "message": "Sorry, I couldn't complete that request."}
]
```

### API Endpoints Added
- `POST /api/v1/tools` - Create tool
- `GET /api/v1/tools` - List tools (paginated, filterable by client_id)
- `GET /api/v1/tools/{id}` - Get tool
- `PATCH /api/v1/tools/{id}` - Update tool
- `DELETE /api/v1/tools/{id}` - Delete tool
- `POST /api/v1/credentials` - Create credential (encrypts value)
- `GET /api/v1/credentials` - List credentials (without values)
- `GET /api/v1/credentials/{id}` - Get credential (without value)
- `PATCH /api/v1/credentials/{id}` - Update credential
- `DELETE /api/v1/credentials/{id}` - Delete credential

### End-to-End Test Results
- Migration 005_tools_credentials applied successfully ✓
- API POST /tools creates tool ✓
- API GET /tools returns tools list ✓
- API POST /credentials creates encrypted credential ✓
- API GET /credentials returns credentials (without values) ✓
- Frontend TypeScript compiles without errors ✓
- Frontend build successful ✓
- ESLint passes with no warnings ✓

---

## Model Configuration Module (2026-02-18)

### New Database Fields
- `llm_provider` - LLM provider selection (openrouter, openai, anthropic) - default: openrouter
- `first_message_mode` - First message mode (assistant-first, user-first, wait-trigger) - default: assistant-first
- `temperature` - LLM temperature (0.0-2.0) - default: 0.7
- `max_tokens` - Maximum response tokens (1-32000) - default: 256
- `rag_file_ids` - RAG file IDs for knowledge base (future feature) - nullable

### New Files Created
- `frontend/src/components/assistants/ModelConfigSection.tsx` - Model config accordion component
- `frontend/src/components/vox/VoxSlider.tsx` - Glass-morphism slider with synchronized number input
- `frontend/src/lib/constants/llmProviders.ts` - Provider/model definitions (OpenRouter, OpenAI, Anthropic)
- `control-plane/alembic/versions/004_model_config.py` - DB migration

### Files Modified
- `frontend/src/components/assistants/AssistantFormModal.tsx` - Integrated ModelConfigSection
- `frontend/src/lib/api/types.ts` - Added llm_provider, first_message_mode, temperature, max_tokens
- `frontend/src/components/vox/index.ts` - Export VoxSlider
- `control-plane/app/models/models.py` - Added model config fields
- `control-plane/app/api/v1/schemas.py` - Added new fields to schemas

### Model Configuration Features
- Collapsible accordion for model settings
- Provider/Model coupled dropdowns:
  - OpenRouter: Llama 3.1 70B/8B, Groq variants, DeepSeek, Claude 3 Haiku
  - OpenAI: GPT-4o, GPT-4o Mini, GPT-4 Turbo
  - Anthropic: Claude 3.5 Sonnet, Claude 3 Haiku
- First Message Mode selection:
  - Assistant First - speaks immediately when call connects
  - User First - waits for user to speak
  - Wait for Trigger - waits for specific trigger event
- System Prompt textarea with placeholder AI Generate button
- Temperature slider (0.0-2.0) with synchronized number input
- Max Tokens input (1-32000)
- Files (RAG) disabled placeholder for Phase 2

### UI Behavior
1. Provider change auto-resets model to first available for that provider
2. First message input disabled when "user-first" or "wait-trigger" mode selected
3. Temperature slider syncs with number input
4. Accordion auto-expands if non-default settings detected

### End-to-End Test Results
- API POST /assistants returns all new model config fields ✓
- API accepts llm_provider, temperature, max_tokens values ✓
- Migration 004_model_config applied successfully ✓
- Frontend TypeScript compiles without errors ✓
- Frontend build successful ✓
- ESLint passes with no warnings ✓

### Sample API Response (with new fields)
```json
{
  "llm_provider": "openai",
  "llm_model": "gpt-4o",
  "first_message_mode": "user-first",
  "temperature": 0.5,
  "max_tokens": 512,
  "rag_file_ids": null
}
```

## Next Steps
1. AI Prompt Generation - Generate system prompts with AI button
2. Files (RAG) upload - Knowledge base file management
3. Transcriber Configuration Module - STT provider, language, sensitivity

---

## Voice Configuration Enhancement (2026-02-18)

### New Database Fields
- `tts_model` - MiniMax TTS model selection (default: speech-02-turbo)
- `tts_is_manual_id` - Toggle for using custom/cloned voice IDs (default: false)

### New Files Created
- `frontend/src/components/assistants/VoiceConfigSection.tsx` - Voice config accordion component
- `frontend/src/lib/constants/minimaxVoices.ts` - Extended MiniMax voice list (11 voices)
- `control-plane/alembic/versions/003_voice_config.py` - DB migration

### Files Modified
- `frontend/src/components/assistants/AssistantFormModal.tsx` - Integrated VoiceConfigSection
- `frontend/src/lib/api/types.ts` - Added tts_model, tts_is_manual_id fields
- `control-plane/app/models/models.py` - Added tts_model, tts_is_manual_id fields
- `control-plane/app/api/v1/schemas.py` - Added new fields to schemas

### Voice Configuration Features
- Collapsible accordion for voice settings
- Expanded MiniMax voice list (11 voices: Mallory, Wise Man, Friendly Girl, Seraphina, Alex, Qingse, Shaonv, Jingying, Yujie, Badao, Chengshu)
- Model selection (speech-02-turbo for speed, speech-02-hd for quality)
- Manual Voice ID toggle for cloned voices
- Auto-expands when manual mode is enabled

---

## Backend Services Running
| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | ✓ Healthy |
| Redis | 6379 | ✓ Healthy |
| Control Plane (FastAPI) | 8000, 4573 | ✓ Running |
| LiveKit | 7880, 7881 | ✓ Running |
| LiveKit SIP | 5060 | ✓ Running |
| Asterisk | 5080 | ✓ Healthy |

### Frontend Test Results (2026-02-18)
- **Build:** ✓ Passes (Next.js 14.1.0)
- **TypeScript:** ✓ No errors
- **ESLint:** ✓ No warnings or errors
- **Playwright E2E (all browsers):** 88 passed, 1 skipped, 0 failed

### Test Breakdown (89 total tests, 1 skipped)
| Test Suite | Chromium | Firefox | WebKit | Total |
|------------|----------|---------|--------|-------|
| Assistants Page (5 tests) | 5 passed | 5 passed | 5 passed | 15 |
| Assistant Card (2 tests) | 2 passed | 2 passed | 2 passed | 6 |
| Auth Flow (5 tests) | 5 passed | 5 passed | 4 passed, 1 skipped | 14 |
| Calls Page (3 tests) | 3 passed | 3 passed | 3 passed | 9 |
| Components (3 tests) | 3 passed | 3 passed | 3 passed | 9 |
| Navigation (6 tests) | 6 passed | 6 passed | 6 passed | 18 |
| Analytics Page (3 tests) | 3 passed | 3 passed | 3 passed | 9 |
| Settings Page (4 tests) | 4 passed | 4 passed | 4 passed | 12 |

---

## Assistant Configuration Enhancement (2026-02-18)

### New Database Fields
- `stt_provider` - Speech-to-text provider selection (default: deepgram)
- `structured_output_schema` - JSON schema for structured call analysis
- `webhook_url` - URL to receive POST requests when calls end

### Backend Changes
- `control-plane/app/models/models.py` - Added new fields to Assistant model
- `control-plane/app/api/v1/schemas.py` - Updated Pydantic schemas
- `control-plane/alembic/versions/002_add_assistant_config_fields.py` - Migration

### Frontend Changes
- `frontend/src/lib/api/types.ts` - Updated TypeScript interfaces
- `frontend/src/components/assistants/AssistantFormModal.tsx` - Enhanced form with:
  - 3-column layout for Voice, STT, LLM dropdowns
  - Collapsible Advanced Settings section
  - JSON schema editor for structured output
  - Webhook URL input field
  - Form validation for JSON and URL formats

### Form Options

| Field | Options |
|-------|---------|
| Voice (TTS) | Mallory, Wise Man, Friendly Girl, Seraphina, Alex |
| Speech-to-Text | Deepgram (Recommended), Whisper, AssemblyAI |
| LLM Model | Groq Llama 3.1 8B/70B, OpenRouter Llama 70B, DeepSeek Chat, Claude 3 Haiku |

---

## Completed

### Phase 1: Control Plane ✓
- [x] Project structure setup
- [x] Docker Compose configuration
- [x] FastAPI application skeleton
- [x] PostgreSQL models (Clients, Assistants, PhoneNumbers, CallLogs)
- [x] Alembic migrations
- [x] FastAGI handler
- [x] Redis routing service
- [x] Health endpoints

### Phase 2: AI/Voice Pipeline ✓
- [x] Agent worker structure
- [x] OpenRouter LLM service
- [x] Minimax TTS service
- [x] Deepgram STT service
- [x] WebRTC VAD service
- [x] Barge-in handler
- [x] Bot pipeline

### Phase 3: Telephony ✓
- [x] Asterisk PJSIP configuration
- [x] Asterisk dialplan with AGI
- [x] RTP configuration
- [x] LiveKit server configuration
- [x] LiveKit SIP gateway configuration

### Phase 4: Frontend ✓
- [x] Next.js 14 App Router setup
- [x] Tailwind CSS with Lumina design system
- [x] VoxCard, PulseIndicator, VoxButton, VoxInput, VoxBadge, VoxSlider components
- [x] Dashboard layout
- [x] Assistants page
- [x] Call logs page
- [x] Login page
- [x] Supabase client setup
- [x] Playwright E2E tests

### Phase 7: Frontend API Integration ✓
- [x] API types (types.ts) - TypeScript interfaces for API responses
- [x] API client (client.ts) - Fetch wrapper with error handling
- [x] API services (assistants.ts, calls.ts) - CRUD operations
- [x] React hooks (useAssistants.ts, useCallLogs.ts) - Loading/error states
- [x] UI components (LoadingSkeleton, ErrorState, AssistantFormModal)
- [x] Assistants page - Real API integration with create/edit/delete
- [x] Calls page - Real API integration with pagination

### Phase 5: Docker Deployment ✓
- [x] Docker images built successfully
- [x] All containers running
- [x] Service health verified

### Phase 6: Integration Testing ✓
- [x] Database migrations verified
- [x] API endpoints tested (clients, assistants, call-logs)
- [x] Health checks passing
- [x] Sample data created

---

## Latency Test Results (2026-02-17)

| Service | Measured | Target | Status |
|---------|----------|--------|--------|
| TTS (Minimax) | 1213ms avg | <200ms | FAIL |
| STT (Deepgram) | 822ms | <200ms | FAIL |
| **Round-trip** | ~2000ms+ | <800ms | FAIL |

**Notes:**
- First TTS request showed cold start (2224ms), subsequent ~950ms
- Deepgram connection: 1642ms, first transcript: 822ms
- External API latency is the bottleneck

## Running Services

| Service | Port | Status |
|---------|------|--------|
| Frontend (Next.js) | 3000 | ✓ Running |
| Control Plane (FastAPI) | 8000, 4573 | ✓ Running |
| PostgreSQL | 5432 | ✓ Healthy |
| Redis | 6379 | ✓ Healthy |
| LiveKit | 7880, 7881, 40000-40200/udp | ✓ Running |
| LiveKit SIP | 5060 | ✓ Running |
| Asterisk | 5080, 10000-10100/udp | ✓ Healthy |

## API Health Status (2026-02-18)

```json
{
  "status": "healthy",
  "database": "healthy",
  "redis": "healthy",
  "version": "1.0.0"
}
```

## Access URLs

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **API Root:** http://localhost:8000/
- **API Health:** http://localhost:8000/api/v1/health

---

## TTS Caching Implementation (2026-02-17)

### New Files Created
- `agent-worker/app/services/tts_cache.py` - Redis-based TTS cache service
- `agent-worker/tests/test_tts_cache.py` - Unit tests for cache service
- `agent-worker/tests/test_tts_service.py` - Integration tests for TTS with cache
- `agent-worker/tests/conftest.py` - Pytest configuration
- `agent-worker/tests/__init__.py` - Test package init

### Files Modified
- `agent-worker/app/config.py` - Added Redis URL, cache TTL, cache enabled settings
- `agent-worker/app/services/tts.py` - Integrated cache checks and storage
- `agent-worker/app/services/__init__.py` - Exported cache services
- `agent-worker/app/main.py` - Added cache connection and pre-warming
- `agent-worker/requirements.txt` - Added redis, pytest, pytest-asyncio

### TTS Cache Features
- Redis-based distributed cache for TTS audio
- Hash-based cache keys (text + voice_id + speed)
- TTL-based eviction (24 hours default)
- Pre-warming of 32 common phrases on startup
- Graceful degradation if Redis unavailable
- Cache hit/miss logging

### Benchmark Results (2026-02-17)

| Metric | Uncached (API) | Cached (Redis) | Improvement |
|--------|---------------|----------------|-------------|
| Average latency | 1156.7ms | 1.6ms | 744x faster |
| Min latency | 689.6ms | 1.4ms | 493x faster |
| Max latency | 2571.7ms | 2.2ms | 1169x faster |
| Latency reduction | - | - | 99.9% |

**Impact on Round-Trip Latency:**
- Before: ~2000ms (STT 822ms + TTS 1156ms + overhead)
- After (cached): ~824ms (STT 822ms + TTS 1.6ms + overhead)
- Target: <800ms ✓ Nearly achieved for cached phrases

---

## Notes
- Supabase auth helpers updated to use lazy client initialization
- LiveKit WebRTC ports mapped to 40000-40200 on host to avoid conflicts
- Frontend Docker volume mounts removed for production deployment
- Target latency: <800ms round-trip (not yet achieved for uncached responses)
