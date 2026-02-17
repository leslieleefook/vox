# Software Design Document: Project Vox (Vapi Clone)

**Version:** 1.4

**Status:** Implementation Ready

**Core Stack:** Asterisk PBX $\\rightarrow$ LiveKit SIP $\\rightarrow$ Pipecat (WebRTC VAD + OpenRouter + Minimax)

* * *

## 1\. System Architecture

The system follows a **Control Plane / Data Plane** separation to ensure telephony reliability and horizontal scalability of AI workers.

### 1.1 Architecture Overview

-   **Telephony Layer (Asterisk):** Manages SIP trunks, PSTN connectivity, and master call recordings.
    
-   **Media Gateway (LiveKit SIP):** Transcodes Asterisk RTP (G.711/Opus) into WebRTC for the AI agent.
    
-   **Intelligence Layer (Pipecat Workers):** Python-based workers running the conversational pipeline.
    
-   **Management Layer (FastAPI + PostgreSQL):** Handles multi-tenant routing logic (AGI), client configs, and API keys.
    

* * *

## 2\. Directory Structure

Plaintext

    project-vox/
    ├── asterisk/
    │   ├── pjsip.conf          # SIP Trunking & AORs
    │   ├── extensions.conf     # Dialplan & AGI Trigger
    │   └── rtp.conf            # Media port ranges
    ├── control-plane/
    │   ├── main.py             # FastAPI AGI & Management API
    │   └── models.py           # SQLAlchemy/PostgreSQL schemas
    ├── agent-worker/
    │   ├── bot.py              # Pipecat Pipeline (OpenRouter + Minimax)
    │   └── .env                # API Keys
    └── docker-compose.yml      # Multi-container orchestration

* * *

## 3\. Implementation Details

### 3.1 Asterisk: The Telephony Foundation

Asterisk acts as the gatekeeper. It receives calls from the PSTN and communicates with our Control Plane via **FastAGI** to determine which AI "Assistant" should answer.

**`asterisk/extensions.conf` (Dialplan)**

Ini, TOML

    [from-external]
    exten => _+X.,1,NoOp(Incoming call from ${CALLERID(num)})
     ; Query the FastAPI AGI server for the Assistant ID
     same => n,AGI(agi://control-plane:8000/route)
     ; Route to LiveKit SIP Gateway with the Assistant ID as a header
     same => n,Dial(PJSIP/${EXTEN}@livekit-bridge,,b(handler^add_header^1(${VOX_ASSISTANT_ID})))
     same => n,Hangup()
    
    [handler]
    exten => add_header,1,Set(PJSIP_HEADER(add,X-Vox-Assistant-ID)=${ARG1})
     same => n,Return()

### 3.2 Control Plane: Dynamic Routing (FastAPI)

The AGI script performs a database lookup. If the dialed number belongs to "Client A," it assigns their specific prompt and Minimax voice.

**`control-plane/main.py`**

Python

    from fastapi import FastAPI
    from asterisk.agi import AGI # Generic AGI library
    
    app = FastAPI()
    
    @app.post("/route")
    async def handle_agi(agi: AGI):
        called_num = agi.env['agi_extension']
        # Lookup Assistant config from DB
        assistant = await db.fetch_one("SELECT id FROM assistants WHERE phone = :p", {"p": called_num})
        
        # Set the variable back to Asterisk
        agi.set_variable("VOX_ASSISTANT_ID", assistant['id'])
        return {"status": "success"}

### 3.3 Intelligence Layer: Pipecat Pipeline

The **Agent Worker** joins the LiveKit room created by the SIP bridge and begins the AI loop.

**`agent-worker/bot.py`**

Python

    # The Pipeline Core
    pipeline = Pipeline([
        livekit_transport.input(),
        WebRTCVADAnalyzer(aggressiveness=3), # Near-zero latency silence detection
        OpenRouterLLMService(
            model="meta-llama/llama-3.1-70b-instruct",
            api_key=os.getenv("OPENROUTER_KEY")
        ),
        MinimaxTTSService( # Ultra-high fidelity voice
            voice_id="mallory",
            format="pcm"
        ),
        livekit_transport.output()
    ])

* * *

## 4\. Database Schema (Multi-Tenant)

| **Table** | **Column** | **Description** |
| --- | --- | --- |
| **Clients** | `id`, `name`, `api_key` | SaaS user account. |
| **Assistants** | `id`, `client_id`, `prompt`, `voice_id` | Specific AI behavior config. |
| **PhoneNumbers** | `e164_number`, `assistant_id` | Mapping PSTN to AI agents. |
| **CallLogs** | `id`, `transcript`, `latency_ms` | Post-call analysis. |

* * *

## 5\. Performance & Scalability

-   **Latency Target:** Total round-trip (User stops $\\rightarrow$ AI starts) should be **< 800ms**.
    
-   **Codec Optimization:** Use **Opus** (20ms packets) across the entire stack (Asterisk $\\rightarrow$ LiveKit $\\rightarrow$ Agent) to avoid transcoding overhead.
    
-   **Horizontal Scaling:** Use Docker Swarm or Kubernetes to scale `agent-worker` instances. One worker can typically handle **20-50 concurrent calls** depending on CPU.