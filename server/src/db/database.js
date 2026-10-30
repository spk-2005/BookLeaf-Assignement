import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database.sqlite');

export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('author', 'admin')) NOT NULL,
      author_id TEXT,
      phone TEXT,
      city TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      isbn TEXT,
      genre TEXT,
      publication_date TEXT,
      status TEXT NOT NULL,
      mrp INTEGER,
      author_royalty_per_copy INTEGER,
      total_copies_sold INTEGER DEFAULT 0,
      total_royalty_earned INTEGER DEFAULT 0,
      royalty_paid INTEGER DEFAULT 0,
      royalty_pending INTEGER DEFAULT 0,
      last_royalty_payout_date TEXT,
      print_partner TEXT,
      available_on TEXT, -- JSON string array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      book_id TEXT,
      book_title TEXT,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
      category TEXT NOT NULL,
      category_confidence REAL DEFAULT 0.9,
      priority TEXT CHECK(priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
      priority_reason TEXT,
      ai_classification_override INTEGER DEFAULT 0, -- 1 if admin manually changed category
      ai_priority_override INTEGER DEFAULT 0,       -- 1 if admin manually changed priority
      ai_status TEXT DEFAULT 'completed',           -- 'completed', 'fallback', 'pending'
      ai_draft_response TEXT,
      assigned_to TEXT,
      assigned_to_name TEXT,
      has_attachment INTEGER DEFAULT 0,
      attachment_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT CHECK(sender_role IN ('author', 'admin')) NOT NULL,
      content TEXT NOT NULL,
      is_ai_draft_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ticket_internal_notes (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_author_id ON tickets(author_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
    CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
    CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON ticket_messages(ticket_id);
  `);

  console.log('Database tables initialized successfully.');
}
