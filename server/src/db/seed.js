import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seed() {
  initDatabase();

  const dataPath = path.resolve(__dirname, '../data/bookleaf_sample_data.json');
  const sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const defaultPasswordHash = bcrypt.hashSync('author123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  // Clear existing data for fresh idempotent seeding
  db.prepare('DELETE FROM ticket_internal_notes').run();
  db.prepare('DELETE FROM ticket_messages').run();
  db.prepare('DELETE FROM tickets').run();
  db.prepare('DELETE FROM books').run();
  db.prepare('DELETE FROM users').run();

  // 1. Insert Admin User
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, author_id, phone, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'ADMIN001',
    'Operations Support Lead',
    'admin@bookleaf.com',
    adminPasswordHash,
    'admin',
    null,
    '+91-99999-00000',
    'Delhi'
  );

  // 2. Insert Authors and Books
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, author_id, phone, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBook = db.prepare(`
    INSERT INTO books (
      id, author_id, title, isbn, genre, publication_date, status,
      mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned,
      royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const author of sampleData.authors) {
    insertUser.run(
      author.author_id,
      author.name,
      author.email,
      defaultPasswordHash,
      'author',
      author.author_id,
      author.phone,
      author.city
    );

    for (const book of author.books) {
      insertBook.run(
        book.book_id,
        author.author_id,
        book.title,
        book.isbn,
        book.genre,
        book.publication_date,
        book.status,
        book.mrp,
        book.author_royalty_per_copy,
        book.total_copies_sold,
        book.total_royalty_earned,
        book.royalty_paid,
        book.royalty_pending,
        book.last_royalty_payout_date,
        book.print_partner,
        JSON.stringify(book.available_on || [])
      );
    }
  }

  // 3. Insert Demonstration Tickets showcasing AI classification, priority, and draft responses
  const insertTicket = db.prepare(`
    INSERT INTO tickets (
      id, author_id, author_name, author_email, book_id, book_title,
      subject, description, status, category, category_confidence,
      priority, priority_reason, ai_classification_override, ai_priority_override,
      ai_status, ai_draft_response, assigned_to, assigned_to_name, has_attachment,
      attachment_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);

  const insertMessage = db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_name, sender_role, content, is_ai_draft_used, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertNote = db.prepare(`
    INSERT INTO ticket_internal_notes (id, ticket_id, admin_id, admin_name, note, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  // Ticket 1: Royalty inquiry (Priya Sharma)
  insertTicket.run(
    'TICK-101',
    'AUTH001',
    'Priya Sharma',
    'priya.sharma@email.com',
    'BK001',
    'Whispers of the Ganges',
    'Pending Royalty Payout Inquiry for Q3/Q4',
    'I published my book 4 months ago and still haven’t received any royalty. What’s going on? My dashboard shows ₹3,570 pending.',
    'Open',
    'Royalty & Payments',
    0.96,
    'High',
    'Author inquiring about pending royalty exceeding standard calculation cycle. Direct financial impact.',
    0,
    0,
    'completed',
    `Dear Priya,\n\nThank you for reaching out, and I completely understand your concern regarding the pending royalty of ₹3,570 for 'Whispers of the Ganges'.\n\nAt BookLeaf, royalties follow an 80/20 net profit split and are calculated quarterly, paid within 45 days of each quarter ending. Since your pending balance exceeds our ₹1,000 threshold, you are fully eligible for disbursement.\n\nOur accounts department has scheduled the upcoming batch transfer for the next cycle run on the 15th. I have flagged your file with our finance lead to confirm your linked bank details and ensure there are no processing holds. We will update you with the transaction UTR reference within 48 hours.\n\nWarm regards,\nBookLeaf Author Support Team`,
    null,
    null,
    0,
    null,
    '-3 hours',
    '-3 hours'
  );

  insertMessage.run(
    'MSG-001',
    'TICK-101',
    'AUTH001',
    'Priya Sharma',
    'author',
    'I published my book 4 months ago and still haven’t received any royalty. What’s going on? My dashboard shows ₹3,570 pending.',
    0,
    '-3 hours'
  );

  insertNote.run(
    'NOTE-001',
    'TICK-101',
    'ADMIN001',
    'Operations Support Lead',
    'Checked ERP: Bank account IFSC is verified. Payment batch Q4 queued for dispatch.',
    '-2 hours'
  );

  // Ticket 2: ISBN Mismatch (Rohit Kapoor)
  insertTicket.run(
    'TICK-102',
    'AUTH002',
    'Rohit Kapoor',
    'rohit.kapoor@email.com',
    'BK003',
    'Code & Karma',
    'Urgent: ISBN discrepancy on Amazon India listing',
    'My book is showing a different ISBN on Amazon than what’s on the physical copy. This is confusing buyers who are ordering copies.',
    'In Progress',
    'ISBN & Metadata Issues',
    0.98,
    'Critical',
    'Active ISBN mismatch on live commercial platform causing customer confusion and catalog data corruption. Escalated to production team.',
    0,
    0,
    'completed',
    `Dear Rohit,\n\nThank you for alerting us to this issue. We treat ISBN and catalog discrepancies with the highest priority, and we apologize for any confusion this has caused for your readers.\n\nEvery title published under BookLeaf receives a verified unique ISBN. We have immediately escalated this to our metadata and production team to audit the Amazon catalog feed for 'Code & Karma' (ISBN: 978-93-5XXXX-03-5).\n\nWe have triggered an emergency metadata correction feed to Amazon India. While platforms usually refresh within 24–48 hours, our team will personally monitor this listing and provide you with a status confirmation within 48 hours.\n\nBest regards,\nBookLeaf Operations Team`,
    'ADMIN001',
    'Operations Support Lead',
    1,
    'amazon_screenshot.png',
    '-1 day',
    '-30 minutes'
  );

  insertMessage.run(
    'MSG-002',
    'TICK-102',
    'AUTH002',
    'Rohit Kapoor',
    'author',
    'My book is showing a different ISBN on Amazon than what’s on the physical copy. This is confusing buyers who are ordering copies.',
    0,
    '-1 day'
  );

  insertMessage.run(
    'MSG-003',
    'TICK-102',
    'ADMIN001',
    'Operations Support Lead',
    'admin',
    `Dear Rohit, thank you for alerting us. We have opened a critical ticket with Amazon Seller Support and re-pushed the ONIX metadata feed. We will confirm as soon as the listing updates.`,
    1,
    '-30 minutes'
  );

  // Ticket 3: Printing & Quality defect (Ananya Reddy)
  insertTicket.run(
    'TICK-103',
    'AUTH003',
    'Ananya Reddy',
    'ananya.reddy@email.com',
    'BK005',
    'Between Two Temples',
    'Defective author copies - Blurry illustrations and trim defect',
    'I received my author copies yesterday and the print quality is terrible. The images are blurry and pages 40-52 have misaligned margins.',
    'Open',
    'Printing & Quality',
    0.95,
    'High',
    'Severe print quality issue reported on author copies. Triggers BookLeaf free reprint guarantee upon photo verification.',
    0,
    0,
    'completed',
    `Dear Ananya,\n\nWe sincerely apologize for the disappointing print quality of your author copies. Authors are our partners, and we take deep pride in delivering flawless physical books.\n\nUnder BookLeaf's Quality Guarantee, if there are printing defects, binding faults, or color inconsistencies, we immediately arrange a free reprint at no cost to you.\n\nCould you please reply with photos clearly showing the blurry images and the misaligned margins on pages 40-52? Once our production team verifies the defect, we will issue a replacement print run with our print partner Epitome Books within 5–7 business days.\n\nWarm regards,\nBookLeaf Quality Assurance`,
    null,
    null,
    1,
    'defective_sample_pages.jpg',
    '-5 hours',
    '-5 hours'
  );

  insertMessage.run(
    'MSG-004',
    'TICK-103',
    'AUTH003',
    'Ananya Reddy',
    'author',
    'I received my author copies yesterday and the print quality is terrible. The images are blurry and pages 40-52 have misaligned margins.',
    0,
    '-5 hours'
  );

  console.log(`Successfully seeded:
  - 1 Admin user (admin@bookleaf.com / admin123)
  - 10 Authors from bookleaf_sample_data.json (default password: author123)
  - 18 Books
  - 3 Initial Demonstration Support Tickets`);
}

// Auto-run if executed directly via `node src/db/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed();
}
