import { db } from '../db/database.js';
import { classifyAndScoreTicket, generateDraftResponse } from '../services/aiService.js';
import { sseService } from '../services/sseService.js';

export function getAuthorTickets(req, res) {
  const authorId = req.user.author_id;

  const tickets = db.prepare(`
    SELECT t.*, 
           (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count,
           (SELECT MAX(created_at) FROM ticket_messages WHERE ticket_id = t.id) as last_activity
    FROM tickets t
    WHERE t.author_id = ?
    ORDER BY t.created_at DESC
  `).all(authorId);

  res.json({ tickets });
}

export async function createTicket(req, res) {
  const author = req.user;
  const { bookId, subject, description, attachmentName } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Subject is required' });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Detailed description is required' });
  }

  // Lookup book if specified
  let book = null;
  if (bookId && bookId !== 'general') {
    book = db.prepare('SELECT * FROM books WHERE id = ? AND author_id = ?').get(bookId, author.author_id);
  }

  const ticketId = 'TICK-' + Math.floor(1000 + Math.random() * 9000);

  // 1. Run AI Auto-Classification & Priority Scoring
  const classification = await classifyAndScoreTicket({
    subject: subject.trim(),
    description: description.trim(),
    authorName: author.name,
    book
  });

  // 2. Pre-generate context-aware draft response using BookLeaf KB
  const aiDraft = await generateDraftResponse({
    authorName: author.name,
    subject: subject.trim(),
    description: description.trim(),
    category: classification.category,
    book
  });

  // 3. Persist Ticket to Database
  db.prepare(`
    INSERT INTO tickets (
      id, author_id, author_name, author_email, book_id, book_title,
      subject, description, status, category, category_confidence,
      priority, priority_reason, ai_status, ai_draft_response,
      has_attachment, attachment_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticketId,
    author.author_id,
    author.name,
    author.email,
    book ? book.id : null,
    book ? book.title : 'General / Account Level',
    subject.trim(),
    description.trim(),
    classification.category,
    classification.categoryConfidence,
    classification.priority,
    classification.priorityReason,
    classification.aiStatus,
    aiDraft.draft,
    attachmentName ? 1 : 0,
    attachmentName || null
  );

  // 4. Insert Initial Query Message
  const messageId = 'MSG-' + Math.floor(10000 + Math.random() * 90000);
  db.prepare(`
    INSERT INTO ticket_messages (
      id, ticket_id, sender_id, sender_name, sender_role, content, is_ai_draft_used
    ) VALUES (?, ?, ?, ?, 'author', ?, 0)
  `).run(
    messageId,
    ticketId,
    author.id,
    author.name,
    description.trim()
  );

  const createdTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);

  // 5. Broadcast real-time SSE event to all connected dashboards
  sseService.broadcast('NEW_TICKET', { ticket: createdTicket });

  res.status(201).json({
    ticket: createdTicket,
    message: 'Support ticket submitted successfully'
  });
}

export function getTicketById(req, res) {
  const { id } = req.params;
  const user = req.user;

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
  }

  // RBAC: Authors can only view their own tickets
  if (user.role === 'author' && ticket.author_id !== user.author_id) {
    return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to view this ticket' });
  }

  // Fetch conversation messages
  const messages = db.prepare(`
    SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC
  `).all(id);

  // Fetch internal notes if admin
  let internalNotes = [];
  if (user.role === 'admin') {
    internalNotes = db.prepare(`
      SELECT * FROM ticket_internal_notes WHERE ticket_id = ? ORDER BY created_at ASC
    `).all(id);
  }

  // Fetch associated book details if any
  let book = null;
  if (ticket.book_id) {
    book = db.prepare('SELECT * FROM books WHERE id = ?').get(ticket.book_id);
    if (book) {
      book.available_on = JSON.parse(book.available_on || '[]');
    }
  }

  res.json({
    ticket,
    messages,
    internalNotes,
    book
  });
}

export function postMessage(req, res) {
  const { id } = req.params;
  const { content, isAiDraftUsed } = req.body;
  const user = req.user;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Message content cannot be empty' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
  }

  // Check permission
  if (user.role === 'author' && ticket.author_id !== user.author_id) {
    return res.status(403).json({ error: 'Forbidden', message: 'Cannot reply to this ticket' });
  }

  const messageId = 'MSG-' + Math.floor(10000 + Math.random() * 90000);

  db.prepare(`
    INSERT INTO ticket_messages (
      id, ticket_id, sender_id, sender_name, sender_role, content, is_ai_draft_used
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    messageId,
    id,
    user.id,
    user.name,
    user.role,
    content.trim(),
    isAiDraftUsed ? 1 : 0
  );

  // If admin responds and ticket was Open, transition to In Progress
  if (user.role === 'admin' && ticket.status === 'Open') {
    db.prepare("UPDATE tickets SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  } else {
    db.prepare("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  }

  const createdMessage = db.prepare('SELECT * FROM ticket_messages WHERE id = ?').get(messageId);
  const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

  // Broadcast real-time SSE event
  sseService.broadcast('NEW_MESSAGE', {
    ticketId: id,
    message: createdMessage,
    ticketStatus: updatedTicket.status
  });

  res.status(201).json({
    message: createdMessage,
    ticketStatus: updatedTicket.status
  });
}
