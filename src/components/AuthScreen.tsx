'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async (credentialToSubmit: string) => {
    if (!credentialToSubmit.trim()) {
      setError('Please enter your owner PIN or password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialToSubmit.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Invalid PIN or password');
      }
    } catch (err) {
      setError('Network error while verifying login.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(pin);
  };

  const handlePinKey = (digit: string) => {
    if (pin.length < 12) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(37, 99, 235, 0.15), var(--bg-app) 70%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        padding: '2.25rem 2rem',
        textAlign: 'center',
        animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Shield Logo */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--brand-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 8px 24px var(--brand-glow)',
          margin: '0 auto 1.25rem'
        }}>
          <ShieldCheck size={32} strokeWidth={2.5} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          ClientGuard CRM
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          Enter your owner PIN or master password to access client policies
        </p>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
            <KeyRound size={18} style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />

            <input
              type={showPin ? 'text' : 'password'}
              placeholder="Enter PIN (e.g. 1234)"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 2.75rem 0.75rem 2.6rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: error ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                fontSize: '1.125rem',
                textAlign: 'center',
                letterSpacing: showPin ? '0.1em' : '0.3em',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none'
              }}
            />

            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.25rem',
                display: 'flex'
              }}
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div style={{
              fontSize: '0.8125rem',
              color: '#ef4444',
              marginBottom: '1rem',
              padding: '0.4rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
          >
            {loading ? 'Unlocking...' : 'Unlock CRM'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick Numeric Keypad for fast PIN entry */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
            <button
              key={btn}
              type="button"
              onClick={() => {
                if (btn === 'C') {
                  setPin('');
                  setError('');
                } else if (btn === '⌫') {
                  handleBackspace();
                } else {
                  handlePinKey(btn);
                }
              }}
              style={{
                padding: '0.625rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)'
              }}
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Demo Hint */}
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface-subtle)',
          padding: '0.6rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <span>Default Passcode: <strong style={{ color: 'var(--text-primary)' }}>1234</strong> or <strong style={{ color: 'var(--text-primary)' }}>admin123</strong></span>
        </div>
      </div>
    </div>
  );
}
