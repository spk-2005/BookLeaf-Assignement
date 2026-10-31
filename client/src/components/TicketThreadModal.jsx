import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../services/api';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import {
  X, Send, Sparkles, RefreshCw, UserCheck, Lock, MessageSquare,
  FileText, Paperclip, ChevronDown, Check, ShieldAlert, Bot
} from 'lucide-react';

export function TicketThreadModal({ ticketId, isOpen, onClose, onTicketUpdated }) {
  const { user, role } = useAuth();
  const { addListener } = useRealtime();

  const [ticketData, setTicketData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [book, setBook] = useState(null);

  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'notes'
  const [replyContent, setReplyContent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [customDraftPrompt, setCustomDraftPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState(false);
  const [draftUsed, setDraftUsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Load ticket details
  const loadTicket = async () => {
    try {
      const data = await api.tickets.getTicket(ticketId);
      setTicketData(data.ticket);
      setMessages(data.messages || []);
      setInternalNotes(data.internalNotes || []);
      setBook(data.book || null);
    } catch (err) {
      console.error('Failed to load ticket', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      setLoading(true);
      loadTicket();
    }
  }, [isOpen, ticketId]);

  // Real-time listener for live updates without page refresh
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    const unsubscribe = addListener((event) => {
      if (event.type === 'NEW_MESSAGE' && event.data.ticketId === ticketId) {
        setMessages(prev => {
          // Avoid duplicate messages if already present
          if (prev.some(m => m.id === event.data.message.id)) return prev;
          return [...prev, event.data.message];
        });
        setTicketData(prev => prev ? { ...prev, status: event.data.ticketStatus } : prev);
      } else if (event.type === 'INTERNAL_NOTE_ADDED' && event.data.ticketId === ticketId) {
        setInternalNotes(prev => {
          if (prev.some(n => n.id === event.data.note.id)) return prev;
          return [...prev, event.data.note];
        });
      } else if (event.type === 'TICKET_UPDATED' && event.data.ticket.id === ticketId) {
        setTicketData(event.data.ticket);
        if (onTicketUpdated) onTicketUpdated(event.data.ticket);
      }
    });

    return () => unsubscribe();
  }, [isOpen, ticketId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, internalNotes, activeTab]);

  if (!isOpen) return null;

  // Handle post public reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSending(true);
    try {
      await api.tickets.postMessage(ticketId, replyContent.trim(), draftUsed);
      setReplyContent('');
      setDraftUsed(false);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle add internal note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSending(true);
    try {
      await api.admin.addNote(ticketId, noteContent.trim());
      setNoteContent('');
    } catch (err) {
      alert(err.message || 'Failed to add internal note');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Admin Status Change
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.admin.updateTicket(ticketId, { status: newStatus });
      setTicketData(res.ticket);
      if (onTicketUpdated) onTicketUpdated(res.ticket);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Handle Admin Category Override
  const handleCategoryOverride = async (newCategory) => {
    try {
      const res = await api.admin.updateTicket(ticketId, { category: newCategory });
      setTicketData(res.ticket);
      if (onTicketUpdated) onTicketUpdated(res.ticket);
    } catch (err) {
      alert(err.message || 'Failed to override category');
    }
  };

  // Handle Admin Priority Override
  const handlePriorityOverride = async (newPriority) => {
    try {
      const res = await api.admin.updateTicket(ticketId, { priority: newPriority });
      setTicketData(res.ticket);
      if (onTicketUpdated) onTicketUpdated(res.ticket);
    } catch (err) {
      alert(err.message || 'Failed to override priority');
    }
  };

  // Handle "Assign to Me"
  const handleAssignToMe = async () => {
    try {
      const res = await api.admin.updateTicket(ticketId, {
        assignedTo: user.id,
        assignedToName: user.name
      });
      setTicketData(res.ticket);
      if (onTicketUpdated) onTicketUpdated(res.ticket);
    } catch (err) {
      alert(err.message || 'Failed to assign ticket');
    }
  };

  // Handle "Use AI Draft"
  const handleUseDraft = () => {
    if (ticketData?.ai_draft_response) {
      setReplyContent(ticketData.ai_draft_response);
      setDraftUsed(true);
      setActiveTab('messages');
    }
  };

  // Handle Regenerate AI Draft
  const handleRegenerateDraft = async () => {
    setIsRegeneratingDraft(true);
    try {
      const res = await api.admin.regenerateDraft(ticketId, customDraftPrompt.trim() || null);
      setTicketData(prev => ({ ...prev, ai_draft_response: res.draft, ai_status: res.aiStatus }));
      setCustomDraftPrompt('');
    } catch (err) {
      alert(err.message || 'Failed to regenerate AI draft');
    } finally {
      setIsRegeneratingDraft(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="card fade-in" style={{
        maxWidth: '1050px',
        width: '100%',
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Top Header Bar */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-card-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {ticketData?.id || ticketId}
              </span>
              <StatusBadge status={ticketData?.status} />
              <PriorityBadge
                priority={ticketData?.priority}
                isOverridden={ticketData?.ai_priority_override === 1}
              />
              {ticketData?.category && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: '#f1f5f9',
                  color: 'var(--text-main)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  {ticketData.category}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              {ticketData?.subject || 'Loading...'}
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Author: <strong>{ticketData?.author_name}</strong> ({ticketData?.author_email}) • Book: <strong>{ticketData?.book_title}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.5rem'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content Body: Split Pane for Admin, Single Pane for Author */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Main Conversation Thread Column */}
          <div style={{
            flex: role === 'admin' ? 7 : 12,
            display: 'flex',
            flexDirection: 'column',
            borderRight: role === 'admin' ? '1px solid var(--border-light)' : 'none',
            height: '100%'
          }}>
            {/* Tabs for Admin (Author Chat vs Internal Notes) */}
            {role === 'admin' && (
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-light)',
                background: '#ffffff'
              }}>
                <button
                  onClick={() => setActiveTab('messages')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderBottom: activeTab === 'messages' ? '2px solid var(--color-accent)' : 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: activeTab === 'messages' ? 'var(--color-accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Author Conversation ({messages.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderBottom: activeTab === 'notes' ? '2px solid #d97706' : 'none',
                    background: activeTab === 'notes' ? '#fffbeb' : 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: activeTab === 'notes' ? '#b45309' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Lock size={16} />
                  <span>Internal Ops Notes ({internalNotes.length})</span>
                </button>
              </div>
            )}

            {/* Conversation Messages Scroll Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: activeTab === 'notes' ? '#fffdf7' : '#f8fafc'
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading conversation history...
                </div>
              ) : activeTab === 'messages' ? (
                messages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        backgroundColor: isAdmin ? '#ffffff' : '#ffffff',
                        border: isAdmin ? '1px solid #bfdbfe' : '1px solid var(--border-light)',
                        borderLeft: isAdmin ? '4px solid #3b82f6' : '4px solid var(--color-brand)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.4rem',
                        fontSize: '0.785rem'
                      }}>
                        <strong style={{ color: isAdmin ? '#1d4ed8' : 'var(--color-brand-dark)' }}>
                          {msg.sender_name} {isAdmin ? '(BookLeaf Support)' : '(Author)'}
                        </strong>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                          {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-line', color: 'var(--text-main)' }}>
                        {msg.content}
                      </div>

                      {msg.is_ai_draft_used === 1 && (
                        <div style={{
                          marginTop: '0.5rem',
                          fontSize: '0.7rem',
                          color: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Sparkles size={11} />
                          <span>Generated with BookLeaf AI Assistant</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Internal Notes Tab */
                internalNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#b45309', fontSize: '0.875rem' }}>
                    No internal notes yet. Internal notes are strictly visible to ops team staff only.
                  </div>
                ) : (
                  internalNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.875rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.75rem', color: '#92400e' }}>
                        <strong>{note.admin_name} (Ops Note)</strong>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ color: '#78350f', whiteSpace: 'pre-line' }}>{note.note}</div>
                    </div>
                  ))
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply or Note Input Bar */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', background: '#ffffff' }}>
              {activeTab === 'messages' ? (
                <form onSubmit={handleSendReply}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <textarea
                      className="form-textarea"
                      placeholder={role === 'admin' ? "Write a response to author or edit AI draft above..." : "Type your reply to BookLeaf support team..."}
                      rows={3}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      disabled={isSending}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {role === 'admin' && draftUsed && (
                        <span style={{ color: 'var(--color-brand)', fontWeight: 600 }}>✓ AI Draft Loaded into Editor</span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSending || !replyContent.trim()}
                    >
                      <Send size={15} />
                      <span>{role === 'admin' ? 'Send Response to Author' : 'Post Reply'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddNote}>
                  <textarea
                    className="form-textarea"
                    placeholder="Add confidential internal note (e.g. ERP batch #, distributor callback date)..."
                    rows={2}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    disabled={isSending}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn btn-dark btn-sm"
                      disabled={isSending || !noteContent.trim()}
                    >
                      <Lock size={13} />
                      <span>Add Confidential Note</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Admin Workbench (AI Classification, Draft, Overrides) */}
          {role === 'admin' && (
            <div style={{
              flex: 5,
              background: '#ffffff',
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              {/* Ticket Controls & Overrides */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
                  Ticket Resolution Controls
                </h4>

                {/* Status selector */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Status Workflow:
                  </label>
                  <select
                    className="form-select"
                    value={ticketData?.status || 'Open'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Category Override */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Category (AI-Classified):
                    </label>
                    {ticketData?.ai_classification_override === 1 && (
                      <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 700 }}>Overridden</span>
                    )}
                  </div>
                  <select
                    className="form-select"
                    value={ticketData?.category || 'General Inquiry'}
                    onChange={(e) => handleCategoryOverride(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '0.4rem 0.6rem', marginTop: '0.2rem' }}
                  >
                    <option value="Royalty & Payments">Royalty & Payments</option>
                    <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
                    <option value="Printing & Quality">Printing & Quality</option>
                    <option value="Distribution & Availability">Distribution & Availability</option>
                    <option value="Book Status & Production Updates">Book Status & Production Updates</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                {/* Priority Override */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Priority Score (AI-Assigned):
                    </label>
                    {ticketData?.ai_priority_override === 1 && (
                      <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 700 }}>Overridden</span>
                    )}
                  </div>
                  <select
                    className="form-select"
                    value={ticketData?.priority || 'Medium'}
                    onChange={(e) => handlePriorityOverride(e.target.value)}
                    style={{ fontSize: '0.8125rem', padding: '0.4rem 0.6rem', marginTop: '0.2rem' }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  {ticketData?.priority_reason && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      Reason: {ticketData.priority_reason}
                    </div>
                  )}
                </div>

                {/* Assignee */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Assignee:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {ticketData?.assigned_to_name || 'Unassigned'}
                    </span>
                    {ticketData?.assigned_to !== user.id && (
                      <button
                        onClick={handleAssignToMe}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <UserCheck size={12} />
                        <span>Assign to Me</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI-Drafted Response Box */}
              <div style={{
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b21a8', fontWeight: 700, fontSize: '0.875rem' }}>
                    <Bot size={18} />
                    <span>AI-Drafted Response</span>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    background: ticketData?.ai_status === 'fallback' ? '#ffedd5' : '#ede9fe',
                    color: ticketData?.ai_status === 'fallback' ? '#9a3412' : '#581c87',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {ticketData?.ai_status === 'fallback' ? 'Policy Engine Fallback' : 'LLM Generated'}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.8125rem',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  border: '1px solid #ddd6fe',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  whiteSpace: 'pre-line',
                  color: 'var(--text-main)',
                  lineHeight: 1.45
                }}>
                  {ticketData?.ai_draft_response || 'No AI draft available.'}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleUseDraft}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, backgroundColor: '#7c3aed', borderColor: '#6d28d9' }}
                  >
                    <Check size={14} />
                    <span>Use & Edit Draft</span>
                  </button>
                </div>

                {/* Regenerate AI draft with custom prompt */}
                <div style={{ borderTop: '1px dashed #d8b4fe', paddingTop: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Optional guidance (e.g. 'mention payment is cleared on Friday')..."
                    value={customDraftPrompt}
                    onChange={(e) => setCustomDraftPrompt(e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', marginBottom: '0.5rem' }}
                    disabled={isRegeneratingDraft}
                  />
                  <button
                    onClick={handleRegenerateDraft}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}
                    disabled={isRegeneratingDraft}
                  >
                    <RefreshCw size={12} className={isRegeneratingDraft ? 'pulse-dot' : ''} />
                    <span>{isRegeneratingDraft ? 'Regenerating...' : 'Regenerate Draft with AI'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
