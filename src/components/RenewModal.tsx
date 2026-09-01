'use client';

import React, { useState, useEffect } from 'react';
import { Client, Policy, RenewalMonthOption } from '@/lib/types';
import { X, ArrowRight, Car, Home, Building2 } from 'lucide-react';
import { addMonths, format, parseISO, subDays } from 'date-fns';
import { CustomDateInput, isoToDisplay } from './CustomDateInput';

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  policy: Policy | null;
  onConfirmRenewal: (payload: {
    policyId: string;
    months: RenewalMonthOption;
    newTermStartDate: string;
    newRenewalDate: string;
    newExpiryDate: string;
    notes?: string;
  }) => Promise<boolean>;
}

export function RenewModal({
  isOpen,
  onClose,
  client,
  policy,
  onConfirmRenewal
}: RenewModalProps) {
  const [months, setMonths] = useState<RenewalMonthOption>(12);
  const [newTermStartDate, setNewTermStartDate] = useState('');
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [renewalNote, setRenewalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthOptions: RenewalMonthOption[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  useEffect(() => {
    if (policy) {
      const baseStart = parseISO(policy.expiryDate);
      const startStr = format(baseStart, 'yyyy-MM-dd');
      setNewTermStartDate(startStr);

      const exp = addMonths(baseStart, months);
      const expStr = format(exp, 'yyyy-MM-dd');
      setNewExpiryDate(expStr);

      const renew = subDays(exp, 45);
      setNewRenewalDate(format(renew, 'yyyy-MM-dd'));
      setRenewalNote('');
    }
  }, [policy, months, isOpen]);

  if (!isOpen || !policy || !client) return null;

  const handleMonthChange = (selectedMonths: RenewalMonthOption) => {
    setMonths(selectedMonths);
    try {
      const base = parseISO(newTermStartDate || policy.expiryDate);
      const exp = addMonths(base, selectedMonths);
      setNewExpiryDate(format(exp, 'yyyy-MM-dd'));
      setNewRenewalDate(format(subDays(exp, 45), 'yyyy-MM-dd'));
    } catch (e) {
      // fallback
    }
  };

  const handleTermStartChange = (val: string) => {
    setNewTermStartDate(val);
    try {
      const base = parseISO(val);
      const exp = addMonths(base, months);
      setNewExpiryDate(format(exp, 'yyyy-MM-dd'));
      setNewRenewalDate(format(subDays(exp, 45), 'yyyy-MM-dd'));
    } catch (e) {
      // fallback
    }
  };

  const handleSetRenewalOffset = (days: number) => {
    try {
      if (newExpiryDate) {
        const exp = parseISO(newExpiryDate);
        setNewRenewalDate(format(subDays(exp, days), 'yyyy-MM-dd'));
      }
    } catch (e) {
      // fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermStartDate || !newExpiryDate || !newRenewalDate) return;

    setIsSubmitting(true);
    const success = await onConfirmRenewal({
      policyId: policy.id,
      months,
      newTermStartDate,
      newRenewalDate,
      newExpiryDate,
      notes: renewalNote.trim() || undefined
    });
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const policyTypeIcon = policy.policyType === 'auto'
    ? <Car size={18} />
    : policy.policyType === 'home'
    ? <Home size={18} />
    : <Building2 size={18} />;

  const policyLabel = policy.policyType === 'auto'
    ? `Auto Policy (${policy.plateNumber || 'Vehicle'})`
    : policy.policyType === 'home'
    ? `Home Policy (${policy.propertyAddress || 'Residence'})`
    : `Commercial Policy (${policy.businessName || 'Business'})`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {policyTypeIcon}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Renew {policy.policyType.toUpperCase()} Policy</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {client.lastName}, {client.firstName} • <strong style={{ color: 'var(--text-primary)' }}>{policyLabel}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem' }}>
          {/* Policy Transition Timeline Card */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current Term Expiry</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isoToDisplay(policy.expiryDate)}
              </span>
            </div>

            <ArrowRight size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>New Term Expiry (+{months}m)</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--status-active-text)' }}>
                {isoToDisplay(newExpiryDate)}
              </span>
            </div>
          </div>

          {/* Select Renewal Term Duration */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Select Renewal Term Duration
            </label>

            {/* Quick preset tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[
                { m: 12 as RenewalMonthOption, label: '1 Year (12 Months)', badge: 'Standard' },
                { m: 6 as RenewalMonthOption, label: '6 Months', badge: 'Semi-Annual' },
                { m: 3 as RenewalMonthOption, label: '3 Months', badge: 'Quarterly' }
              ].map(preset => (
                <button
                  key={preset.m}
                  type="button"
                  onClick={() => handleMonthChange(preset.m)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: months === preset.m ? '2px solid var(--brand-primary)' : '1px solid var(--border-strong)',
                    background: months === preset.m ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                    color: months === preset.m ? 'var(--brand-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div>{preset.label}</div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    {preset.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* All Monthly Options (3 to 12) */}
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Or select exact month duration (3 to 12 months):
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {monthOptions.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMonthChange(m)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: months === m ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: months === m ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                      color: months === m ? '#ffffff' : 'var(--text-primary)'
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date Adjustments */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <CustomDateInput
              label="New Term Start"
              required
              value={newTermStartDate}
              onChange={handleTermStartChange}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Next Renewal Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSetRenewalOffset(45)}
                    title="Set Target to 45 days before expiry date"
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.05rem 0.35rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: 'var(--brand-primary)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    -45d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRenewalOffset(30)}
                    title="Set Target to 30 days before expiry date"
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.05rem 0.35rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    -30d
                  </button>
                </div>
              </div>
              <CustomDateInput
                value={newRenewalDate}
                onChange={setNewRenewalDate}
              />
            </div>

            <CustomDateInput
              label="New Expiry Date"
              required
              value={newExpiryDate}
              onChange={setNewExpiryDate}
            />
          </div>

          {/* Renewal Note */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Renewal Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Renewal notes..."
              value={renewalNote}
              onChange={(e) => setRenewalNote(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-input)',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Renewing...' : `Confirm ${months}-Month Renewal`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
