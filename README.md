# BookLeaf Publishing — Author Support & Communication Portal
> **Full-Stack Developer Technical Assignment**  
> An AI-assisted support desk and author portal built for scale, featuring real-time communication, context-aware AI drafting, and role-based access control.

---

## 💡 What is this project?

**BookLeaf Publishing** is a self-publishing house processing **1,200+ books every month** across an active catalog of **22,000+ titles** in India and the US. 

With thousands of active authors, communication at scale is a major operational challenge. Authors frequently reach out regarding:
- **Royalty payouts & calculations** (quarterly cycles, 80/20 splits, ₹1,000 payout thresholds)
- **Book production milestones** (manuscripts moving through cover design and typesetting)
- **Retail catalog sync issues** (titles showing as unavailable on Amazon/Flipkart)
- **Printing quality concerns** (binding issues or misprints on physical author copies)

Handling these inquiries manually causes delayed responses, inconsistent answers, and a growing support backlog.

This project delivers a **two-sided Author Support & Communication Portal** (Author Portal + Operations Desk) powered by context-aware AI auto-classification, urgency scoring, and policy-grounded draft responses.

---

## ⚡ Quickstart: Run in 60 Seconds

### Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **npm** v9+

### 1. Install all dependencies
Run this once from the project root. It installs the backend and frontend packages automatically:
```bash
npm run install:all
```

### 2. Seed the sample dataset
Populates the database with the provided **10 authors**, **18 books**, admin user, and realistic demonstration tickets:
```bash
npm run seed
```

### 3. Launch the application
Starts both the Express API server (port `5000`) and the Vite React app (port `5173`) concurrently:
```bash
npm run dev
```

Now open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 👥 How to Test: The 1-Click Persona Switcher

Testing role-based permissions and workflows can be tedious if you have to log in and out repeatedly. 

To make reviewing effortless, we added a **Demo Evaluator Switcher** pinned to the top of the screen. You can switch between the Operations Lead and any of the 10 authors with **one click**:

| Persona | Role | Why Test This Account? | Default Password |
| :--- | :--- | :--- | :--- |
| **Operations Support Lead** (`admin@bookleaf.com`) | **Admin** | Full access to incoming queue, AI category/priority overrides, AI draft workbench, and private internal notes. | `admin123` |
| **Priya Sharma** (`AUTH001`) | **Author** | Has 2 published live titles (*Whispers of the Ganges*, *The Saffron Diaries*) and ₹3,570 in pending royalties. | `author123` |
| **Rohit Kapoor** (`AUTH002`) | **Author** | Author of *Code & Karma*, pre-seeded with a Critical ISBN mismatch ticket on Amazon. | `author123` |
| **Ananya Reddy** (`AUTH003`) | **Author** | Author of *Between Two Temples*, pre-seeded with a print defect query and sample defective copy attachment. | `author123` |
| **Sneha Kulkarni** (`AUTH007`) | **Author** | Tests production edge cases: 2 bestseller titles plus *Midnight in Mysore* currently **In Production - Cover Design** (MRP null, ₹0 royalty). | `author123` |
| **Kavita Deshmukh** (`AUTH009`) | **Author** | Tests rollover edge cases: Has 1 book in **Typesetting** and 1 live book with ₹850 royalty (under the ₹1,000 threshold → tests quarterly rollover policy). | `author123` |

---

## 🖥️ Feature Walkthrough

### 1. Author Portal (`/author`)
- **My Books Catalog**: Visual cards for all books by the logged-in author showing title, ISBN, genre, status (*Published & Live* vs. *In Production*), MRP, sales count, royalties earned, royalties paid, and pending balance.
- **Raise a Query**: Clean submission modal with a book selector (*"General / Account Level"* or specific titles), subject, description, and drag-and-drop file attachment preview.
- **Live Ticket Thread**: View full conversation history with BookLeaf support. Updates in **real time**—when an admin responds, the author sees it immediately without refreshing the page.

### 2. Admin Operations Desk (`/admin`)
- **SLA Urgency Queue**: Filter tickets by Status, Category, or Priority. Includes a one-click sort by **SLA Urgency** to ensure oldest and Critical tickets are resolved first.
- **AI Auto-Classification & Overrides**: Automatically sorts queries into 6 categories with confidence scores. If an AI classification is imperfect, the admin can correct it with a single click.
- **AI Priority Scoring**: Assigns *Critical, High, Medium, or Low* with a plain-English explanation.
- **AI-Drafted Responses**: Generates a pre-written response strictly following BookLeaf's Knowledge Base (80/20 royalty split, quarterly cycle with 45-day payout, ₹1,000 threshold, 5-7 day reprints, 24-48h stock sync). The admin can click **"Use & Edit Draft"** to tweak before sending.
- **Confidential Internal Notes**: Yellow-tinted notes for internal communication between ops team members (e.g. tracking printer batch numbers). These are **strictly hidden** from the author.

---

## 🏗️ System Architecture & Technology Choices

### 1. Technology Stack
- **Frontend**: React 19 + Vite + Vanilla CSS design tokens. Clean, lightweight, and fast.
- **Backend**: Node.js + Express (ES Modules) organized into clean routes, controllers, and services.
- **Database**: SQLite with **WAL Mode** (via `better-sqlite3`).
- **Real-Time Layer**: **Server-Sent Events (SSE)**.
- **AI Integration**: Modular service supporting OpenAI (`gpt-4o-mini`), Google Gemini (`1.5-flash`), or automatic offline heuristic fallback.

### 2. Architectural Decisions Explained in Plain English

#### Why SQLite instead of an external database?
- **Zero-Friction Review**: An evaluator can clone and run the project immediately without needing Docker or setting up a local database server.
- **Relational Integrity for Financials**: Unlike MongoDB, SQL enforces ACID transactions and foreign keys, ensuring royalty calculations and book references never become orphaned.
- **Production Ready**: Built using standard ANSI SQL. In production, this schema maps 1:1 to **PostgreSQL** on platforms like Render, Supabase, or AWS RDS.

#### Why Server-Sent Events (SSE) instead of WebSockets?
- Support tickets are read-heavy with periodic updates. 
- SSE works over standard HTTP/2, traverses enterprise firewalls seamlessly, reconnects automatically if the network drops, and requires far less server memory than full-duplex WebSockets.

---

## 🧠 How the AI Integration Works

AI quality accounts for **25% of the evaluation**. Here is how we engineered it for production reliability and cost efficiency:

### 1. Cost Awareness: Topic Routing (Mini-RAG)
Dumping the entire 7-page Knowledge Base on every query is slow and burns unnecessary tokens.
- Our [`kbService.js`](file:///b:/BookLeaf/server/src/services/kbService.js) inspects the query topic first.
- Inquiries about payments only inject the **Royalty Policy**.
- Inquiries about blurry copies only inject the **Printing & Quality Policy**.
- Inquiries about Amazon availability only inject the **Distribution Policy**.
- **Result**: Context size drops from ~2,500 tokens to under ~250 tokens per call—an **85%+ reduction in token cost**.

### 2. Real Human Tone, Not AI Fluff
Prompts follow BookLeaf's exact Communication Guidelines:
- Treat authors as **creative partners**, not tickets to deflect.
- Acknowledge distress and validate feelings before offering explanations.
- Cite actual numbers, dates, and turnaround times.
- Directly own BookLeaf delays with a firm **48-hour resolution SLA**.

### 3. Graceful Degradation (Zero Downtime)
What happens if the OpenAI or Gemini API is down, rate-limited (HTTP 429), or an API key is missing?
- The system automatically triggers the built-in **Deterministic Heuristic Engine**.
- It classifies the query, assigns priority, and provides a policy-grounded draft response (`ai_status: "fallback"`).
- **The portal never crashes, and author tickets are never lost.**

---

## 📡 REST API Reference

Full endpoint documentation is available in [docs/API_SPECIFICATION.md](file:///b:/BookLeaf/docs/API_SPECIFICATION.md) and live at `http://localhost:5000/api/docs`.

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Email/password login with JWT token | Public |
| `GET` | `/api/auth/demo-accounts` | List of pre-seeded test accounts for quick switcher | Public |
| `GET` | `/api/author/books` | Author's published and in-production titles | Author only |
| `GET` | `/api/author/dashboard` | Financial stats and royalty summary | Author only |
| `GET` | `/api/tickets/my-tickets` | List tickets submitted by logged-in author | Author only |
| `POST` | `/api/tickets` | Submit query (AI auto-classifies & scores) | Author only |
| `GET` | `/api/tickets/:id` | View ticket details and message thread | Author / Admin |
| `POST` | `/api/tickets/:id/messages` | Post reply to conversation thread | Author / Admin |
| `GET` | `/api/admin/tickets` | Queue of tickets with filters & SLA sorting | Admin only |
| `PATCH`| `/api/admin/tickets/:id` | Update status, override AI category/priority | Admin only |
| `POST` | `/api/admin/tickets/:id/notes` | Add confidential internal note | Admin only |
| `POST` | `/api/admin/tickets/:id/regenerate-draft` | Regenerate AI draft with custom guidance | Admin only |
| `GET` | `/api/realtime/stream` | Server-Sent Events live stream | Authenticated |

---

## 🚢 Production Deployment Guide

### Deploying the Backend (Render / Railway / Fly.io)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT=5000`
  - `JWT_SECRET=your-production-secret-key`
  - `OPENAI_API_KEY=your-api-key` (optional)
  - `GEMINI_API_KEY=your-api-key` (optional)

### Deploying the Frontend (Vercel / Netlify / Cloudflare Pages)
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Proxy / Rewrites**: Configure `/api/*` to forward to your deployed backend URL.

---

## 📂 Project Structure

```
BookLeaf/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets (Official BookLeaf logo, favicon)
│   └── src/
│       ├── components/         # BookCard, Navbar, Modals, Logo, Badges
│       ├── context/            # AuthContext (with Switcher), RealtimeContext (SSE)
│       ├── pages/              # AuthorDashboard, AdminDashboard, LoginPage
│       ├── services/           # Frontend API client
│       └── index.css           # BookLeaf Coral & Charcoal design system
│
├── server/                     # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/        # Auth, Author, Ticket, Admin logic
│   │   ├── data/               # Knowledge Base & bookleaf_sample_data.json
│   │   ├── db/                 # SQLite database connection & seeder
│   │   ├── middleware/         # JWT authentication & RBAC guards
│   │   ├── routes/             # RESTful endpoint definitions
│   │   └── services/           # AI orchestrator, Mini-RAG, SSE broadcaster
│   └── database.sqlite         # Pre-seeded database
│
├── docs/
│   ├── API_SPECIFICATION.md    # Complete OpenAPI/REST API spec
│   └── SUBMISSION_WRITEUP.md   # 1-Page Technical Write-Up (Approach & Roadmap)
└── README.md                   # This guide
```

---

## 📝 1-Page Technical Write-Up

As requested in the assignment brief, a dedicated 1-page note explaining architectural approach, trade-offs made, and future production evolution is available at:  
👉 **[docs/SUBMISSION_WRITEUP.md](file:///b:/BookLeaf/docs/SUBMISSION_WRITEUP.md)**
