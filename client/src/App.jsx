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
        backgroundColor: '#f8fafc',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid #e2e8f0',
          borderTopColor: '#059669',
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
