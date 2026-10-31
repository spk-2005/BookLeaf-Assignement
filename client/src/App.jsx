import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { AuthorDashboard } from './pages/AuthorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { BookOpen } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-page)',
        gap: '1rem'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: '#f16977',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
          Initializing BookLeaf Portal...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <RealtimeProvider>
      <div className="app-container">
        <Navbar />
        {role === 'admin' ? <AdminDashboard /> : <AuthorDashboard />}
      </div>
    </RealtimeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
