import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Shield, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export function LoginPage() {
  const { login, switchAccount, demoAccounts } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail) => {
    setError('');
    setIsLoading(true);
    try {
      await switchAccount(targetEmail);
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
      padding: '1.5rem'
    }}>
      <div className="card fade-in" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2.5rem',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #059669 0%, #0f172a 100%)',
            color: '#ffffff',
            padding: '0.85rem',
            borderRadius: '12px',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}>
            <BookOpen size={30} />
          </div>
          <h1 style={{ fontSize: '1.65rem', color: 'var(--color-primary)' }}>
            BookLeaf Publishing
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Author Support & Communication Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. priya.sharma@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="author123 or admin123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Note: Pre-seeded accounts use default password 'author123' / 'admin123'
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Evaluation Logins */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
            <Sparkles size={16} color="#059669" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              1-Click Evaluation Sign In
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@bookleaf.com')}
              className="btn btn-dark btn-sm"
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem' }}
            >
              <Shield size={15} color="#a78bfa" />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Operations Lead (Admin Desk)</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Full queue, overrides, AI draft workbench</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('priya.sharma@email.com')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem' }}
            >
              <User size={15} color="#059669" />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Priya Sharma (Author)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2 titles • ₹3,570 pending royalty</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sneha.kulkarni@email.com')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem' }}
            >
              <User size={15} color="#2563eb" />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Sneha Kulkarni (Author)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 titles (including 'Midnight in Mysore' in Production)</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
