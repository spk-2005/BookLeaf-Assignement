import { db } from '../db/database.js';

export function getAuthorBooks(req, res) {
  const authorId = req.user.author_id;

  const books = db.prepare(`
    SELECT * FROM books WHERE author_id = ? ORDER BY publication_date DESC, title ASC
  `).all(authorId);

  // Parse JSON fields
  const formattedBooks = books.map(book => ({
    ...book,
    available_on: JSON.parse(book.available_on || '[]')
  }));

  res.json({ books: formattedBooks });
}

export function getAuthorDashboard(req, res) {
  const authorId = req.user.author_id;

  const stats = db.prepare(`
    SELECT 
      COUNT(id) as total_books,
      COALESCE(SUM(total_copies_sold), 0) as total_copies_sold,
      COALESCE(SUM(total_royalty_earned), 0) as total_royalty_earned,
      COALESCE(SUM(royalty_paid), 0) as total_royalty_paid,
      COALESCE(SUM(royalty_pending), 0) as total_royalty_pending
    FROM books
    WHERE author_id = ?
  `).get(authorId);

  const ticketStats = db.prepare(`
    SELECT 
      COUNT(id) as total_tickets,
      SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_tickets,
      SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
      SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets
    FROM tickets
    WHERE author_id = ?
  `).get(authorId);

  res.json({
    author: req.user,
    financials: stats,
    ticketStats: ticketStats
  });
}
