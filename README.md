# Meeting Copilot

**Real-Time Conversation Coach + Note-Taker**

> Every professional walks into important meetings with a plan. No product helps you execute it in real-time.

---

## The Problem

Note-taking apps (Granola, Otter, Fireflies, Fathom) have solved the **capture** problem -- they record, transcribe, and summarize meetings beautifully.

But they all share the same fundamental limitation: **they only look backward.** They tell you what was said. They don't help you steer what gets said next.

Every professional walks into important meetings with a plan -- a script, an agenda, talking points, objection handles, key questions to ask, information to extract. Today, that plan lives in a separate doc, a printed sheet, or scattered sticky notes that you awkwardly scroll through while trying to maintain eye contact on a Zoom call.

**The gap: No product combines invisible meeting capture with real-time, adaptive conversation guidance from your own playbook.**

---

## The Product

### Before the Meeting
Load your plan: agenda items, talking points, questions to ask, information to extract, objection responses, desired outcomes. Paste a prep doc, upload a PDF, pull from your CRM, or just tell it what you want to accomplish -- the AI parses it.

### During the Meeting
A minimal, glanceable overlay that:
- Captures transcript seamlessly (no bot visible to others)
- **Tracks your plan progress** -- which items you've covered, which you haven't
- **Nudges you in real-time** -- `ask about budget` / `pause, let them talk` / `mention the 40% stat`
- **Feeds you lines** -- surfaces the exact talking point when a topic comes up
- **Warns you** -- `you've been talking 4 min straight` / `going off-track`
- **Adapts to curveballs** -- re-sequences your remaining agenda when the conversation shifts
- **Surfaces objection handles** -- when they raise a concern, shows your prepped response

### After the Meeting
- Full transcript + AI summary (table stakes)
- **Plan completion scorecard** -- what % of your agenda you covered, what was missed
- **Coaching debrief** -- "You dominated 72% of talk time", "You missed 3 of 5 key questions", "Buying signals at 14:22 went unfollowed"
- **Next meeting prep** -- auto-generates follow-up agenda based on what was and wasn't covered

---

## Use Cases

This is NOT just a sales tool. The plan-aware coaching applies to any high-stakes conversation:

| Use Case | The Plan | The Nudges |
|---|---|---|
| **Sales discovery call** | Qualification questions, pain points, pricing script | `ask about timeline` / `they mentioned a competitor -- probe deeper` / `present the case study now` |
| **Investor pitch** | Pitch deck flow, key metrics, anticipated questions | `you skipped market size` / `use the $4.61 COGS figure` / `ask for the check` |
| **Board meeting** | Agenda items, KPI updates, decisions needed | `3 of 7 items covered, 15 min left` / `CFO hasn't spoken -- invite input` / `call for vote` |
| **Job interview (interviewer)** | Competency questions, evaluation criteria | `haven't assessed leadership yet` / `don't ask about family status` / `probe deeper on conflict resolution` |
| **Job interview (candidate)** | STAR stories, questions to ask, salary negotiation | `use the AWS migration story` / `don't give a number first` |
| **Negotiation** | BATNA, walk-away points, concession sequence | `hold firm until they address scope` / `you've conceded twice -- ask for something back` |
| **Workshop facilitation** | Activity sequence, time blocks, energy management | `activity 2 running long -- wrap in 2 min` / `energy low -- move to breakout` |
| **Difficult conversation** | Key message, boundaries, de-escalation phrases | `stay on message` / `use the I-statement you prepped` |

---

## Key Design Principles

### 1. Invisible Presence (Non-Negotiable)
The tool MUST NOT appear in the meeting as a bot or participant. It captures via system audio. The moment a coaching tool is visible to others, trust breaks down. This is the #1 product requirement.

### 2. Nudges, Not Paragraphs (Non-Negotiable)
The coaching must feel like a whisper in your ear, not a teleprompter. Every nudge must be **glanceable in under 1 second** -- 6-8 words max. One nudge at a time. No nudge is better than a bad nudge.

### 3. Plan Input Flexibility
Accept anything: pasted text, markdown, PDFs, CRM data, calendar events, voice memos, prior meeting follow-ups. The AI parses any input into goals, agenda items, talking points, questions, and objection handles.

### 4. Adaptive Intelligence
Re-sequence when conversations go off-script. Detect opportunities. Coach on silence. Manage tangents. Track time vs. remaining agenda.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Market Sizing & Opportunity](docs/01-market-sizing-and-opportunity.md) | TAM/SAM/SOM analysis, buyer segments, growth drivers |
| [Competitive Intelligence](docs/02-competitive-intelligence.md) | Detailed competitor analysis and white space mapping |
| [Business Model & GTM](docs/03-business-model-and-gtm.md) | Pricing tiers, unit economics, go-to-market strategy |
| [Technical Architecture](docs/04-technical-architecture.md) | System design, real-time pipeline, build plan |

---

## The White Space

Nobody combines:
- **Granola-quality** invisible capture
- **Fellow-style** pre-meeting planning
- **Balto-style** real-time guidance
- **Universal** meeting type support

The defensible moat is not the capture (commodity) or the transcript (commodity) -- it's the **plan-matching intelligence**: understanding what you're trying to accomplish and dynamically guiding you there through a live conversation. That's the hard AI problem nobody has solved.

---

## Market Opportunity

| Layer | Size |
|---|---|
| **TAM** (Meeting intelligence + sales coaching + productivity AI) | $15-25B |
| **SAM** (Real-time coaching for structured professional meetings) | $3-6B |
| **SOM Year 1** (PLG traction, U.S. professionals) | $5-15M |
| **SOM Year 3** (Team/enterprise expansion) | $30-80M |

The meeting intelligence market is growing at ~21% CAGR. The real-time coaching niche is underserved and early.

---

## Competitive Landscape (Summary)

| Category | Players | What They Do | What They Don't Do |
|---|---|---|---|
| **Note-Taking** | Granola, Otter, Fireflies, Fathom | Capture + transcribe + summarize | No real-time coaching, no plan awareness |
| **Sales Coaching** | Gong, Chorus, Balto | Post-call analytics or rigid scripts | Not real-time (Gong/Chorus) or not adaptable (Balto) |
| **Real-Time Coaching** | Hedy AI, Poised | Live suggestions or speech analytics | No plan-aware coaching from YOUR playbook |
| **Meeting Management** | Fellow, Hugo | Agendas + manual notes | No AI coaching, no transcript |

**Closest competitor:** Hedy AI (25K users, real-time coaching) -- but coaches from conversation context, not from a user's pre-loaded plan. Adding plan-awareness would be 12-18 months of development for them.

---

## Revenue Model

| Tier | Price | Target |
|---|---|---|
| **Free** | $0 | 5 meetings/month, basic notes + transcript |
| **Pro** | $19/month | Full coaching, plan import, post-meeting debrief |
| **Team** | $29/user/month | Shared playbooks, team analytics, CRM integration |
| **Enterprise** | Custom | SSO, compliance, custom coaching frameworks, API |

Pro tier gross margin: ~89%. Unit economics driven by STT (Deepgram) + LLM inference, ~$2/user/month COGS.

---

## Technical Architecture (High Level)

```
PRE-MEETING                          DURING-MEETING                         POST-MEETING
+-----------------+                  +------------------+                   +------------------+
| Plan Input      |                  | Audio Capture    |                   | Summary          |
| (text/PDF/CRM/  |                  | (System Audio -  |                   | Plan Scorecard   |
|  voice/calendar) |                 |  no bot visible) |                   | Coaching Debrief |
+--------+--------+                  +--------+---------+                   | Next Meeting Prep|
         |                                    |                             +------------------+
         v                                    v
+--------+--------+                  +--------+---------+
| Plan Parser     |                  | STT Pipeline     |
| (LLM extraction |                  | (Deepgram stream)|
|  + state machine)|                 +--------+---------+
+--------+--------+                           |
         |                                    v
         |                           +--------+---------+
         +-------------------------->| Plan Matching    |
                                     | Engine           |
                                     | (semantic sim +  |
                                     |  coverage state) |
                                     +--------+---------+
                                              |
                                              v
                                     +--------+---------+     +------------------+
                                     | Nudge Generator  |---->| Desktop Overlay  |
                                     | (rules + LLM)    |     | (floating pill,  |
                                     +------------------+     |  color pulse,    |
                                                              |  haptic, audio)  |
                                                              +------------------+
```

**Latency budget:** <500ms from speech to nudge. Hybrid approach: rule-based for time/talk-ratio alerts, LLM for semantic plan-matching. Max 1 nudge per 60 seconds.

---

## Open Questions

1. **Nudge visibility calibration** -- too subtle = ignored, too prominent = distracting. Needs UX testing.
2. **In-person meetings** -- phone in pocket + earpiece? Smartwatch haptics?
3. **Multi-party meetings** -- coaching a 1:1 is different from coaching a facilitator in a 10-person room.
4. **Should the AI ever speak for you?** -- auto-compose follow-up messages?
5. **Ethics** -- is AI coaching in negotiations without disclosure manipulative? How does this differ from prepping with a human coach?

---

## Naming Exploration

Working names under consideration:
- **Cadence** -- the rhythm of a well-led conversation
- **Steer** -- direct and to the point
- **Glance** -- the peripheral coaching experience
- **Nudge** -- what it does
- **Cue** -- feeds you your lines
- **TalkTrack** -- follows your planned track while capturing the talk

---

*Startup Weekend Orlando 2026*
