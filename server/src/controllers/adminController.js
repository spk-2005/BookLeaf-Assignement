import { db } from '../db/database.js';
import { generateDraftResponse } from '../services/aiService.js';
import { sseService } from '../services/sseService.js';

export function getAdminTickets(req, res) {
  const { status, category, priority, search, sortBy = 'urgency' } = req.query;

  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];

  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (priority && priority !== 'All') {
    query += ' AND priority = ?';
    params.push(priority);
  }

  if (search && search.trim()) {
    query += ' AND (subject LIKE ? OR description LIKE ? OR author_name LIKE ? OR id LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  // Sorting
  if (sortBy === 'urgency') {
    // Critical & High first, unresolved first, then oldest created
    query += ` ORDER BY 
      CASE WHEN status IN ('Open', 'In Progress') THEN 0 ELSE 1 END ASC,
      CASE priority 
        WHEN 'Critical' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        WHEN 'Low' THEN 4 
        ELSE 5 
      END ASC,
      created_at ASC`;
  } else if (sortBy === 'oldest') {
    query += ' ORDER BY created_at ASC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const tickets = db.prepare(query).all(...params);

  // Queue metrics
  const metrics = db.prepare(`
    SELECT
      COUNT(id) as total_tickets,
      SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
      SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count,
      SUM(CASE WHEN priority = 'Critical' AND status != 'Closed' THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN assigned_to IS NULL AND status IN ('Open', 'In Progress') THEN 1 ELSE 0 END) as unassigned_count
    FROM tickets
  `).get();

  res.json({
    tickets,
    metrics
  });
}

export function updateTicket(req, res) {
  const { id } = req.params;
  const { status, category, priority, assignedTo, assignedToName } = req.body;
  const admin = req.user;

  const current = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!current) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
  }

  let isCategoryOverridden = current.ai_classification_override;
  let isPriorityOverridden = current.ai_priority_override;

  if (category && category !== current.category) {
    isCategoryOverridden = 1;
  }

  if (priority && priority !== current.priority) {
    isPriorityOverridden = 1;
  }

  db.prepare(`
    UPDATE tickets 
    SET 
      status = COALESCE(?, status),
      category = COALESCE(?, category),
      priority = COALESCE(?, priority),
      assigned_to = COALESCE(?, assigned_to),
      assigned_to_name = COALESCE(?, assigned_to_name),
      ai_classification_override = ?,
      ai_priority_override = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status || null,
    category || null,
    priority || null,
    assignedTo !== undefined ? assignedTo : null,
    assignedToName !== undefined ? assignedToName : null,
    isCategoryOverridden,
    isPriorityOverridden,
    id
  );

  const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

  // Broadcast real-time update
  sseService.broadcast('TICKET_UPDATED', { ticket: updatedTicket });

  res.json({
    ticket: updatedTicket,
    message: 'Ticket updated successfully'
  });
}

export function addInternalNote(req, res) {
  const { id } = req.params;
  const { note } = req.body;
  const admin = req.user;

  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Note text cannot be empty' });
  }

  const noteId = 'NOTE-' + Math.floor(10000 + Math.random() * 90000);

  db.prepare(`
    INSERT INTO ticket_internal_notes (id, ticket_id, admin_id, admin_name, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(noteId, id, admin.id, admin.name, note.trim());

  const createdNote = db.prepare('SELECT * FROM ticket_internal_notes WHERE id = ?').get(noteId);

  sseService.broadcast('INTERNAL_NOTE_ADDED', { ticketId: id, note: createdNote });

  res.status(201).json({ note: createdNote });
}

export async function regenerateAiDraft(req, res) {
  const { id } = req.params;
  const { customPrompt } = req.body;

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket does not exist' });
  }

  let book = null;
  if (ticket.book_id) {
    book = db.prepare('SELECT * FROM books WHERE id = ?').get(ticket.book_id);
  }

  const result = await generateDraftResponse({
    authorName: ticket.author_name,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    book,
    adminCustomPrompt: customPrompt
  });

  // Update draft in database
  db.prepare('UPDATE tickets SET ai_draft_response = ?, ai_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(result.draft, result.aiStatus, id);

  res.json({
    draft: result.draft,
    aiStatus: result.aiStatus
  });
}
