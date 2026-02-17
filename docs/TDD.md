# Technical Design Document: Project Vox

# 

**Version:** 2.0

**Focus:** Multimodal Pipeline & Telephony Orchestration

* * *

## 1\. Technical Stack

# 

| **Component** | **Technology** | **Reasoning** |
| --- | --- | --- |
| **Telephony** | **Asterisk 20+ (PJSIP)** | Industrial-grade SIP handling and RTP management. |
| **Media Bridge** | **LiveKit SIP Gateway** | Optimized bridge between SIP/PSTN and WebRTC. |
| **Orchestrator** | **Pipecat (Python 3.10+)** | Frame-based async orchestration for AI pipelines. |
| **Brain (LLM)** | **OpenRouter (DeepSeek/Llama)** | Single API for low-latency providers (Groq/Together). |
| **Voice (TTS)** | **Minimax (Speech-01-Turbo)** | Streaming PCM with superior prosody and emotional control. |
| **Database** | **PostgreSQL + Prisma/SQLAlchemy** | Relational integrity for multi-tenant configurations. |
| **Cache** | **Redis** | Real-time session state and AGI routing lookups. |

* * *

## 2\. Database Schema

# 

The schema is designed to enforce strict isolation between clients while allowing shared hardware resources.

### `Table: Clients`

# 

-   `id`: UUID (Primary Key)
    
-   `api_key`: String (Hashed, used for management API)
    
-   `webhook_url`: String (Destination for post-call transcripts)
    

### `Table: Assistants`

# 

-   `id`: UUID (Primary Key)
    
-   `client_id`: UUID (Foreign Key)
    
-   `system_prompt`: Text
    
-   `minimax_voice_id`: String (e.g., `mallory`, `wise_man`)
    
-   `llm_model`: String (OpenRouter model string)
    
-   `first_message`: String (Optional greeting)
    

### `Table: PhoneNumbers`

# 

-   `e164_number`: String (Unique, e.g., `+18681234567`)
    
-   `assistant_id`: UUID (Foreign Key)
    
-   `asterisk_context`: String (Default: `from-external`)
    

* * *

## 3\. API & Protocol Specifications

### 3.1 Asterisk to Control-Plane (FastAGI)

# 

When a call hits Asterisk, it makes a TCP request to the AGI server.

-   **Request (Standard AGI):**
    
    Plaintext
    
        agi_extension: +18685551234
        agi_callerid: +18687770000
    
-   **Response (Set Variable):**
    
    Plaintext
    
        SET VARIABLE VOX_ASSISTANT_ID "550e8400-e29b-41d4-a716-446655440000"
    

### 3.2 Pipecat to OpenRouter (LLM)

# 

The agent worker streams text from OpenRouter using an OpenAI-compatible format.

-   **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
    
-   **Payload:**
    
    JSON
    
        {
          "model": "meta-llama/llama-3.1-70b-instruct",
          "messages": [{"role": "system", "content": "..."}],
          "stream": true,
          "transforms": ["middle-out"],
          "provider": { "order": ["Groq", "Together"] }
        }
    

### 3.3 Pipecat to Minimax (TTS)

# 

We use the Minimax T2A V2 API for high-speed streaming PCM.

-   **Endpoint:** `https://api.minimax.io/v1/t2a_v2`
    
-   **Payload (Streaming PCM):**
    
    JSON
    
        {
          "model": "speech-01-turbo",
          "text": "Hello, how can I help you today?",
          "stream": true,
          "voice_setting": { "voice_id": "mallory", "speed": 1.0 },
          "audio_setting": { "sample_rate": 16000, "format": "pcm" }
        }
    

* * *

## 4\. Latency Budget (The "How")

# 

To maintain a "natural" feel, we operate on a strict 800ms total budget.

1.  **VAD (WebRTC VAD):** **40ms**. Aggressiveness Mode 3.
    
2.  **STT (Deepgram):** **150ms**. Streaming intermediate results.
    
3.  **LLM (OpenRouter/Groq):** **200ms**. (Time to First Token).
    
4.  **TTS (Minimax):** **150ms**. (First chunk of PCM bytes).
    
5.  **Network Overhead:** **200ms**. (Total transport across hops).
    

-   **Total Expected E2E:** **740ms**.
    

* * *

## 5\. Sequence Diagram: Streaming Loop

# 

1.  **Frame Collector:** Captures 20ms chunks of 16-bit PCM.
    
2.  **VAD Gate:** Only opens the pipeline when `is_speech()` returns `True`.
    
3.  **Barge-In Monitor:** If speech is detected while `Transport.is_playing` is `True`, it issues a `pipeline.cancel()` signal to stop the current LLM/TTS generation immediately.