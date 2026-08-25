'use client';

import React, { useState } from 'react';
import { ShieldCheck, Search, Plus, Download, Moon, Sun, Lock, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
  onExportCsv: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  urgencyThreshold: number;
  onUrgencyThresholdChange: (days: number) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onExportCsv,
  onLogout,
  onRefresh,
  isRefreshing,
  urgencyThreshold,
  onUrgencyThresholdChange,
  theme,
  onToggleTheme
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <div className="app-container" style={{ padding: '0.75rem 2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap'
        }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px var(--brand-glow)'
            }}>
              <ShieldCheck size={22} strokeWidth={2.4} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                ClientGuard <span style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.875rem' }}>CRM</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto • Home • Commercial Policies</p>
            </div>
          </div>

          {/* Persistent Search Bar */}
          <div style={{
            flex: '1 1 360px',
            maxWidth: '520px',
            position: 'relative'
          }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search by client name, vehicle plate #, property address, business..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-strong)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="btn btn-primary"
              title="Add New Insurance Client"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Add Client</span>
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              className="btn btn-secondary"
              title="Export all client and policy records to CSV"
            >
              <Download size={16} />
              <span className="hide-on-mobile">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="btn btn-secondary btn-icon"
              title="Refresh Client Data"
              disabled={isRefreshing}
            >
              <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>

            {/* Threshold Settings Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="btn btn-secondary btn-icon"
                title="Urgency Settings"
              >
                <SlidersHorizontal size={16} />
              </button>

              {showSettings && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-dropdown)',
                  padding: '1rem',
                  width: '240px',
                  zIndex: 200,
                  animation: 'fadeIn 0.15s ease'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                    Urgency Flagging Window
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Flag renewals as "Due Soon" if within:
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[15, 30, 45, 60].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          onUrgencyThresholdChange(days);
                          setShowSettings(false);
                        }}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: urgencyThreshold === days ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          background: urgencyThreshold === days ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                          color: urgencyThreshold === days ? '#ffffff' : 'var(--text-primary)'
                        }}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="btn btn-secondary btn-icon"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Lock / Sign Out */}
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-ghost btn-icon"
              title="Lock CRM / Logout"
            >
              <Lock size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
