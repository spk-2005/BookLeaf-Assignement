import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsConnected(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const eventSource = new EventSource(`${apiBase}/api/realtime/stream?token=${encodeURIComponent(token)}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        setLastEvent(payload);

        // Notify all registered listeners
        for (const listener of listenersRef.current) {
          listener(payload);
        }
      } catch (err) {
        console.error('Error parsing SSE event', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // EventSource will automatically attempt reconnection
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [token, isAuthenticated]);

  const addListener = (callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  };

  const value = {
    isConnected,
    lastEvent,
    addListener
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
