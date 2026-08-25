'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {}
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              border: `1px solid ${
                toast.type === 'success' ? 'var(--status-active-border)' :
                toast.type === 'error' ? 'var(--status-expired-border)' : 'var(--border-subtle)'
              }`,
              boxShadow: 'var(--shadow-lg)',
              animation: 'scaleUp 0.15s ease-out',
              maxWidth: '400px',
              fontSize: '0.875rem'
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--status-active-dot)', flexShrink: 0 }} />}
            {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--status-expired-dot)', flexShrink: 0 }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />}
            <span style={{ flex: 1, fontWeight: 500 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.125rem',
                display: 'flex'
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
