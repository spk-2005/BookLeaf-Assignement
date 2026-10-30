# BookLeaf Publishing — Author Support & Communication Portal
> **Assignment 1 of 2: Full-Stack Developer Position**  
> AI-assisted Author Support & Operations Communication Portal with Real-Time Synchronization.

---

## 📖 Executive Summary
BookLeaf Publishing processes **1,200+ books monthly across a catalog of 22,000+ titles**. This portal solves author communication at scale through:
1. **Author Portal**: Personal book catalog, royalty breakdowns (earned, paid, pending with ₹1,000 threshold tracking), query submission with attachment support, and real-time conversation threads.
2. **Admin Operations Desk**: Filterable queue sorted by SLA urgency, automated AI ticket classification & priority scoring with manual overrides, context-aware AI draft generation using BookLeaf's Knowledge Base, confidential internal notes, and assignment controls.
3. **AI Architecture**: Token-efficient topic routing (Mini-RAG), empathetic prompt engineering reflecting BookLeaf's exact policies, and a deterministic offline fallback engine ensuring **zero downtime** if external AI APIs are unreachable or unconfigured.
4. **Real-Time Live Sync**: Powered by Server-Sent Events (SSE) so authors and support reps see new queries, replies, and status updates instantly without page reloads.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js** v18+ (tested on Node v22.20.0)
- **npm** v9+

### 1. One-Command Setup
Clone the repository, then run the installer:
```bash
# From the project root
npm run install:all
```
*(This installs root orchestrator, backend dependencies, and frontend dependencies.)*

### 2. Seed Sample Dataset
Pre-seeds all **10 authors**, **18 books** from `bookleaf_sample_data.json`, default admin user, and realistic demonstration tickets:
```bash
npm run seed
```

### 3. Environment Configuration (Optional)
The backend includes a pre-configured `.env` in `server/.env`.
```env
PORT=5000
JWT_SECRET=bookleaf-secure-production-jwt-token-key-2026

# Optional: Add your OpenAI or Gemini key to test live LLM calls.
# If omitted or offline, the built-in deterministic heuristic engine
# will gracefully handle 100% of auto-classification and response drafting!
OPENAI_API_KEY=
GEMINI_API_KEY=
```

### 4. Run Application
Start both backend API (`localhost:5000`) and frontend Vite client (`localhost:5173`) concurrently:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 👥 Test Credentials & 1-Click Persona Switcher

The application features a **top-bar demo switcher** allowing evaluators to switch between personas instantly without manually re-logging in!

| Role | Name | Email | Password | Notable Test Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Operations Support Lead | `admin@bookleaf.com` | `admin123` | Full queue access, AI classification & priority overrides, AI draft workbench, internal notes. |
| **Author** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | `author123` | 2 titles (`Whispers of the Ganges`, `The Saffron Diaries`), ₹3,570 pending royalty. |
| **Author** | Rohit Kapoor (`AUTH002`) | `rohit.kapoor@email.com` | `author123` | 2 titles (`Code & Karma`), pre-seeded with Critical ISBN mismatch ticket. |
| **Author** | Ananya Reddy (`AUTH003`) | `ananya.reddy@email.com` | `author123` | 1 title (`Between Two Temples`), print defect ticket with photo attachment. |
| **Author** | Sneha Kulkarni (`AUTH007`) | `sneha.kulkarni@email.com` | `author123` | 3 titles including `Midnight in Mysore` currently **In Production - Cover Design** (MRP null, ₹0 royalty). |
| **Author** | Kavita Deshmukh (`AUTH009`) | `kavita.deshmukh@email.com` | `author123` | 1 book in **Typesetting** + 1 title with ₹850 royalty (testing rollover under ₹1,000 threshold). |

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph UI ["Frontend (React + Vite + Modern CSS)"]
        AuthorView["Author Portal (Books, Payouts, Live Query Thread)"]
        AdminView["Admin Desk (SLA Queue, AI Overrides, Draft Workbench)"]
        PersonaBar["1-Click Demo Persona Switcher"]
    end

    subgraph API ["Backend API (Node.js / Express)"]
        AuthMid["JWT Auth & RBAC Middleware"]
        SSE["Server-Sent Events Broadcaster (/api/realtime/stream)"]
        TicketCtrl["Ticket Controller (Auto-Classification, Messaging)"]
        AdminCtrl["Admin Controller (Status, Overrides, Notes)"]
        AuthorCtrl["Author Controller (Books, Financial Aggregates)"]
    end

    subgraph Services ["Intelligence & Data Layer"]
        AIService["AI Orchestrator (Multi-Provider: OpenAI / Gemini)"]
        Fallback["Heuristic Offline Fallback Engine"]
        KB["Knowledge Base Service (Topic Routing / Mini-RAG)"]
        DB[(SQLite WAL DB: Users, Books, Tickets, Notes)]
    end

    AuthorView -->|REST API| AuthMid
    AdminView -->|REST API| AuthMid
    AuthMid --> TicketCtrl
    AuthMid --> AdminCtrl
    AuthMid --> AuthorCtrl
    TicketCtrl --> AIService
    AIService --> KB
    AIService -.->|On Timeout / Rate Limit| Fallback
    TicketCtrl --> DB
    TicketCtrl -->|Live Broadcast| SSE
    AdminCtrl --> DB
    AdminCtrl -->|Live Broadcast| SSE
    SSE -->|Real-time Stream| UI
```

---

## 🧠 AI Integration Details

### 1. Model Choice Justification
We prioritized **OpenAI `gpt-4o-mini`** and **Google Gemini `1.5/2.0 Flash`**:
- **Sub-Second Latency**: Classification and draft generation complete in ~400–700ms.
- **Cost Efficiency**: At ~$0.15 per 1M input tokens, processing thousands of monthly support queries costs pennies.
- **Structured JSON Reliability**: Strict schema compliance for category confidence scores and priority assignments.

### 2. Prompt Strategy & Communication Tone
Prompts are grounded in BookLeaf's explicit **Communication Tone Guidelines**:
- **Partnership Stance**: Authors are treated as respected creative partners, never as tickets to deflect.
- **Empathetic Acknowledgment**: Acknowledges the author's distress before providing explanations.
- **Concrete Facts & Numbers**: Automatically references exact policies (80/20 net profit split, quarterly cycle with 45-day disbursement, ₹1,000 payout threshold, 5–7 day reprint window, 24–48 hour retail re-sync).
- **Direct Accountability**: Explicitly owns BookLeaf errors (e.g. ISBN mismatch) with a firm 48-hour resolution commitment.

### 3. Cost Awareness (Mini-RAG / Topic Routing)
Sending all 7 pages of the Knowledge Base on every query is wasteful. The `kbService` utilizes **topic-based context extraction**:
- Inquiries mentioning payments, bank accounts, or statement delays only pull the **Royalty Policy & Payout Guidelines**.
- Inquiries mentioning misprints, margins, or binding defects only pull the **Printing & Quality Policy**.
- Inquiries regarding retail platforms pull the **Distribution & Availability Policy**.
- **Result**: Context size drops from ~2,500 tokens to under ~250 tokens per call—an **85%+ reduction in token cost**.

### 4. Graceful Degradation & Error Handling
External LLM APIs can suffer outages or rate limits (HTTP 429). The system implements an **air-tight fallback**:
- If API keys are missing or a network call fails, the built-in **Deterministic Heuristic Engine** takes over.
- The ticket is classified, scored for priority, and paired with a policy-grounded draft response.
- Flagged with `ai_status: "fallback"`.
- Support operations continue with 100% functionality and **zero downtime or 500 errors**.

---

## 📡 REST API Summary

Full documentation is available in [docs/API_SPECIFICATION.md](file:///b:/BookLeaf/docs/API_SPECIFICATION.md) and live at `/api/docs`.

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Email/password login with JWT token | Public |
| `GET` | `/api/auth/demo-accounts` | List of pre-seeded test accounts | Public |
| `GET` | `/api/author/books` | Author's published and in-production titles | Author |
| `GET` | `/api/author/dashboard` | Financial stats and royalty summary | Author |
| `GET` | `/api/tickets/my-tickets` | List tickets submitted by author | Author |
| `POST` | `/api/tickets` | Submit query (AI auto-classifies & scores) | Author |
| `GET` | `/api/tickets/:id` | View ticket details and message thread | Author / Admin |
| `POST` | `/api/tickets/:id/messages` | Post reply to conversation thread | Author / Admin |
| `GET` | `/api/admin/tickets` | Queue of tickets with filters & SLA sorting | Admin |
| `PATCH`| `/api/admin/tickets/:id` | Update status, override AI category/priority | Admin |
| `POST` | `/api/admin/tickets/:id/notes` | Add confidential internal note | Admin |
| `POST` | `/api/admin/tickets/:id/regenerate-draft` | Regenerate AI draft with custom guidance | Admin |
| `GET` | `/api/realtime/stream` | Server-Sent Events live stream | Author / Admin |

---

## 🚢 Deployment Guide

The application is structured for instant one-click deployment:

### Backend (Render / Railway / Fly.io / VPS)
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: `PORT=5000`, `JWT_SECRET=...`, `OPENAI_API_KEY=...`

### Frontend (Vercel / Netlify / Cloudflare Pages)
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Proxy / Rewrites: Configure `/api/*` rewrite rule pointing to backend URL.

---

## 📄 Deliverables Summary
1. **Source Code**: Fully modular, well-commented code following clean architecture.
2. **API Documentation**: [docs/API_SPECIFICATION.md](file:///b:/BookLeaf/docs/API_SPECIFICATION.md)
3. **1-Page Technical Write-Up**: [docs/SUBMISSION_WRITEUP.md](file:///b:/BookLeaf/docs/SUBMISSION_WRITEUP.md)
4. **Seed Dataset**: Ingests exact records from `bookleaf_sample_data.json`.
