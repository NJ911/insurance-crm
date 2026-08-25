'use client';

import React from 'react';
import { Users, Clock, AlertTriangle, Shield, Car, Home, Building2 } from 'lucide-react';
import { DashboardStats, ClientFilterOptions, PolicyType } from '@/lib/types';

interface StatCardsProps {
  stats: DashboardStats;
  currentFilter: ClientFilterOptions['status'];
  onSelectFilter: (status: ClientFilterOptions['status']) => void;
  selectedPolicyType: 'all' | PolicyType;
  onSelectPolicyType: (type: 'all' | PolicyType) => void;
  urgencyThreshold: number;
}

export function StatCards({
  stats,
  currentFilter,
  onSelectFilter,
  selectedPolicyType,
  onSelectPolicyType,
  urgencyThreshold
}: StatCardsProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1rem',
      marginBottom: '1.25rem'
    }}>
      {/* 1. Due Soon Card */}
      <div
        onClick={() => {
          onSelectFilter('due_soon');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.125rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: currentFilter === 'due_soon'
            ? '2px solid var(--status-due-text)'
            : '1px solid var(--status-due-border)',
          boxShadow: currentFilter === 'due_soon' ? 'var(--shadow-md)' : 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
            Renewals Due Soon (≤{urgencyThreshold}d)
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--status-due-text)', marginBottom: '0.25rem' }}>
            {stats.dueSoonCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Requires renewal outreach
          </div>
        </div>

        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--status-due-bg)',
          color: 'var(--status-due-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Clock size={22} strokeWidth={2.2} />
        </div>
      </div>

      {/* 2. Expired Card */}
      <div
        onClick={() => {
          onSelectFilter('expired');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.125rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: currentFilter === 'expired'
            ? '2px solid var(--status-expired-text)'
            : '1px solid var(--status-expired-border)',
          boxShadow: currentFilter === 'expired' ? 'var(--shadow-md)' : 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
            Expired Policies
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--status-expired-text)', marginBottom: '0.25rem' }}>
            {stats.expiredCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Lapsed or overdue term
          </div>
        </div>

        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--status-expired-bg)',
          color: 'var(--status-expired-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={22} strokeWidth={2.2} />
        </div>
      </div>

      {/* 3. Products Quick Filter Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Filter by Insurance Product
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
            {stats.totalPolicies} Total Policies
          </span>
        </div>

        {/* 3 Direct Clickable Product Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => onSelectPolicyType(selectedPolicyType === 'auto' ? 'all' : 'auto')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.35rem',
              borderRadius: 'var(--radius-md)',
              border: selectedPolicyType === 'auto' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
              background: selectedPolicyType === 'auto' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface-subtle)',
              color: selectedPolicyType === 'auto' ? '#2563eb' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Car size={13} style={{ color: '#3b82f6' }} />
            <span>Auto ({stats.autoPoliciesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPolicyType(selectedPolicyType === 'home' ? 'all' : 'home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.35rem',
              borderRadius: 'var(--radius-md)',
              border: selectedPolicyType === 'home' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
              background: selectedPolicyType === 'home' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-subtle)',
              color: selectedPolicyType === 'home' ? '#059669' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Home size={13} style={{ color: '#10b981' }} />
            <span>Home ({stats.homePoliciesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPolicyType(selectedPolicyType === 'commercial' ? 'all' : 'commercial')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.35rem',
              borderRadius: 'var(--radius-md)',
              border: selectedPolicyType === 'commercial' ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
              background: selectedPolicyType === 'commercial' ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-surface-subtle)',
              color: selectedPolicyType === 'commercial' ? '#7c3aed' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Building2 size={13} style={{ color: '#8b5cf6' }} />
            <span>Commercial ({stats.commercialPoliciesCount})</span>
          </button>
        </div>
      </div>

      {/* 4. Total Clients Card */}
      <div
        onClick={() => {
          onSelectFilter('all');
          onSelectPolicyType('all');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.125rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: (currentFilter === 'all' && selectedPolicyType === 'all')
            ? '2px solid var(--text-primary)'
            : '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
            Total Active Clients
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {stats.totalClients}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats.totalPolicies} active policies
          </div>
        </div>

        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-subtle)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Users size={22} strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
