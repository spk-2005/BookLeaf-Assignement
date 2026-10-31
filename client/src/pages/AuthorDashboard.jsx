import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../services/api';
import { BookCard } from '../components/BookCard';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { TicketSubmitModal } from '../components/TicketSubmitModal';
import { TicketThreadModal } from '../components/TicketThreadModal';
import {
  BookOpen, PlusCircle, MessageSquare, DollarSign,
  TrendingUp, Award, Layers, AlertCircle, RefreshCw
} from 'lucide-react';

export function AuthorDashboard() {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [books, setBooks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'tickets'

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [booksRes, dashRes, ticketsRes] = await Promise.all([
        api.author.getBooks(),
        api.author.getDashboard(),
        api.tickets.getMyTickets()
      ]);

      setBooks(booksRes.books || []);
      setFinancials(dashRes.financials || null);
      setTickets(ticketsRes.tickets || []);
    } catch (err) {
      console.error('Failed to load author dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Real-time listener for live updates (no page refresh)
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (event.type === 'NEW_TICKET' && event.data.ticket.author_id === user.author_id) {
        setTickets(prev => [event.data.ticket, ...prev.filter(t => t.id !== event.data.ticket.id)]);
      } else if (event.type === 'TICKET_UPDATED' && event.data.ticket.author_id === user.author_id) {
        setTickets(prev => prev.map(t => t.id === event.data.ticket.id ? event.data.ticket : t));
      } else if (event.type === 'NEW_MESSAGE') {
        // Refresh ticket list or increment message count
        setTickets(prev => prev.map(t => {
          if (t.id === event.data.ticketId) {
            return { ...t, status: event.data.ticketStatus, message_count: (t.message_count || 1) + 1 };
          }
          return t;
        }));
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleTicketCreated = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
    setActiveTab('tickets');
    setSelectedTicketId(newTicket.id);
  };

  return (
    <div className="main-content fade-in">
      {/* Welcome Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        borderLeft: '4px solid var(--color-brand)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-brand)' }} />
            BookLeaf Author Portal
          </span>
          <h1 style={{ fontSize: '1.65rem', color: 'var(--color-primary)', marginTop: '0.25rem', fontWeight: 600 }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            City: {user?.city} • Author ID: <strong>{user?.author_id}</strong>
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
        >
          <PlusCircle size={18} />
          <span>Submit a Support Query</span>
        </button>
      </div>

      {/* Financial Overview Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Total Titles</span>
            <BookOpen size={18} color="var(--color-brand)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--color-primary)' }}>
            {financials?.total_books || books.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Published & in production</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Total Copies Sold</span>
            <TrendingUp size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--color-primary)' }}>
            {financials?.total_copies_sold ? financials.total_copies_sold.toLocaleString('en-IN') : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across Amazon, Flipkart & Store</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Total Royalty Earned</span>
            <Award size={18} color="var(--color-brand)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--color-brand)' }}>
            ₹{financials?.total_royalty_earned ? financials.total_royalty_earned.toLocaleString('en-IN') : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>80% author net profit share</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Royalty Paid</span>
            <DollarSign size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--color-primary)' }}>
            ₹{financials?.total_royalty_paid ? financials.total_royalty_paid.toLocaleString('en-IN') : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct bank payouts</div>
        </div>

        <div className="card" style={{
          borderLeft: (financials?.total_royalty_pending || 0) > 0 ? '4px solid #ea580c' : '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Royalty Pending</span>
            <AlertCircle size={18} color={(financials?.total_royalty_pending || 0) > 0 ? '#ea580c' : '#64748b'} />
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginTop: '0.4rem',
            color: (financials?.total_royalty_pending || 0) > 0 ? '#ea580c' : 'var(--text-muted)'
          }}>
            ₹{financials?.total_royalty_pending ? financials.total_royalty_pending.toLocaleString('en-IN') : 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {(financials?.total_royalty_pending || 0) >= 1000
              ? 'Eligible for next quarterly cycle (≥ ₹1,000)'
              : 'Rolls over until ₹1,000 threshold reached'}
          </div>
        </div>
      </div>

      {/* Tabs: My Books vs My Tickets */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--border-light)',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <button
          onClick={() => setActiveTab('books')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'books' ? '3px solid var(--color-accent)' : '3px solid transparent',
            color: activeTab === 'books' ? 'var(--color-accent)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <BookOpen size={18} />
          <span>My Books ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'tickets' ? '3px solid var(--color-accent)' : '3px solid transparent',
            color: activeTab === 'tickets' ? 'var(--color-accent)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <MessageSquare size={18} />
          <span>My Support Queries ({tickets.length})</span>
        </button>
      </div>

      {/* Tab 1: My Books */}
      {activeTab === 'books' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading published titles...
            </div>
          ) : books.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <BookOpen size={40} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
              <h3>No Books Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                You do not have any published or active titles under this account yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.25rem' }}>
              {books.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Support Ticket History</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Live updates enabled: responses from the BookLeaf team appear automatically without refreshing.
              </p>
            </div>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <PlusCircle size={15} />
              <span>Raise New Ticket</span>
            </button>
          </div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <MessageSquare size={40} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
              <h4>No Support Tickets Yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Need help with royalties, printing quality, or catalog distribution? Raise a query below.
              </p>
              <button onClick={() => setIsSubmitModalOpen(true)} className="btn btn-primary">
                Submit Your First Query
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.875rem 1.25rem' }}>Ticket ID</th>
                    <th style={{ padding: '0.875rem 1.25rem' }}>Subject & Book</th>
                    <th style={{ padding: '0.875rem 1.25rem' }}>Category</th>
                    <th style={{ padding: '0.875rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.875rem 1.25rem' }}>Last Activity</th>
                    <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onClick={() => setSelectedTicketId(t.id)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {t.id}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                          {t.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Book: <strong>{t.book_title}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          background: '#f1f5f9',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <StatusBadge status={t.status} />
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicketId(t.id);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          View Thread
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ticket Submission Modal */}
      <TicketSubmitModal
        books={books}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      {/* Ticket Details & Real-Time Thread Modal */}
      {selectedTicketId && (
        <TicketThreadModal
          ticketId={selectedTicketId}
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={(updated) => {
            setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
          }}
        />
      )}
    </div>
  );
}
