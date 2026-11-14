---
title: 04 — Technical Architecture and Moat Analysis
type: agent
component_type: agent
version: 1.0.0
status: draft
created: '2026-11-14'
updated: '2026-11-14'
tags:
- agent
---
> **Note:** This research was conducted in April 2026. API pricing, tool capabilities, and technical landscape may have changed since then. Please verify key technical assumptions before implementation.

# 04 — Technical Architecture and Moat Analysis
# AI Meeting Copilot (Working Title: Cadence / Steer / Cue)

**Document Type:** Architecture Decision Record + Competitive Moat Analysis
**Status:** Draft — Pre-MVP
**Date:** 2026-04-29
**Scope:** Real-time conversation coaching + note-taking SaaS product

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Audio Capture Layer](#2-audio-capture-layer)
3. [Real-Time STT Pipeline](#3-real-time-stt-pipeline)
4. [Semantic Extraction Engine](#4-semantic-extraction-engine)
5. [Plan Input and Parsing](#5-plan-input-and-parsing)
6. [Plan Matching Engine](#6-plan-matching-engine)
7. [Nudge Generation System](#7-nudge-generation-system)
8. [Nudge Delivery Layer](#8-nudge-delivery-layer)
9. [Post-Meeting Pipeline](#9-post-meeting-pipeline)
10. [Adaptive Intelligence Layer](#10-adaptive-intelligence-layer)
11. [Real-Time Latency Budget](#11-real-time-latency-budget)
12. [Unit Economics and Infrastructure Costs](#12-unit-economics-and-infrastructure-costs)
13. [Build vs Buy Decisions](#13-build-vs-buy-decisions)
14. [Technical Moat Analysis](#14-technical-moat-analysis)
15. [Phased Build Plan](#15-phased-build-plan)
16. [Architecture Decision Records](#16-architecture-decision-records)

---

## 1. System Architecture Overview

### 1.1 High-Level System Diagram

```
+---------------------------+
|   PRE-MEETING             |
|   Plan Input Layer        |
|   (text / PDF / CRM /     |
|    voice / calendar)      |
+-----------+---------------+
            |
            v
+---------------------------+
|   Plan Parser             |  <-- LLM-based extraction
|   Plan State Machine      |  <-- Goal/item tracking
+-----------+---------------+
            |
            | [Parsed Plan in memory]
            |
+-----------v---------------+     +------------------------+
|   DURING-MEETING          |     |  Desktop Overlay UI    |
|   Audio Capture Layer     |     |  (floating pill,       |
|   (Core Audio / WASAPI /  |     |   side panel,          |
|    browser ext)           |     |   color pulse)         |
+-----------+---------------+     +------------^-----------+
            |                                  |
            v                                  |
+---------------------------+                  |
|   STT Pipeline            |                  |
|   (Deepgram streaming)    |                  |
+-----------+---------------+                  |
            |                                  |
            v                                  |
+---------------------------+                  |
|   Semantic Extraction     |                  |
|   Engine                  |                  |
|   (chunk -> intent ->     |                  |
|    embedding)             |                  |
+-----------+---------------+                  |
            |                                  |
            v                                  |
+---------------------------+                  |
|   Plan Matching Engine    |                  |
|   (vector similarity +    |                  |
|    coverage state)        |                  |
+-----------+---------------+                  |
            |                                  |
            v                                  |
+---------------------------+                  |
|   Nudge Generator         +------------------+
|   (rule engine +          |
|   LLM inference)          |
+---------------------------+
            |
            v
+---------------------------+
|   POST-MEETING            |
|   Pipeline                |
|   (summary, scorecard,    |
|    debrief, next prep)    |
+---------------------------+
            |
            v
+---------------------------+
|   Storage Layer           |
|   (transcript, plan,      |
|    nudge log, coaching    |
|    analytics)             |
+---------------------------+
```

### 1.2 Core Design Principles

1. **Local-first processing where possible.** Audio capture, basic rule-based nudges, and overlay rendering happen on-device. Cloud calls are minimized to STT streaming and LLM inference only.
2. **Latency over accuracy.** A nudge that arrives in 800ms and is 85% relevant beats a perfect nudge that arrives in 3 seconds. The system is tuned for speed.
3. **Nudge suppression is a first-class feature.** The default state is silence. The system must be more confident in suppressing than in surfacing.
4. **Plan state is the source of truth.** Every component reads from and writes to the same plan state machine. No component makes decisions without knowing what has been covered.
5. **Privacy by architecture.** Plans and nudge strategies never leave the user's device unless explicitly uploaded. Transcripts are encrypted in transit and at rest.

---

## 2. Audio Capture Layer

### 2.1 Capture Strategy Comparison

| Strategy | Invisibility | Latency | Reliability | Platform | Implementation Effort |
|---|---|---|---|---|---|
| **System audio tap (Core Audio / WASAPI)** | Perfect — no bot | <20ms | High (no network) | macOS, Windows | High (OS-level APIs) |
| **Meeting platform bot** | Visible as participant | 100-500ms | Medium (API stability) | All platforms | Medium (bot infra) |
| **Browser extension** | Semi-invisible (tab capture) | 50-200ms | Low (browser changes) | Chrome/Edge only | Medium |
| **Native meeting SDK** | Invisible | <50ms | High | Zoom/Teams/Meet | Very high (per-platform) |

**Decision: Phase 1 — System audio tap. Phase 3 — native meeting SDK per platform.**

Rationale: System audio tap is the Granola approach and the only method that is 100% invisible. The implementation complexity is justified by the #1 product requirement: zero presence in the meeting room.

### 2.2 macOS Core Audio Implementation

```
CoreAudio HAL
    |
    +-- AudioUnit: kAudioUnitSubType_HALOutput
    |       |
    |       +-- InstallTap on input scope (system audio mix)
    |               |
    |               +-- AudioBufferList callbacks @ 10ms intervals
    |                       |
    |                       +-- PCM Float32, 48kHz, stereo
    |                               |
    |                               v
    |                       [Local ring buffer, 500ms window]
    |                               |
    |                               v
    |                       [Resample to 16kHz mono for STT]
    |                               |
    |                               v
    |                       [WebSocket stream to Deepgram]
```

Key implementation notes:
- Use `AVAudioEngine` + tap node for simpler Swift/SwiftUI integration in Phase 1
- `kAudioDevicePropertyStreamConfiguration` to enumerate and capture both input (mic) and output (speaker) for full duplex transcription
- System audio tap captures ALL audio — the app must handle background music, notifications, etc. with a simple voice activity detector (VAD) to filter non-speech
- Screensaver and display sleep must not interrupt the tap — register `IOPMAssertionCreateWithName` to prevent system sleep during active meetings

### 2.3 Windows WASAPI Implementation

```
WASAPI Loopback Capture
    |
    +-- IMMDeviceEnumerator -> eRender endpoint (loopback)
    |       |
    |       +-- IAudioClient::Initialize(AUDCLNT_STREAMFLAGS_LOOPBACK)
    |               |
    |               +-- IAudioCaptureClient polling @ 10ms
    |                       |
    |                       v
    |               [Same pipeline as macOS]
```

Windows-specific considerations:
- WASAPI loopback only captures system render (speaker) audio, not microphone. Microphone requires a separate capture client with `eCapture` endpoint. Both streams must be mixed or processed in parallel.
- Windows 11 privacy settings may require audio capture permissions per application — the installer must handle this gracefully.
- Anti-cheat software (gaming PCs) may block WASAPI tap — document as known limitation for a niche edge case.

### 2.4 Voice Activity Detection (VAD)

Before sending audio to STT, apply VAD to eliminate silence, music, and non-speech. This reduces STT costs by 30-50% and improves transcript quality.

**Options:**
- **Silero VAD** — Open source, runs locally, <1ms inference per chunk, excellent accuracy. **Selected.**
- **WebRTC VAD** — Older, less accurate in noisy environments. Backup option.
- **Deepgram built-in VAD** — Applied server-side, but costs money for silence. Local VAD is preferred.

### 2.5 Speaker Diarization (Multi-Party Meetings)

For multi-party meetings (board meetings, panels), speaker diarization assigns transcript segments to speaker identities.

- **Phase 1:** No diarization. Treat all audio as a single stream. Works for 1:1 meetings which are 80% of initial use cases.
- **Phase 2:** Deepgram diarization (included in streaming API) — labels speakers as "Speaker 0", "Speaker 1". UI shows who is speaking. Plan matching uses user-identified speaker labels ("I'm Speaker 0").
- **Phase 3:** Voice fingerprinting — enroll the user's voice once; the system automatically identifies "your speech" vs "their speech" for talk-time analysis without manual labeling.

---

## 3. Real-Time STT Pipeline

### 3.1 STT Provider Comparison

| Provider | Latency (streaming) | Accuracy (English) | Cost | Offline Option | Streaming API |
|---|---|---|---|---|---|
| **Deepgram Nova-2** | 200-400ms | 95%+ WER | $0.0043/min | No | Yes (WebSocket) |
| **AssemblyAI Universal-2** | 300-500ms | 94%+ | $0.0053/min | No | Yes (WebSocket) |
| **OpenAI Whisper (self-hosted)** | 500ms-2s | 95%+ | ~$0.001/min (GPU) | Yes | Custom |
| **OpenAI Whisper API** | 1-3s (batch) | 95%+ | $0.006/min | No | No (not streaming) |
| **Azure Speech** | 200-400ms | 94%+ | $0.016/min | No | Yes |
| **Google STT v2** | 200-400ms | 93%+ | $0.016/min | No | Yes |

**Decision: Deepgram Nova-2 streaming for Phase 1 and 2. Evaluate self-hosted Whisper for Phase 3 cost reduction at scale.**

Rationale:
- Deepgram has the best streaming latency in the market (interim results every 100ms)
- At $0.0043/min, a 60-minute meeting costs $0.258 in STT — acceptable at all scales
- Deepgram's `endpointing` and `utterance_end_ms` parameters give fine-grained control over when to finalize transcript chunks for downstream processing
- Self-hosted Whisper becomes cost-competitive above ~50K meetings/month but requires GPU infrastructure investment

### 3.2 Streaming Architecture

```
[Audio ring buffer, 16kHz mono]
        |
        v
[Deepgram WebSocket connection]
        |
        +-- Send: raw PCM audio chunks every 100ms
        |
        +-- Receive: interim transcripts (every 100-300ms)
        |       |
        |       +-- [INTERIM] → VAD/confidence filter
        |               |
        |               +-- If confidence > 0.75: feed to semantic buffer
        |
        +-- Receive: final transcripts (on silence/utterance end)
                |
                +-- [FINAL] → Authoritative transcript store
                        |
                        +-- Semantic extraction trigger
```

### 3.3 Transcript Chunking Strategy

The downstream semantic extraction engine needs transcript segments, not individual words. The chunking strategy determines the granularity of plan matching.

**Chunk trigger conditions (any one sufficient):**
1. Deepgram `is_final: true` + silence gap > 800ms (natural utterance boundary)
2. Word count exceeds 40 words in interim buffer (prevents long monologue from blocking matching)
3. Time-based force flush every 15 seconds regardless of speech continuity
4. Topic shift detected by a lightweight classifier (Phase 2)

**Chunk metadata attached to each segment:**
```json
{
  "chunk_id": "uuid",
  "start_ms": 142300,
  "end_ms": 147800,
  "text": "So the timeline for implementation would be about 90 days after contract",
  "speaker": "speaker_0",
  "confidence": 0.94,
  "is_user_speaking": true,
  "word_count": 14,
  "duration_ms": 5500
}
```

---

## 4. Semantic Extraction Engine

### 4.1 Purpose

The raw transcript chunk ("So the timeline for implementation would be about 90 days after contract") must be converted into a machine-comparable semantic representation that can be matched against plan items ("ask about implementation timeline").

### 4.2 Extraction Pipeline

```
[Transcript Chunk]
        |
        v
[Intent Classification]
        |     (lightweight: topic, question, objection, agreement,
        |      commitment, concern, competitive mention)
        v
[Named Entity Extraction]
        |     (numbers, dates, company names, competitor names,
        |      product terms, dollar amounts)
        v
[Embedding Generation]
        |     (text-embedding-3-small or local model)
        v
[Semantic Chunk Object]
        {
          chunk_id, text, embedding[1536],
          intent_class, entities, speaker, timestamp
        }
```

### 4.3 Intent Classification

A fine-tuned lightweight classifier (distilbert-base or a simple prompt-based Haiku call) labels each chunk with one or more intents:

| Intent Class | Example Chunk |
|---|---|
| `topic_coverage` | "We've been using Salesforce for 3 years" |
| `question_asked` | "What does the pricing look like?" |
| `objection_raised` | "I'm not sure we have budget for this" |
| `commitment_made` | "We'll get you a decision by Friday" |
| `competitive_mention` | "We're also looking at HubSpot" |
| `concern_expressed` | "The implementation timeline worries me" |
| `positive_signal` | "This is exactly what we've been looking for" |
| `off_topic` | "Did you catch the game last night?" |

Intent classes map directly to plan item types. An `objection_raised` chunk scans objection handles in the plan. A `question_asked` chunk scans the user's question list to see if the user asked it, or the counterpart asked something requiring a prepared answer.

### 4.4 Embedding Model Selection

| Model | Dimensions | Cost | Latency | Local |
|---|---|---|---|---|
| **OpenAI text-embedding-3-small** | 1536 | $0.00002/1K tokens | 50-150ms | No |
| **OpenAI text-embedding-3-large** | 3072 | $0.00013/1K tokens | 100-200ms | No |
| **Nomic Embed (local)** | 768 | $0 (inference cost) | 10-50ms | Yes |
| **all-MiniLM-L6-v2** | 384 | $0 | 5-20ms | Yes |

**Decision: Phase 1 — `all-MiniLM-L6-v2` running locally via ONNX runtime. Phase 2 — evaluate Nomic Embed for quality improvement.**

Rationale: Local embedding eliminates an API round-trip, reduces latency by 100-200ms, and removes per-token cost for a component that runs continuously during meetings. The quality delta between MiniLM and text-embedding-3-small is acceptable for plan matching use cases (cosine similarity at 0.75+ threshold).

---

## 5. Plan Input and Parsing

### 5.1 Supported Input Formats

| Format | Extraction Method | Complexity |
|---|---|---|
| Pasted plain text | Direct LLM parsing | Low |
| Markdown (.md) | Strip formatting, LLM parse | Low |
| PDF | `pdfminer` / `PyMuPDF` text extraction, then LLM | Medium |
| PPTX / slide decks | `python-pptx` text extraction per slide, then LLM | Medium |
| CRM data (Salesforce, HubSpot) | OAuth + API pull, structured JSON to LLM | High |
| Calendar event | Google/Outlook calendar API, description field + invitee context | Medium |
| Voice memo | Whisper transcription → LLM parse | Medium |
| Prior meeting summary | Auto-carry from previous meeting's output | Low (structured) |

### 5.2 Plan Parser Prompt Architecture

The plan parser uses a structured extraction prompt sent to Claude Haiku (fast, cheap, sufficient for this task):

```
System: You are a meeting preparation analyst. Extract a structured plan
from the user's input. Return ONLY valid JSON.

Output schema:
{
  "meeting_type": "sales_discovery | investor_pitch | negotiation | 1on1 |
                   interview_candidate | interview_interviewer | board |
                   facilitation | difficult_conversation | other",
  "goals": [
    {"id": "g1", "text": "Get verbal commitment to move to contract",
     "priority": "critical | high | medium"}
  ],
  "agenda_items": [
    {"id": "a1", "text": "Intro and rapport", "estimated_minutes": 5,
     "status": "pending"}
  ],
  "questions_to_ask": [
    {"id": "q1", "text": "What's your timeline for a decision?",
     "priority": "high", "trigger_topic": "timeline"}
  ],
  "talking_points": [
    {"id": "tp1", "text": "40% reduction in onboarding time",
     "context": "when ROI comes up", "data_point": true}
  ],
  "objection_handles": [
    {"id": "oh1", "objection": "too expensive",
     "response_cue": "reframe as cost of inaction", "priority": "critical"}
  ],
  "boundaries": [
    {"id": "b1", "text": "Do not commit to custom development",
     "type": "hard_limit"}
  ],
  "key_information_to_extract": [
    {"id": "ie1", "text": "Their current vendor and contract end date"}
  ],
  "time_budget_minutes": 45
}

User: [raw plan input]
```

### 5.3 Plan State Machine

Once parsed, the plan becomes a state machine. Each item has a lifecycle:

```
[pending] → [triggered] → [addressed] → [covered]
                |
                +→ [skipped_intentionally]
                +→ [not_reached]
```

State transitions are triggered by the Plan Matching Engine:

- `pending → triggered`: Embedding similarity to recent transcript chunk exceeds 0.72 threshold
- `triggered → addressed`: User has spoken for >15 seconds on the topic after trigger, OR system detects clear response/resolution language
- `addressed → covered`: System confidence > 0.85 that the item was meaningfully completed (not just mentioned)
- `triggered → skipped_intentionally`: User dismisses nudge for this item in the UI
- `pending → not_reached`: Meeting ends with item still pending

Coverage score = `covered_items / total_items * 100`

### 5.4 Dynamic Plan Re-Prioritization

The plan state machine re-evaluates item order every 60 seconds based on:

1. **Time remaining** — Items are sorted by `(priority_weight * urgency_multiplier)` where urgency increases as time decreases
2. **Conversation momentum** — If the counterpart has just raised a topic adjacent to a pending item, that item floats up
3. **Coverage gaps** — Critical items that remain `pending` are promoted ahead of `medium` items regardless of agenda order
4. **User overrides** — User can pin/dismiss items in the UI, which hard-locks their priority position

---

## 6. Plan Matching Engine

### 6.1 Architecture

The plan matching engine is the core intellectual property of the product. It continuously compares the live semantic state of the conversation against the user's plan and emits match events.

```
[Incoming Semantic Chunk]
        |
        +-- [Embedding: 384 dims]
        |
        v
[Vector Similarity Search]
        |   Compare chunk embedding against all
        |   pending/triggered plan item embeddings
        |   using cosine similarity (in-memory, FAISS)
        |
        v
[Similarity Scores]
        |   e.g., {q1: 0.81, tp3: 0.74, oh2: 0.68, a4: 0.55}
        |
        v
[Intent-Weighted Scoring]
        |   Boost scores based on intent class alignment:
        |   chunk.intent = "objection_raised" → boost objection_handle scores
        |   chunk.intent = "competitive_mention" → boost battlecard scores
        |
        v
[Threshold Filtering]
        |   Only items scoring > 0.70 proceed to nudge consideration
        |
        v
[Coverage Context Filter]
        |   Remove items already in "covered" or "skipped" state
        |
        v
[Match Events Queue]
        |   Ranked list of candidate nudges with scores and context
        |
        v
[Nudge Generator]
```

### 6.2 Plan Embedding Pre-computation

When the user loads a plan before the meeting, all plan items are immediately embedded and stored in an in-memory FAISS index. This ensures sub-millisecond vector search during the meeting.

```
Plan Items (JSON)
        |
        v
Text concatenation:
  agenda_items: "Agenda: {text}"
  questions: "Question to ask: {text}"
  talking_points: "Key point: {text} — when: {context}"
  objection_handles: "If they say {objection}, cue: {response_cue}"
  boundaries: "Limit: {text}"
        |
        v
Batch embed all items (all-MiniLM-L6-v2, local)
        |
        v
FAISS FlatIP index (exact cosine search, <50 items = no need for approximate)
        |
        v
[Ready for meeting-time search]
```

### 6.3 Conversation Context Window

The matching engine does not match single chunks in isolation. It maintains a rolling context window of the last 90 seconds of conversation (approximately 200-300 words) to capture multi-turn topic continuity. A topic raised over several exchanges should accumulate matching signal, not just trigger on the first mention.

**Context accumulation model:**
- Each incoming chunk contributes to a running topic vector (exponentially weighted moving average of embeddings)
- Topic vector is matched against plan items every time a new chunk arrives
- Confidence in a topic match increases as the topic vector stabilizes (consecutive chunks pointing to the same plan item)

---

## 7. Nudge Generation System

### 7.1 Dual-Engine Architecture

```
[Match Events Queue]
        |
        +--[Rule Engine]----+--[LLM Engine]--+
        |                   |                |
        v                   v                v
   Rule-based nudges   Semantic nudges    Merged + Ranked
   (time, talk-time,   (plan match,      Nudge Queue
    silence, urgent)    opportunity
                         detection,
                         objection
                         handles)
```

### 7.2 Rule Engine (Always-On, Zero-Latency)

Rule-based nudges run entirely on-device with no API calls. They fire within 50ms of their trigger condition being met.

| Rule | Trigger Condition | Nudge Text (6-8 words max) |
|---|---|---|
| **Talk-time overrun** | User speaking continuously >3 minutes | `pause — let them respond` |
| **Talk-ratio warning** | User talk% > 65% over last 10 min | `you're at 70% — listen more` |
| **Time pressure — high** | 20% of meeting time remaining, >30% plan uncovered | `{N} items left, {T} min — prioritize` |
| **Time pressure — critical** | 5 minutes remaining, critical items uncovered | `ask about {critical_item} now` |
| **Silence > 10 seconds** | No one speaking, user last spoke | `silence is ok — wait for them` |
| **Boundary approach** | Conversation heading toward a hard limit (via topic match) | `hold — don't commit to {boundary}` |
| **Goal not addressed** | Meeting past 75% duration, primary goal still pending | `still haven't reached your main goal` |

### 7.3 LLM Engine (Semantic, On Match Events)

LLM nudge generation fires when a match event exceeds threshold. It uses Claude Haiku for sub-200ms inference at low cost.

**Nudge generation prompt:**

```
System: You are a silent meeting coach. Generate a SHORT coaching nudge
(max 7 words, no punctuation except em-dash, no full sentences)
based on what just happened in the meeting.

Rules:
- Never more than 7 words
- Actionable, not descriptive
- Past tense is forbidden (no "they said", "you mentioned")
- Present imperative preferred ("ask", "pivot", "mention", "hold")
- Return ONLY the nudge text, nothing else

Context:
- Meeting type: {meeting_type}
- Matched plan item: {plan_item.text}
- Match type: {question | talking_point | objection_handle | goal | boundary}
- Recent transcript (last 60 seconds): {transcript_excerpt}
- Current talk ratio: {user_talk_pct}%
- Time remaining: {minutes_remaining} minutes

Generate the nudge:
```

**Expected output examples:**
- `ask about implementation timeline` (question match)
- `mention the 40% onboarding stat` (talking point match)
- `they pushed on price — reframe cost` (objection handle)
- `competitor mentioned — probe their evaluation` (opportunity detection)

### 7.4 Nudge Rate Limiting and Priority

A global nudge governor enforces the 1-nudge-per-60-second rule and manages the priority queue:

```
Priority Queue (sorted by urgency score):
  [P0] Critical boundary violations, time-critical items (< 3 min remaining)
  [P1] Primary goal not addressed, critical questions missed
  [P2] High-priority talking points, objection handles
  [P3] Medium priority questions, general agenda tracking
  [P4] Nice-to-have talking points, low-priority agenda items

Rate limiter:
  - Minimum 60 seconds between any two nudges
  - After user "dismisses" a nudge, 90-second cooldown before next
  - P0 nudges bypass rate limiter (max 2 P0 nudges per meeting)
  - If multiple nudges are queued, the highest priority fires when
    the rate limit window opens; others expire or get re-evaluated
```

### 7.5 Nudge Suppression (Positive Case)

The system actively suppresses nudges when:
- The current nudge candidate matches an item already in `triggered` or `addressed` state
- The conversation is clearly on-topic and flowing well (plan coverage rate increasing rapidly)
- The user's talk ratio is already at the healthy 40-50% range and no critical items are pending
- The most recent chunk indicates a natural conclusion or transition is already happening

Suppression is not silence — it is a deliberate no-op that costs the system a potential false positive.

---

## 8. Nudge Delivery Layer

### 8.1 Desktop Overlay (Primary)

The floating overlay is the primary delivery mechanism for desktop meetings. Design requirements:

```
Visual specifications:
  - Width: 280px max (pill shape)
  - Height: 36px single-line
  - Position: User-configurable (default: bottom-right, 24px from edge)
  - Background: rgba(0, 0, 0, 0.75) — dark translucent
  - Text: 13px Inter/SF Pro, white, single line truncated
  - Animation in: 150ms ease-out fade + 4px slide up
  - Auto-dismiss: 8 seconds if not interacted with (fade out)
  - Manual dismiss: tap/click anywhere on pill
  - Always-on-top: YES — must render above Zoom/Teams/browser

Interaction model:
  - Tap = dismiss this nudge
  - Long press (500ms) = "mark this item as done" (update plan state)
  - Hover = pause auto-dismiss timer
  - Double-tap = "not relevant" feedback (trains suppression model)
```

### 8.2 Color Pulse Signal

For ambient signaling without reading, the screen edge pulses with color:
- **Amber pulse** — gentle nudge available, check overlay
- **Red pulse** — critical alert (boundary approaching, time critical)
- **Green pulse** — you're on track, plan items being covered

The color pulse uses a 2px-wide strip along the user-chosen edge (default: right side). It is not intrusive to the meeting view but is visible in peripheral vision.

### 8.3 Audio Tone (In-Person / Earpiece)

For in-person meetings where the user cannot look at a screen without appearing distracted:

| Pattern | Meaning |
|---|---|
| Single soft chime (440Hz, 100ms) | Nudge available — glance at watch or phone |
| Two chimes (ascending) | You've been talking too long — wrap up |
| Three chimes (descending) | Critical item — must address soon |
| Sustained low tone (200ms) | Boundary violation — stop now |

Audio delivery: routed to AirPods / Bluetooth earpiece via the system's audio device priority. The app creates a separate audio session for tone delivery distinct from the meeting capture session.

### 8.4 Haptic (Smartwatch)

Apple Watch / WearOS companion app (Phase 3):

| Pattern | Meaning |
|---|---|
| Single tap | Nudge available |
| Double tap | Talking too long |
| Sustained buzz (500ms) | Critical — boundary or time |

The watch app displays the nudge text on the watch face, so the user can glance at their wrist naturally (as if checking the time) rather than at the screen.

---

## 9. Post-Meeting Pipeline

### 9.1 Pipeline Steps

After meeting end (triggered by user or auto-detected silence > 3 minutes):

```
[Raw transcript + Audio] → [Final STT pass (if gaps)] → [Transcript cleaning]
        |
        v
[Plan completion scoring]
  - Coverage map: which items were addressed, skipped, missed
  - Completion percentage by category (goals, questions, talking points)
  - Timestamps for each covered item
        |
        v
[Talk-time analysis]
  - Per-speaker time breakdown
  - Longest monologue durations
  - Question/response ratio
  - Silence distribution
        |
        v
[Coaching debrief generation] ← [Claude Sonnet — higher quality output acceptable]
  - What went well
  - Missed opportunities (with timestamp refs)
  - Communication patterns (overtalking, missed follow-up on signals)
  - Specific coaching points for next similar meeting
        |
        v
[AI summary] (standard — table stakes)
  - Key decisions, action items, follow-ups
        |
        v
[Next meeting prep]
  - Auto-generated agenda carrying forward uncovered items
  - Suggested questions based on commitments made
  - CRM update suggestions (Phase 2)
        |
        v
[Storage]
  - Transcript: encrypted, user-owned
  - Plan completion: stored for analytics / coaching trend
  - Nudge effectiveness log: did user act on nudge? (training signal)
  - Audio: deleted by default unless user opts to retain
```

### 9.2 Plan Completion Scorecard (Example Output)

```
Meeting Scorecard — Sales Discovery Call — April 29, 2026

Goals (2/3 achieved):
  [x] Qualify budget authority
  [x] Understand current pain points
  [ ] Get commitment for next step ← MISSED

Questions Asked (4/6):
  [x] What's your current process?
  [x] Who else is involved in the decision?
  [x] What's your timeline?
  [x] What have you tried before?
  [ ] What's your budget range? ← NOT ASKED
  [ ] Are you evaluating competitors? ← NOT ASKED

Talk Time:
  You: 64% | Them: 36% ← Aim for 40-60 next time

Key Moments:
  [14:22] Buying signal — "this sounds exactly like what we need"
          → You didn't capitalize. Suggested response: ask for commitment
  [28:47] Competitor mention — "we've also been talking to Salesforce"
          → You addressed this well — good battlecard usage

Overall Score: 71/100
Next Meeting: Prep budget conversation opener. Start with an open question.
```

---

## 10. Adaptive Intelligence Layer

### 10.1 Re-Sequencing Logic

When conversation diverges from plan order, the adaptive layer determines the optimal response:

```
[Detected: Conversation Topic T]
        |
        v
[Match T against pending plan items]
        |
        +-- High similarity to item A (out of order)?
        |       |
        |       v
        |   [Re-sequence: move item A to front of queue]
        |   [Mark skipped items between current and A as "deferred"]
        |   [Nudge: "they jumped to {A topic} — go with it"]
        |
        +-- No match to any plan item?
        |       |
        |       v
        |   [Classify as tangent]
        |   (see Tangent Classification below)
        |
        +-- Match to "covered" item?
                |
                v
            [Update state if deeper coverage detected]
            [Nudge: "they're revisiting {item} — add {talking_point}"]
```

### 10.2 Tangent Classification

Not all off-plan conversation is bad. The system must distinguish:

**Valuable tangents:**
- High positive sentiment from counterpart
- New information relevant to plan goals
- Competitive intelligence being volunteered
- Unexpected buying signal

**Derailing tangents:**
- Zero relevance to any plan item
- Negative sentiment (venting, complaints unrelated to meeting)
- Time consumption without information value
- Conversation entering restricted territory (legal, discriminatory, etc.)

**Classification model:**
```
Input: [tangent transcript chunk, plan context, sentiment score, speaker]
Output: {class: "valuable" | "derailing" | "neutral", confidence, reason}
```

For Phase 1: rule-based (sentiment + topic distance from plan). For Phase 2: lightweight LLM classification with Haiku.

**Nudge responses:**
- Valuable tangent: `this tangent is useful — let it develop`
- Derailing tangent: `off track — bridge back to {next_plan_item}`
- After 2 minutes of derailing: `you've spent {N} min off agenda — redirect`

### 10.3 Emotional / Sentiment Awareness

The system maintains a sentiment state for the conversation derived from two signals:

**Linguistic sentiment** (text-based, Claude Haiku):
- Per-chunk sentiment score: positive / neutral / negative / frustrated / hesitant / enthusiastic
- Running 5-chunk average to avoid reacting to single words

**Prosodic sentiment** (audio-based, Phase 2):
- Speaking rate changes (slowing = hesitation, speeding = excitement or anxiety)
- Pitch variance (flat = disengaged, high variance = animated)
- Volume level changes (dropping = discomfort, rising = emphasis)

**Prosodic model candidates:**
- `speechbrain/emotion-recognition-wav2vec2-IEMOCAP` (local, open source)
- Hume AI API (cloud, more accurate, $0.05/min)

**Sentiment-triggered nudges:**
- Frustrated counterpart: `they sound frustrated — acknowledge first`
- Hesitant counterpart: `hesitation detected — ask an open question`
- High enthusiasm: `strong positive signal — this is the moment to advance`

### 10.4 Multi-Party Meeting Handling

Phase 1 supports 1:1 meetings. Phase 2 extends to multi-party:

| Party Count | Strategy |
|---|---|
| 1:1 | Single coaching context. Both participants relevant. |
| 3-5 people | Diarize speakers. User identified by voice enrollment. Nudges consider "who hasn't spoken" and "group dynamics". |
| 5-10 people | Facilitation mode. Plan becomes a facilitation guide. Track which participants have contributed. |
| 10+ people | Presentation mode. Plan tracks slide flow + Q&A handling. Talk-time coaching becomes "audience engagement" coaching. |

**Multi-party specific nudges:**
- `{Name} hasn't spoken — invite their input`
- `The CFO looks skeptical — address their concerns`
- `You have 3 people agreeing — call for a decision`

Speaker-to-name mapping: the user enters participant names pre-meeting (from calendar invite). The system maps diarization labels to names automatically via voice fingerprinting after the first time each person speaks.

---

## 11. Real-Time Latency Budget

### 11.1 End-to-End Latency Breakdown

**Target: < 2,000ms from speech end to nudge visible**

| Stage | Component | Target Latency | Notes |
|---|---|---|---|
| Audio buffer flush | CoreAudio/WASAPI | 10-20ms | Ring buffer flush interval |
| VAD processing | Silero VAD (local) | 5-15ms | Per 100ms chunk |
| STT interim result | Deepgram streaming | 100-300ms | Interim, not final |
| Semantic extraction | MiniLM embedding (local) | 10-30ms | ONNX runtime |
| Intent classification | Rule-based (local) | <5ms | Lookup table |
| Vector similarity search | FAISS in-memory | <5ms | <50 items |
| Nudge governor check | In-memory state | <2ms | Rate limit evaluation |
| Rule engine evaluation | In-memory rules | <5ms | Time/ratio rules |
| LLM nudge generation | Claude Haiku API | 150-400ms | Only on match events |
| Overlay render | Native UI | 16-32ms | 60fps frame |
| **Total (rule-based nudge)** | | **~370ms** | No LLM involved |
| **Total (LLM nudge)** | | **~820ms** | With Haiku generation |
| **Total (worst case)** | | **~1,400ms** | Slow network + complex prompt |

### 11.2 Latency Optimization Strategies

1. **Interim STT results** — Don't wait for `is_final`. Fire semantic processing on high-confidence interim transcripts (>0.80 confidence). Accept that ~5% of interim results will be corrected by finals.

2. **Pre-generate candidate nudges** — When a match event hits threshold, immediately begin Haiku generation. If the rate limiter is still cooling down, generation happens in the background. The nudge is ready to fire the instant the window opens.

3. **LLM nudge caching** — For each plan item, pre-generate 3 nudge variants at plan load time. During the meeting, fire cached nudges for common scenarios. LLM is only called for novel situations (opportunity detection, unexpected objections).

4. **STT WebSocket keep-alive** — Maintain the Deepgram WebSocket connection throughout the meeting. Don't reconnect on silence; use Deepgram's native silence tolerance. Reconnection adds 200-400ms.

5. **Local embedding model** — Running MiniLM locally eliminates a 50-150ms API round trip for every chunk. This is the single highest-impact latency optimization.

### 11.3 Graceful Degradation

| Condition | Degraded Behavior |
|---|---|
| Network loss > 3 seconds | Fall back to rule-based nudges only (time, talk-time, silence) |
| STT disconnection | Buffer audio locally; reconnect; continue with gap noted in transcript |
| High CPU (>80%) | Reduce embedding frequency from every chunk to every 3rd chunk |
| LLM API timeout (>2s) | Cancel and fire cached nudge for the matched item |

---

## 12. Unit Economics and Infrastructure Costs

### 12.1 Per-Meeting Cost Breakdown

**Assumptions:** Average meeting = 45 minutes, 1:1, standard plan complexity

| Component | Unit Cost | Per-Meeting Cost | Notes |
|---|---|---|---|
| STT (Deepgram Nova-2) | $0.0043/min | $0.194 | 45 min |
| LLM — Plan parsing | $0.00025/1K tokens, ~2K tokens | $0.0005 | One-time per meeting |
| LLM — Nudge generation (Haiku) | $0.00025/1K tokens, ~300 tokens per nudge, avg 8 nudges | $0.0006 | 8 x 300 tokens |
| LLM — Post-meeting debrief (Haiku) | $0.00025/1K tokens, ~5K tokens | $0.00125 | Summary + scorecard + debrief |
| Embedding (local) | $0 | $0 | Local MiniLM |
| Compute (cloud) | $0.10/hour, 0.1 vCPU-hour per meeting | $0.01 | Lightweight backend |
| Storage (transcript + plan) | $0.023/GB-month, ~10KB/meeting | $0.00003 | S3-class storage |
| Bandwidth | $0.09/GB out, ~100KB/meeting | $0.000009 | Negligible |
| **Total per meeting** | | **~$0.207** | |
| **With 40% margin buffer** | | **~$0.29** | For spikes and errors |

### 12.2 Monthly Infrastructure Cost Projections

| Scale | Meetings/Month | STT | LLM | Compute | Storage | **Total** | Cost/User (Pro @ $19) |
|---|---|---|---|---|---|---|---|
| 1K meetings | 1,000 | $194 | $2.35 | $15 | $1 | **$212** | $0.21 (1.1% of revenue) |
| 10K meetings | 10,000 | $1,940 | $23.50 | $100 | $10 | **$2,074** | $0.21 |
| 100K meetings | 100,000 | $19,400 | $235 | $800 | $100 | **$20,535** | $0.21 |
| 1M meetings | 1,000,000 | $194,000 | $2,350 | $7,000 | $1,000 | **$204,350** | $0.20 |

**Key insight:** Infrastructure costs are remarkably stable as a percentage of revenue due to linear scaling. At 100K meetings/month, the product generates ~$2M/month in Pro revenue ($19/user, assuming avg 2 meetings/user/week = 50 meetings/user/month, 2K users). Infrastructure is ~1% of revenue — exceptional SaaS economics.

### 12.3 STT Cost Reduction at Scale

At 100K+ meetings/month, self-hosting Whisper becomes viable:

| Option | Monthly Cost at 100K meetings | Break-even vs Deepgram |
|---|---|---|
| Deepgram Nova-2 | $19,400 | — |
| Whisper on spot GPU (A10G, $1.50/hr) | ~$4,500 (750 GPU-hours) | ~30K meetings/month |
| Whisper on reserved GPU (A10G) | ~$3,200 | ~20K meetings/month |

**Decision: Switch to self-hosted Whisper at 30K meetings/month. Retain Deepgram as fallback.**

### 12.4 LLM Model Selection by Task

| Task | Model | Justification |
|---|---|---|
| Plan parsing | Claude Haiku | Fast, cheap, structured JSON output reliable |
| Nudge generation | Claude Haiku | <200ms, handles 7-word constraint well |
| Tangent classification | Claude Haiku | Simple classification, high throughput |
| Post-meeting debrief | Claude Sonnet | Higher quality output acceptable; one-time per meeting |
| Opportunity detection | Claude Haiku | Real-time requirement |
| Next meeting prep | Claude Haiku | Structured output, moderate quality |

---

## 13. Build vs Buy Decisions

| Component | Decision | Rationale |
|---|---|---|
| **Audio capture (Core Audio / WASAPI)** | BUILD | No off-the-shelf solution. OS-level APIs must be integrated directly. Core IP. |
| **Voice Activity Detection** | BUY (Silero VAD) | Open source, local, excellent quality. Not a differentiator. |
| **STT** | BUY (Deepgram) | Commodity. Best-in-class accuracy and streaming latency. Migrate to self-hosted Whisper at scale. |
| **Embedding model** | BUY (MiniLM, open source) | Run locally. Not a differentiator. |
| **Vector search (FAISS)** | BUY (FAISS, open source) | Standard library. No custom work needed for <50 plan items. |
| **Plan parser** | BUILD (on LLM APIs) | The prompt engineering and schema design are core IP. LLM is the engine. |
| **Plan state machine** | BUILD | Core IP. The logic of what constitutes "covered" vs "addressed" is a key design decision. |
| **Semantic extraction engine** | BUILD | The intent classification taxonomy and entity extraction are differentiators. |
| **Plan matching engine** | BUILD | Core IP. The scoring algorithm, context accumulation, and intent-weighted matching are the moat. |
| **Rule engine (nudges)** | BUILD | Simple but customized to meeting types. |
| **LLM nudge generation** | BUILD (on LLM APIs) | The prompt architecture and nudge quality are core IP. LLM is the engine. |
| **Nudge governor** | BUILD | Rate limiting and priority logic are core IP. |
| **Overlay UI** | BUILD | Native desktop UI. Core UX differentiator. |
| **Speaker diarization** | BUY (Deepgram) | Included in STT. Not a differentiator. |
| **Post-meeting summary** | BUILD (on LLM APIs) | Standard but customized for plan-completion context. |
| **Plan completion scoring** | BUILD | Core IP. The scoring methodology is a product differentiator. |
| **Coaching debrief** | BUILD (on LLM APIs) | Core IP. The analytical depth is a differentiator. |
| **CRM integration** | BUY (Zapier / native APIs) | Standard OAuth integrations. Not a differentiator at Phase 1. |
| **Authentication** | BUY (Auth0 / Clerk) | Commodity. Not a differentiator. |
| **Storage** | BUY (S3 + PostgreSQL) | Commodity cloud storage. |
| **Analytics pipeline** | BUY (PostHog or Mixpanel) | Product analytics. Not a differentiator. |

---

## 14. Technical Moat Analysis

### 14.1 What is Commodity (Will Not Defend)

| Layer | Why Commodity |
|---|---|
| STT (transcription) | Deepgram, AssemblyAI, Whisper all achieve >94% WER. OpenAI will commoditize further. |
| AI summaries | Every LLM can summarize. Zero differentiation. |
| Talk-time tracking | Implemented by Read.ai, Otter. Simple math. |
| Calendar integration | Standard OAuth. Table stakes. |
| Basic note-taking | Granola, Otter, Fathom all do this. |

### 14.2 What is Defensible

#### Layer 1: Plan-Matching Intelligence (Core Moat)

The algorithmic work of mapping live, unstructured conversation to a user's structured-but-flexibly-authored plan is non-trivial and not replicable by simply calling an LLM with a transcript. The defensible components:

- **Plan taxonomy** — The schema for representing goals, questions, objection handles, boundaries, talking points, and information-to-extract is not obvious. Competitors will build different schemas with different coverage.
- **State machine logic** — What constitutes "covered" vs "triggered" vs "partially addressed" requires deep domain knowledge of how conversations actually work. Getting this wrong produces false positives (annoying nudges for covered items) or false negatives (missing real coverage gaps).
- **Context accumulation** — The exponentially-weighted embedding average over 90-second windows is a specific architectural choice that outperforms naive chunk-by-chunk matching. This is a technical moat.
- **Intent-weighted scoring** — Boosting objection handle scores when the intent classifier detects an objection is an insight that took product iteration to discover. It is not obvious and not implemented by general-purpose tools.

#### Layer 2: Nudge Quality and Timing (Behavioral Moat)

The quality of nudges is determined by:
1. The prompt architecture (craft, iteration, A/B testing over thousands of meetings)
2. The rate limiting and suppression logic (knowing when NOT to nudge)
3. The 7-word constraint enforcement and glanceability UX

This is a behavioral moat: it takes many cycles of user feedback and iteration to make nudges feel like "your own inner voice" rather than distracting interruptions. First movers accumulate this iteration advantage.

#### Layer 3: Data Flywheel (Long-Term Moat)

With user consent (opt-in), aggregate nudge effectiveness data creates a self-improving system:

```
User receives nudge → User acts on it (or dismisses) → Outcome tracked
        |
        v
Effectiveness signal: was the nudge acted on? Did coverage improve?
        |
        v
Training signal for:
  - Suppression model (which nudges are dismissed most often)
  - Timing optimization (what talk-time ratio triggers best response)
  - Meeting-type calibration (sales calls vs board meetings have different patterns)
  - Nudge text optimization (which 7-word variants get acted on most)
```

After 100K meetings, the nudge system has seen enough variation to be meaningfully better than a system trained on 1K meetings. This compounding advantage is not replicable by a new entrant without data.

#### Layer 4: Invisible Audio Capture (Execution Moat)

System audio capture (Core Audio / WASAPI) is technically straightforward but:
- Requires deep OS-level integration (non-trivial for a web-first team)
- Must handle edge cases: multiple audio devices, virtual audio drivers (BlackHole, VB-Cable), meeting platform audio routing changes
- Requires ongoing maintenance as macOS and Windows update audio subsystems
- Creates a natural distribution advantage (desktop app) over web-only competitors

This is an execution moat rather than an algorithmic one, but it compounds with the product requirement that the tool be invisible.

### 14.3 Patent-Eligible Innovations

The following represent novel combinations that may qualify for utility patents (consult patent counsel):

1. **"Real-Time Adaptive Meeting Plan Matching"** — System and method for dynamically matching live transcript segments to a pre-loaded meeting plan using intent-weighted vector similarity, maintaining coverage state across re-sequenced conversation.

2. **"Nudge Suppression as a First-Class Signal"** — System and method for meeting coaching systems that optimizes for nudge suppression (not nudge generation) using confidence thresholds and behavioral suppression models derived from user interaction feedback.

3. **"Prosody-Enhanced Meeting Sentiment Coaching"** — Method for combining linguistic sentiment analysis with audio prosody signals (speaking rate, pitch variance, volume) to generate contextually appropriate conversation coaching nudges.

4. **"Exponentially-Weighted Context Accumulation for Plan Matching"** — Specific mathematical method for accumulating conversation context via weighted embedding averages over a rolling window, improving plan match accuracy for multi-turn topics.

5. **"Meeting Plan State Machine with Deferred Item Re-prioritization"** — System for tracking the lifecycle of meeting plan items through pending/triggered/addressed/covered states with dynamic urgency-weighted re-prioritization as meeting time elapses.

**Note:** File provisional patents in Phase 1 for items 1 and 2 before launch. Cost: ~$3-5K per provisional.

### 14.4 Competitive Response Risk Assessment

| Competitor | Likelihood to Copy | Time to Copy | Risk Level | Why |
|---|---|---|---|---|
| **Granola** | High | 12-18 months | HIGH | Best positioned — already has invisible capture. Missing the plan-aware layer. |
| **Gong / Chorus** | Medium | 18-24 months | MEDIUM | Different market focus (post-call, team analytics). Real-time pivoting is expensive for them. |
| **OpenAI** | Low-Medium | Unknown | MEDIUM | Could add this to ChatGPT desktop. Would be generalized, not plan-aware. |
| **Microsoft (Copilot)** | High | 24-36 months | HIGH | Has Teams integration, but enterprise focus. Consumer/SMB window is open. |
| **Read.ai** | Medium | 12-18 months | MEDIUM | Already does engagement metrics. Plan-aware coaching is a natural extension. |
| **Balto** | Low | 24+ months | LOW | Deep in call center market. Product DNA is different. |

**Strategic implication:** The 12-18 month window before Granola or Read.ai can add plan-aware coaching is real. The moat must be built during this window through:
1. Nudge quality iteration (data flywheel)
2. Plan parsing quality (many formats, many meeting types)
3. User habit formation (meetings are daily; users who form a habit are hard to dislodge)

---

## 15. Phased Build Plan

### 15.1 Phase 1 — MVP (Months 1-4)

**Goal:** Prove the core loop: load a plan, capture audio, get real-time nudges during a meeting.

**Target user:** Solo professional (salesperson, consultant, recruiter) doing 1:1 meetings on Zoom/Google Meet on macOS.

**What to build:**

| Component | Scope | Technology |
|---|---|---|
| macOS desktop app | Basic menubar + overlay | Electron (fastest to ship) or Swift (better UX, more effort) |
| System audio capture | macOS Core Audio only | Swift AVAudioEngine |
| VAD | Silence filtering only | Silero VAD via Python subprocess |
| STT | Deepgram streaming WebSocket | Direct integration |
| Plan input | Pasted text only | Simple textarea in app |
| Plan parser | LLM (Claude Haiku) | Prompt-based JSON extraction |
| Plan state machine | Simple pending/covered states | In-memory, no persistence |
| Semantic extraction | MiniLM embeddings | ONNX runtime, local |
| Plan matching | Cosine similarity, threshold filter | FAISS in-memory |
| Rule engine | Talk-time, time remaining | On-device |
| LLM nudge generation | Claude Haiku | With pre-generated cache |
| Nudge governor | Rate limiter + priority queue | In-memory |
| Overlay UI | Floating pill only, no color pulse | Electron/SwiftUI |
| Post-meeting output | Transcript + plan completion score | Claude Haiku |
| Auth | Email/password | Clerk or Supabase Auth |
| Storage | Postgres (transcript, plan) + S3 (audio optional) | Supabase |

**What to defer:**
- Windows support
- Browser extension
- Multi-party / diarization
- CRM integration
- Haptic / audio tones
- PDF / slide deck plan input
- Prosodic sentiment

**Phase 1 Success Metrics:**
- Latency: end-to-end < 2 seconds for 95th percentile nudge
- Coverage: plan items correctly detected as covered in >80% of cases (manual QA)
- Nudge relevance: >70% of surfaced nudges rated "useful" or "very useful" in user survey
- Cost: <$0.35 per meeting
- Completion: working on macOS with Zoom and Google Meet

### 15.2 Phase 2 — Quality and Breadth (Months 5-9)

**Goal:** Make the product significantly smarter and extend to more input formats and platforms.

**What to build:**

| Component | Enhancement |
|---|---|
| Windows support | WASAPI audio capture, Electron port |
| Plan input expansion | PDF, PPTX, markdown files, voice memo (Whisper transcription) |
| Plan parser | All meeting types, Google Calendar integration |
| Semantic extraction | Intent classification (Haiku-based) |
| Adaptive intelligence | Re-sequencing, tangent classification |
| Linguistic sentiment | Per-chunk sentiment scoring |
| Speaker diarization | Deepgram diarization, manual speaker labeling |
| Multi-party nudges | "Who hasn't spoken" rule, group dynamics |
| Nudge delivery | Color pulse + audio tone (earpiece routing) |
| Post-meeting debrief | Full coaching debrief with Claude Sonnet |
| Next meeting prep | Auto-generated from uncovered items |
| Nudge effectiveness feedback | Dismiss / act buttons, training signal collection |
| Analytics dashboard | Talk-time trends, coverage scores over time |
| CRM integration | HubSpot and Salesforce OAuth + deal data pull |

**Phase 2 Success Metrics:**
- Nudge relevance: >80% useful rating
- Coverage detection accuracy: >90%
- Plans parsed correctly from PDF/PPTX: >85%
- Paying users: 500+ Pro subscribers

### 15.3 Phase 3 — Platform and Scale (Months 10-18)

**Goal:** Become the definitive platform for meeting intelligence. Open API for integrations. Team features.

**What to build:**

| Component | Enhancement |
|---|---|
| Native meeting SDK integration | Zoom SDK (in-process audio, no screen capture needed) |
| Apple Watch companion app | Haptic nudge delivery |
| Mobile app (iOS) | In-person meeting support via microphone |
| Prosodic sentiment | Audio-based emotion detection |
| Voice fingerprinting | Automatic speaker identification without enrollment |
| Team plan templates | Shared playbooks for sales teams, interview processes |
| Team analytics | Aggregate coaching metrics, manager dashboards |
| API | Public API for enterprise integrations |
| Custom coaching frameworks | Enterprise: upload your methodology, AI learns your playbook |
| Self-hosted STT | Whisper on GPU at scale (cost optimization) |
| Marketplace | Community-contributed plan templates by meeting type |

**Phase 3 Success Metrics:**
- 5,000+ Pro subscribers
- 50+ Team accounts
- API: 10+ enterprise integrations
- Data flywheel: 500K+ meetings processed with consent, nudge model measurably improving

---

## 16. Architecture Decision Records

### ADR-001: Desktop App vs Browser Extension vs Web App

**Context:** What is the primary distribution mechanism for the product?

**Options Considered:**
- Browser extension: Easy distribution, limited to browser-based meetings, Chrome Web Store gatekeeping risk
- Web app: Lowest friction, but cannot access system audio — fundamentally incompatible with the invisible capture requirement
- Desktop app (Electron): Cross-platform, can access Core Audio/WASAPI, larger binary, requires installation
- Desktop app (Native Swift/SwiftUI): Best macOS UX, fastest, smallest binary, macOS-only initially

**Decision:** Native desktop app — Phase 1 macOS only (Swift), Phase 2 Windows (Electron or Tauri for cross-platform). Native is non-negotiable for system audio access.

**Consequences:** Higher distribution friction than a browser extension. App Store distribution preferred on macOS for trust signal. Must handle notarization and hardened runtime.

**Status:** Accepted

---

### ADR-002: Deepgram vs Self-Hosted Whisper for STT

**Context:** STT is the highest-cost component. Should the product use a managed API or self-host?

**Decision:** Deepgram for Phase 1 and 2. Migrate to self-hosted Whisper at 30K meetings/month.

**Consequences:** Phase 1 iteration speed is maximized. GPU infrastructure is deferred. At 30K meetings/month, the team has revenue ($600K+ ARR) to fund GPU infrastructure investment.

**Status:** Accepted

---

### ADR-003: LLM Provider for Nudge Generation

**Context:** Nudge generation requires <200ms latency. Which LLM provider meets this requirement?

**Decision:** Claude Haiku (Anthropic). Pre-generate nudge variants at plan load time for common scenarios. Reserve live Haiku calls for novel situations.

**Consequences:** Vendor dependency on Anthropic. Mitigation: the nudge prompt is provider-agnostic. Can switch to GPT-4o-mini or Gemini Flash if pricing or latency shifts.

**Status:** Accepted

---

### ADR-004: Local vs Cloud Embedding

**Context:** Embeddings are generated for every transcript chunk (every 5-30 seconds). Should this be a cloud API call or local inference?

**Decision:** Local MiniLM embedding via ONNX runtime. No cloud API call for embeddings.

**Consequences:** 100-200ms latency saving per chunk. Eliminates per-token embedding cost (estimated $20-50/month at 10K meetings/month scale). Reduces privacy surface area (text never leaves device for embedding). Slightly lower embedding quality than text-embedding-3-large, but acceptable for plan matching with 0.70 threshold.

**Status:** Accepted

---

### ADR-005: Plan State Machine Persistence

**Context:** Should plan state persist between meeting sessions?

**Decision:** Plan state is in-memory during the meeting and persisted to Postgres on meeting end. Plans are reusable — a sales team's discovery call plan can be reused across many meetings.

**Consequences:** A crash mid-meeting loses the in-memory coverage state but not the transcript (Deepgram sends transcript; it is written to DB every 60 seconds). Meeting restart re-initializes the state machine from the last written checkpoint.

**Status:** Accepted

---

## Appendix: Infrastructure Stack

| Layer | Technology | Hosting |
|---|---|---|
| Desktop app (macOS) | Swift / SwiftUI | Distributed via macOS App Store + direct download |
| Desktop app (Windows) | Tauri (Rust + WebView) | Distributed via direct download / Winget |
| Backend API | Rust (Axum) | Fly.io or Railway (fast iteration), migrate to GCP/AWS at scale |
| Database | PostgreSQL (Supabase) | Managed — Supabase Pro |
| File storage | S3-compatible (Supabase Storage / Cloudflare R2) | Managed |
| Authentication | Clerk | Managed |
| STT | Deepgram WebSocket | Deepgram Cloud |
| LLM inference | Anthropic API (Haiku + Sonnet) | Anthropic Cloud |
| Embedding | MiniLM via ONNX | On-device (desktop) |
| Vector search | FAISS | On-device (desktop) |
| Analytics | PostHog | PostHog Cloud |
| Error monitoring | Sentry | Sentry Cloud |
| CI/CD | GitHub Actions | GitHub Cloud |

---

*Document complete. Revision history tracked in git.*
