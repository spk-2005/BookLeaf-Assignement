import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Paperclip, Send, AlertCircle, FileText, Sparkles } from 'lucide-react';

export function TicketSubmitModal({ books = [], isOpen, onClose, onTicketCreated }) {
  const [bookId, setBookId] = useState('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please provide a subject line');
      return;
    }
    if (!description.trim()) {
      setError('Please provide detailed information about your inquiry');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.tickets.createTicket({
        bookId: bookId === 'general' ? null : bookId,
        subject: subject.trim(),
        description: description.trim(),
        attachmentName: attachment
      });

      onTicketCreated(res.ticket);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="card fade-in" style={{
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#ffffff',
        padding: '2rem',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--color-primary)' }}>Submit a Support Query</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Our operations team assisted by BookLeaf AI will review and respond promptly.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Book Dropdown */}
          <div className="form-group">
            <label className="form-label">Related Book / Scope</label>
            <select
              className="form-select"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
            >
              <option value="general">General / Account Level Inquiry</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.status})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Inquiring about Q3 royalty statement or ISBN on Amazon"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea
              className="form-textarea"
              placeholder="Please describe your question or issue in detail. If reporting print defect or payment query, please mention relevant dates or quantities..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Optional File Attachment UI */}
          <div className="form-group">
            <label className="form-label">File Attachment (Optional)</label>
            <div style={{
              border: '2px dashed var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card-subtle)',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <input
                type="file"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                <Paperclip size={20} />
                <span style={{ fontSize: '0.8125rem' }}>
                  {attachment ? (
                    <strong style={{ color: 'var(--color-accent)' }}>Attached: {attachment}</strong>
                  ) : (
                    'Click to attach photo of defective copy, royalty statement, or screenshot'
                  )}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Supports JPG, PNG, PDF up to 10MB</span>
              </div>
            </div>
          </div>

          {/* AI Notice Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-accent-light)',
            border: '1px solid var(--color-accent-border)',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.785rem',
            color: '#065f46'
          }}>
            <Sparkles size={16} />
            <span>
              BookLeaf's AI will automatically categorize and route your inquiry to the right operations desk for rapid resolution.
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Processing with AI...</>
              ) : (
                <>
                  <Send size={15} />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
