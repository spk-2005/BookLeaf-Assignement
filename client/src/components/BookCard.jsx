import React from 'react';
import { Book, CheckCircle, Clock, ShoppingCart, DollarSign, Tag, Layers } from 'lucide-react';

export function BookCard({ book }) {
  const isLive = book.status === 'Published & Live';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      {/* Header: Title, ISBN, Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>
            {book.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span><strong>ISBN:</strong> {book.isbn || 'Pending Assignment'}</span>
            <span>•</span>
            <span><strong>Genre:</strong> {book.genre}</span>
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.25rem 0.65rem',
          borderRadius: '999px',
          backgroundColor: isLive ? '#ecfdf5' : '#eff6ff',
          color: isLive ? '#059669' : '#2563eb',
          border: `1px solid ${isLive ? '#a7f3d0' : '#bfdbfe'}`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          whiteSpace: 'nowrap'
        }}>
          {isLive ? <CheckCircle size={12} /> : <Clock size={12} />}
          {book.status}
        </span>
      </div>

      {/* Financials & Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        background: 'var(--bg-card-subtle)',
        padding: '0.875rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            MRP / Royalty Per Copy
          </div>
          <div style={{ fontSize: '0.925rem', fontWeight: 700, marginTop: '0.15rem' }}>
            {book.mrp ? `₹${book.mrp}` : '—'} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({book.author_royalty_per_copy ? `₹${book.author_royalty_per_copy}/copy` : 'N/A'})</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Copies Sold
          </div>
          <div style={{ fontSize: '0.925rem', fontWeight: 700, marginTop: '0.15rem', color: 'var(--color-primary)' }}>
            {book.total_copies_sold ? book.total_copies_sold.toLocaleString('en-IN') : 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Royalty Earned
          </div>
          <div style={{ fontSize: '0.925rem', fontWeight: 700, marginTop: '0.15rem', color: '#059669' }}>
            ₹{book.total_royalty_earned ? book.total_royalty_earned.toLocaleString('en-IN') : 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Royalty Paid
          </div>
          <div style={{ fontSize: '0.925rem', fontWeight: 700, marginTop: '0.15rem', color: 'var(--color-primary)' }}>
            ₹{book.royalty_paid ? book.royalty_paid.toLocaleString('en-IN') : 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Royalty Pending
          </div>
          <div style={{
            fontSize: '0.925rem',
            fontWeight: 800,
            marginTop: '0.15rem',
            color: book.royalty_pending > 0 ? '#ea580c' : '#64748b'
          }}>
            ₹{book.royalty_pending ? book.royalty_pending.toLocaleString('en-IN') : 0}
          </div>
        </div>
      </div>

      {/* Distribution & Production Details Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.785rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <ShoppingCart size={13} />
          <span>Available on:</span>
          {book.available_on && book.available_on.length > 0 ? (
            book.available_on.map((channel, idx) => (
              <span key={idx} style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                color: 'var(--text-main)'
              }}>
                {channel}
              </span>
            ))
          ) : (
            <span style={{ fontStyle: 'italic' }}>Pending distribution listing</span>
          )}
        </div>

        {book.last_royalty_payout_date && (
          <div>
            <span>Last Payout: <strong>{book.last_royalty_payout_date}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
