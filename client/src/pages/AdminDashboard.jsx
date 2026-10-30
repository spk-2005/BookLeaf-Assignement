import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { TicketThreadModal } from '../components/TicketThreadModal';
import {
  Inbox, AlertCircle, Clock, CheckCircle2, UserCheck,
  Search, Filter, Sparkles, RefreshCw, ChevronRight, AlertTriangle
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('urgency');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getTickets({
        search,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        sortBy
      });

      setTickets(res.tickets || []);
      setMetrics(res.metrics || null);
    } catch (err) {
      console.error('Failed to load admin queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadQueue();
  };

  // Real-time listener for incoming tickets or updates
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (event.type === 'NEW_TICKET') {
        setTickets(prev => [event.data.ticket, ...prev]);
        setMetrics(m => m ? { ...m, total_tickets: (m.total_tickets || 0) + 1, open_count: (m.open_count || 0) + 1 } : m);
      } else if (event.type === 'TICKET_UPDATED') {
        setTickets(prev => prev.map(t => t.id === event.data.ticket.id ? event.data.ticket : t));
      } else if (event.type === 'NEW_MESSAGE') {
        setTickets(prev => prev.map(t => {
          if (t.id === event.data.ticketId) {
            return { ...t, status: event.data.ticketStatus };
          }
          return t;
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-content fade-in">
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-primary)' }}>
            Operations Support Desk
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            BookLeaf publishing operations queue with AI auto-classification and context-aware resolution.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Total Incoming</span>
            <Inbox size={16} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.3rem' }}>
            {metrics?.total_tickets || tickets.length}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Open Unresolved</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.3rem', color: '#1d4ed8' }}>
            {metrics?.open_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Critical SLA</span>
            <AlertTriangle size={16} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.3rem', color: '#b91c1c' }}>
            {metrics?.critical_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>In Progress</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.3rem', color: '#6d28d9' }}>
            {metrics?.in_progress_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Unassigned</span>
            <UserCheck size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.3rem', color: '#b45309' }}>
            {metrics?.unassigned_count || 0}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search author, book, subject, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
            />
          </form>

          {/* Status Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
            >
              <option value="All">All Categories</option>
              <option value="Royalty & Payments">Royalty & Payments</option>
              <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
              <option value="Printing & Quality">Printing & Quality</option>
              <option value="Distribution & Availability">Distribution</option>
              <option value="Book Status & Production Updates">Production Updates</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', fontWeight: 600 }}
            >
              <option value="urgency">⚡ Sort: Urgency (SLA)</option>
              <option value="newest">🕒 Sort: Newest First</option>
              <option value="oldest">⏳ Sort: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Queue Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            Loading ticket queue...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem' }}>
            <Inbox size={40} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
            <h3>No tickets match the selected criteria</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Try adjusting your filter options above.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Ticket</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Author</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Subject & Related Title</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Priority</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Assignee</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => {
                  const isCritical = t.priority === 'Critical' && t.status !== 'Closed';
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        backgroundColor: isCritical ? '#fffbfa' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCritical ? '#fffbfa' : 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{t.id}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.author_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.author_email}</div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', maxWidth: '320px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.book_title || 'General Account'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{
                            background: '#f1f5f9',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {t.category}
                          </span>
                          {t.ai_classification_override === 1 && (
                            <span style={{ fontSize: '0.65rem', color: '#ea580c', fontWeight: 700 }} title="Manually overridden by admin">
                              *
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <PriorityBadge priority={t.priority} isOverridden={t.ai_priority_override === 1} />
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <StatusBadge status={t.status} />
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: t.assigned_to ? 'var(--text-main)' : '#ea580c' }}>
                        {t.assigned_to_name || 'Unassigned'}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicketId(t.id);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.75rem' }}
                        >
                          <span>Open</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Workbench Modal */}
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
