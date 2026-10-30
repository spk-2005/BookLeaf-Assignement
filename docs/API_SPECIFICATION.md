# BookLeaf Author Support & Communication Portal
## Complete REST API Specification

### Base URL: `/api`

All endpoints return JSON responses. Protected endpoints require:
`Authorization: Bearer <JWT_TOKEN>` (or query parameter `?token=<JWT_TOKEN>` for Server-Sent Events).

---

### 1. Authentication Endpoints

#### `POST /api/auth/login`
Authenticates an author or administrator.
- **Request Body**:
  ```json
  {
    "email": "priya.sharma@email.com",
    "password": "author123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "AUTH001",
      "name": "Priya Sharma",
      "email": "priya.sharma@email.com",
      "role": "author",
      "author_id": "AUTH001",
      "phone": "+91-98765-43210",
      "city": "Mumbai"
    }
  }
  ```

#### `GET /api/auth/me`
Fetches authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "AUTH001",
      "name": "Priya Sharma",
      "email": "priya.sharma@email.com",
      "role": "author",
      "author_id": "AUTH001"
    }
  }
  ```

#### `GET /api/auth/demo-accounts`
Returns all pre-seeded evaluation accounts with quick stats for 1-click test switching.
- **Response `200 OK`**:
  ```json
  {
    "users": [
      {
        "id": "ADMIN001",
        "name": "Operations Support Lead",
        "email": "admin@bookleaf.com",
        "role": "admin",
        "book_count": 0
      },
      {
        "id": "AUTH001",
        "name": "Priya Sharma",
        "email": "priya.sharma@email.com",
        "role": "author",
        "book_count": 2,
        "total_pending_royalty": 3570
      }
    ]
  }
  ```

---

### 2. Author Portal Endpoints

#### `GET /api/author/books`
Fetches all published and in-production books belonging to the authenticated author.
- **Headers**: `Authorization: Bearer <token>` (Role: `author`)
- **Response `200 OK`**:
  ```json
  {
    "books": [
      {
        "id": "BK001",
        "author_id": "AUTH001",
        "title": "Whispers of the Ganges",
        "isbn": "978-93-5XXXX-01-1",
        "genre": "Literary Fiction",
        "publication_date": "2023-06-20",
        "status": "Published & Live",
        "mrp": 399,
        "author_royalty_per_copy": 35,
        "total_copies_sold": 342,
        "total_royalty_earned": 11970,
        "royalty_paid": 8400,
        "royalty_pending": 3570,
        "last_royalty_payout_date": "2025-10-15",
        "print_partner": "In-House",
        "available_on": ["Amazon India", "Flipkart", "BookLeaf Store"]
      }
    ]
  }
  ```

#### `GET /api/author/dashboard`
Aggregated financial overview across all author's titles.
- **Response `200 OK`**:
  ```json
  {
    "author": { "name": "Priya Sharma", "city": "Mumbai" },
    "financials": {
      "total_books": 2,
      "total_copies_sold": 531,
      "total_royalty_earned": 19908,
      "total_royalty_paid": 16338,
      "total_royalty_pending": 3570
    },
    "ticketStats": {
      "total_tickets": 1,
      "open_tickets": 1,
      "in_progress_tickets": 0,
      "resolved_tickets": 0
    }
  }
  ```

---

### 3. Ticket Endpoints

#### `GET /api/tickets/my-tickets`
Lists all support tickets submitted by the authenticated author.
- **Response `200 OK`**:
  ```json
  {
    "tickets": [
      {
        "id": "TICK-101",
        "subject": "Pending Royalty Payout Inquiry for Q3/Q4",
        "status": "Open",
        "category": "Royalty & Payments",
        "priority": "High",
        "book_title": "Whispers of the Ganges",
        "created_at": "2026-10-29T14:10:00.000Z",
        "message_count": 1
      }
    ]
  }
  ```

#### `POST /api/tickets`
Submits a new support query. Automatically invokes AI auto-classification, priority scoring, and pre-generates a KB-grounded draft response.
- **Request Body**:
  ```json
  {
    "bookId": "BK001",
    "subject": "Delay in quarterly royalty disbursement",
    "description": "It has been over 50 days since the quarter closed and my bank transfer is still pending.",
    "attachmentName": "bank_statement.pdf"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "ticket": {
      "id": "TICK-8342",
      "author_id": "AUTH001",
      "subject": "Delay in quarterly royalty disbursement",
      "category": "Royalty & Payments",
      "category_confidence": 0.96,
      "priority": "High",
      "priority_reason": "Author inquiring about overdue quarterly royalty disbursement exceeding standard 45-day SLA.",
      "status": "Open",
      "ai_status": "completed"
    },
    "message": "Support ticket submitted successfully"
  }
  ```

#### `GET /api/tickets/:id`
Retrieves ticket metadata, book details, and full conversation timeline. Authors can only access their own tickets; Admins can access all tickets and also receive internal ops notes.
- **Response `200 OK`**:
  ```json
  {
    "ticket": { "id": "TICK-101", "subject": "...", "status": "Open", "priority": "High" },
    "messages": [
      {
        "id": "MSG-001",
        "sender_name": "Priya Sharma",
        "sender_role": "author",
        "content": "I published my book 4 months ago...",
        "created_at": "2026-10-29T14:10:00.000Z"
      }
    ],
    "internalNotes": [
      {
        "id": "NOTE-001",
        "admin_name": "Operations Support Lead",
        "note": "Checked ERP: Bank account IFSC is verified. Payment batch Q4 queued for dispatch.",
        "created_at": "2026-10-29T15:00:00.000Z"
      }
    ],
    "book": { "title": "Whispers of the Ganges", "mrp": 399 }
  }
  ```

#### `POST /api/tickets/:id/messages`
Posts a reply message to the ticket conversation. Automatically transitions ticket status to `In Progress` when an admin responds, and broadcasts via Server-Sent Events.
- **Request Body**:
  ```json
  {
    "content": "Dear Priya, thank you for reaching out...",
    "isAiDraftUsed": true
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": { "id": "MSG-90234", "content": "...", "sender_role": "admin" },
    "ticketStatus": "In Progress"
  }
  ```

---

### 4. Admin Management Endpoints

#### `GET /api/admin/tickets`
Admin queue list supporting filtering, full-text search, and SLA-urgency sorting.
- **Query Parameters**:
  - `status`: `All` | `Open` | `In Progress` | `Resolved` | `Closed`
  - `category`: `All` | `Royalty & Payments` | `ISBN & Metadata Issues` | `Printing & Quality` | `Distribution & Availability` | `Book Status & Production Updates` | `General Inquiry`
  - `priority`: `All` | `Critical` | `High` | `Medium` | `Low`
  - `search`: string search across ticket id, author name, subject, or description
  - `sortBy`: `urgency` (Critical unresolved & oldest first) | `newest` | `oldest`
- **Response `200 OK`**:
  ```json
  {
    "tickets": [ ... ],
    "metrics": {
      "total_tickets": 3,
      "open_count": 2,
      "in_progress_count": 1,
      "resolved_count": 0,
      "critical_count": 1,
      "unassigned_count": 2
    }
  }
  ```

#### `PATCH /api/admin/tickets/:id`
Updates ticket workflow status, manual AI category override, manual priority override, or assignment.
- **Request Body**:
  ```json
  {
    "status": "In Progress",
    "category": "Royalty & Payments",
    "priority": "Critical",
    "assignedTo": "ADMIN001",
    "assignedToName": "Operations Support Lead"
  }
  ```
- **Response `200 OK`**: Returns updated ticket record with `ai_classification_override: 1` and `ai_priority_override: 1`.

#### `POST /api/admin/tickets/:id/notes`
Adds an internal operational note strictly hidden from authors.
- **Request Body**:
  ```json
  {
    "note": "Contacted printer Repro India regarding batch defect. Expedited reprint requested."
  }
  ```
- **Response `201 Created`**: Returns created note.

#### `POST /api/admin/tickets/:id/regenerate-draft`
Regenerates the AI response draft with optional admin instructions.
- **Request Body**:
  ```json
  {
    "customPrompt": "Mention that our finance team will initiate NEFT payment by tomorrow morning."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "draft": "Dear Priya,\n\n...",
    "aiStatus": "completed"
  }
  ```

---

### 5. Real-Time Streaming Endpoint

#### `GET /api/realtime/stream?token=<JWT_TOKEN>`
Subscribes client to live Server-Sent Events (SSE). Broadcasts events:
- `NEW_TICKET`: Dispatched on new query submission.
- `NEW_MESSAGE`: Dispatched when author or admin posts a response.
- `TICKET_UPDATED`: Dispatched when status, category, priority, or assignee is modified.
- `INTERNAL_NOTE_ADDED`: Dispatched when ops team adds confidential note.
