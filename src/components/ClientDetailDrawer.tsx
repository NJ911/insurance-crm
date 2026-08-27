'use client';

import React, { useState, useEffect } from 'react';
import { Client, Policy } from '@/lib/types';
import {
  X,
  User,
  Car,
  Home,
  Building2,
  Phone,
  Mail,
  Shield,
  RefreshCw,
  Edit,
  Archive,
  RotateCcw,
  Copy,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus
} from 'lucide-react';
import { useToast } from './Toast';
import { isoToDisplay } from './CustomDateInput';
import { differenceInYears, parseISO } from 'date-fns';

interface ClientDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onOpenRenewModal: (client: Client, policy: Policy) => void;
  onOpenEditModal: (client: Client) => void;
  onOpenAddPolicyModal: (client: Client) => void;
  onArchiveClient: (id: string) => void;
  onRestoreClient: (id: string) => void;
  onDeletePolicy: (policyId: string) => void;
}

export function ClientDetailDrawer({
  isOpen,
  onClose,
  client,
  onOpenRenewModal,
  onOpenEditModal,
  onOpenAddPolicyModal,
  onArchiveClient,
  onRestoreClient,
  onDeletePolicy
}: ClientDetailDrawerProps) {
  const { showToast } = useToast();
  const [showDl, setShowDl] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !client) return null;

  const isExpired = client.status === 'expired';
  const isDueSoon = client.status === 'due_soon';
  const isArchived = Boolean(client.archivedAt);

  let age: number | null = null;
  try {
    age = differenceInYears(new Date(), parseISO(client.dateOfBirth));
  } catch (e) {
    // ignore
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'info');
  };

  const maskDl = (dl?: string) => {
    if (!dl || dl.length <= 4) return '••••';
    return '••••-••••-' + dl.slice(-4);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* Header Banner */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: isExpired
            ? 'rgba(239, 68, 68, 0.08)'
            : isDueSoon
            ? 'rgba(245, 158, 11, 0.08)'
            : 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {client.firstName} {client.lastName}
                </h2>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {client.policies.length} {client.policies.length === 1 ? 'Policy' : 'Policies'} Active
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {isArchived ? (
                  <span className="badge badge-archived">
                    <Archive size={12} /> Archived Client
                  </span>
                ) : isExpired ? (
                  <span className="badge badge-expired">
                    <AlertTriangle size={12} /> Renewal Expired / Overdue
                  </span>
                ) : isDueSoon ? (
                  <span className="badge badge-due pulse-amber">
                    <Clock size={12} /> Policy Renewal Due Soon (in {client.minDaysUntilRenewal}d)
                  </span>
                ) : (
                  <span className="badge badge-active">
                    <CheckCircle2 size={12} /> All Policies Active
                  </span>
                )}
              </div>
            </div>

            {/* Explicit Close X Button */}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-icon"
              title="Close (Esc)"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.45rem',
                border: '1px solid var(--border-strong)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Personal Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Driver's License</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {showDl ? client.dlNumber : maskDl(client.dlNumber)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowDl(!showDl)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem' }}
                >
                  {showDl ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(client.dlNumber, 'DL Number')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem' }}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Date of Birth</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {isoToDisplay(client.dateOfBirth)} {age !== null && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({age}y)</span>}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Phone</span>
              {client.phoneNumber ? (
                <a href={`tel:${client.phoneNumber}`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                  {client.phoneNumber}
                </a>
              ) : (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>—</span>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Email</span>
              {client.email ? (
                <a href={`mailto:${client.email}`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                  {client.email}
                </a>
              ) : (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>—</span>
              )}
            </div>
          </div>

          {/* Section: Client Policies Header & Add Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}>
              <Shield size={15} style={{ color: 'var(--brand-primary)' }} />
              Active Policies ({client.policies.length})
            </h3>

            {!isArchived && (
              <button
                type="button"
                onClick={() => onOpenAddPolicyModal(client)}
                className="btn btn-sm btn-primary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              >
                <Plus size={13} />
                <span>Add Another Policy</span>
              </button>
            )}
          </div>

          {/* Policies Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {client.policies.map((p) => {
              const pExpired = p.status === 'expired';
              const pDueSoon = p.status === 'due_soon';

              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${
                      pExpired ? 'var(--status-expired-border)' :
                      pDueSoon ? 'var(--status-due-border)' : 'var(--border-subtle)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {p.policyType === 'auto' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.75rem' }}>
                          <Car size={13} /> AUTO
                        </div>
                      )}
                      {p.policyType === 'home' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.75rem' }}>
                          <Home size={13} /> HOME
                        </div>
                      )}
                      {p.policyType === 'commercial' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.75rem' }}>
                          <Building2 size={13} /> COMMERCIAL
                        </div>
                      )}

                      {p.policyNumber && (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          #{p.policyNumber}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {pExpired ? (
                        <span className="badge badge-expired" style={{ fontSize: '0.6875rem' }}>
                          <AlertTriangle size={11} /> Expired ({Math.abs(p.daysUntilExpiry)}d overdue)
                        </span>
                      ) : pDueSoon ? (
                        <span className="badge badge-due pulse-amber" style={{ fontSize: '0.6875rem' }}>
                          <Clock size={11} /> Due in {p.daysUntilRenewal}d
                        </span>
                      ) : (
                        <span className="badge badge-active" style={{ fontSize: '0.6875rem' }}>
                          <CheckCircle2 size={11} /> Active ({p.daysUntilExpiry}d left)
                        </span>
                      )}

                      {!isArchived && (
                        <button
                          type="button"
                          onClick={() => onOpenRenewModal(client, p)}
                          className="btn btn-sm btn-primary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <RefreshCw size={12} /> Renew
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Policy Identifier */}
                  <div style={{ marginBottom: '0.65rem', fontSize: '0.875rem' }}>
                    {p.policyType === 'auto' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {p.plateNumber && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="plate-badge">{p.plateNumber}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.plateNumber!, 'Plate Number')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem' }}
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        )}
                        {p.vehicleMakeModel && (
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.vehicleMakeModel}</span>
                        )}
                      </div>
                    )}

                    {p.policyType === 'home' && (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.propertyAddress}</div>
                        {p.propertyType && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.propertyType}</div>}
                      </div>
                    )}

                    {p.policyType === 'commercial' && (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.businessName}</div>
                        {p.businessType && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.businessType}</div>}
                      </div>
                    )}
                  </div>

                  {/* Dates Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Term Start</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{isoToDisplay(p.termStartDate)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Renewal Target</span>
                      <strong style={{ color: pExpired || pDueSoon ? 'var(--status-due-text)' : 'var(--text-primary)' }}>
                        {isoToDisplay(p.renewalDate)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Expiry Date</span>
                      <strong style={{ color: pExpired ? 'var(--status-expired-text)' : 'var(--text-primary)' }}>
                        {isoToDisplay(p.expiryDate)}
                      </strong>
                    </div>
                  </div>

                  {p.notes && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{p.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* General Client Notes */}
          {client.notes && (
            <div style={{
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                <FileText size={12} /> Client Dossier Notes
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                {client.notes}
              </p>
            </div>
          )}

          {/* Action Footer with prominent Close button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap'
          }}>
            <div>
              {isArchived ? (
                <button
                  type="button"
                  onClick={() => {
                    onRestoreClient(client.id);
                    onClose();
                  }}
                  className="btn btn-secondary"
                >
                  <RotateCcw size={14} /> Restore Client
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onArchiveClient(client.id);
                    onClose();
                  }}
                  className="btn btn-ghost"
                >
                  <Archive size={14} /> Archive Client
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <button
                type="button"
                onClick={() => {
                  onOpenEditModal(client);
                  onClose();
                }}
                className="btn btn-secondary"
              >
                <Edit size={14} /> Edit Info
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
