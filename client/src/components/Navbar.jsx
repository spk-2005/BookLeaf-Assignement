import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { BookLeafLogo } from './BookLeafLogo';
import { User, Shield, LogOut, ArrowRightLeft } from 'lucide-react';

export function Navbar() {
  const { user, role, logout, switchAccount, demoAccounts } = useAuth();
  const { isConnected } = useRealtime();

  return (
    <header>
      {/* Top Demo Persona Switcher Bar for Evaluators */}
      <div className="persona-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontWeight: 600, color: '#f16977' }}>Demo Evaluator Switcher:</span>
          <span style={{ color: '#cbd5e1' }}>Quick-switch between personas to test RBAC & workflows:</span>
        </div>
        <div className="persona-selector">
          <ArrowRightLeft size={14} color="#f16977" />
          <select
            className="persona-select"
            value={user?.email || ''}
            onChange={(e) => switchAccount(e.target.value)}
          >
            <optgroup label="Operations Staff">
              <option value="admin@bookleaf.com">Admin Operations Lead (Full Desk Access)</option>
            </optgroup>
            <optgroup label="Sample Authors">
              {demoAccounts
                .filter(acc => acc.role === 'author')
                .map(author => (
                  <option key={author.id} value={author.email}>
                    {author.name} ({author.book_count} books, ₹{author.total_pending_royalty} pending)
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main Brand Navbar */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.875rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Brand with Official BookLeaf Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textDecoration: 'none' }}>
            <BookLeafLogo size="sm" showTagline={false} />
          </div>

          <span style={{
            background: role === 'admin' ? '#f4f4f5' : '#fff5f6',
            color: role === 'admin' ? '#27272a' : '#f16977',
            border: `1px solid ${role === 'admin' ? '#e4e4e7' : '#fed7db'}`,
            padding: '0.25rem 0.7rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            {role === 'admin' ? <Shield size={13} /> : <User size={13} />}
            {role === 'admin' ? 'Admin Support Desk' : 'Author Portal'}
          </span>
        </div>

        {/* Real-time Status & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Live SSE Indicator */}
          <div className="live-indicator" title={isConnected ? 'Real-time updates stream active' : 'Connecting to live stream...'}>
            <span className="pulse-dot" style={{ backgroundColor: isConnected ? '#f16977' : '#f59e0b' }} />
            <span>{isConnected ? 'Real-Time Sync' : 'Reconnecting...'}</span>
          </div>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
