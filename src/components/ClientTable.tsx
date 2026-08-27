'use client';

import React, { useState } from 'react';
import {
  Client,
  Policy,
  ClientFilterOptions,
  PolicyType
} from '@/lib/types';
import {
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  Car,
  Home,
  Building2,
  Phone,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Edit,
  Plus,
  ChevronRight,
  Layers,
  Users
} from 'lucide-react';
import { useToast } from './Toast';
import { isoToDisplay } from './CustomDateInput';

interface ClientTableProps {
  clients: Client[];
  currentFilter: ClientFilterOptions['status'];
  onSelectFilter: (status: ClientFilterOptions['status']) => void;
  selectedPolicyType: 'all' | PolicyType;
  onPolicyTypeChange: (type: 'all' | PolicyType) => void;
  sortBy: ClientFilterOptions['sortBy'];
  sortOrder: ClientFilterOptions['sortOrder'];
  onSortChange: (sortBy: ClientFilterOptions['sortBy']) => void;
  onOpenRenewModal: (client: Client, policy: Policy) => void;
  onOpenDetailDrawer: (client: Client) => void;
  onOpenEditModal: (client: Client) => void;
  onOpenAddPolicyModal: (client: Client) => void;
  onArchiveClient: (id: string) => void;
  onRestoreClient: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  searchQuery: string;
}

export function ClientTable({
  clients,
  currentFilter,
  onSelectFilter,
  selectedPolicyType,
  onPolicyTypeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onOpenRenewModal,
  onOpenDetailDrawer,
  onOpenEditModal,
  onOpenAddPolicyModal,
  onArchiveClient,
  onRestoreClient,
  onDeletePermanently,
  searchQuery
}: ClientTableProps) {
  const { showToast } = useToast();
  const [revealedDlIds, setRevealedDlIds] = useState<Set<string>>(new Set());

  const toggleDlReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedDlIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'info');
  };

  const productTabs = [
    { id: 'all' as const, label: 'All Insurance', icon: Layers, color: 'var(--brand-primary)' },
    { id: 'auto' as const, label: 'Auto Insurance', icon: Car, color: '#3b82f6' },
    { id: 'home' as const, label: 'Home Policies', icon: Home, color: '#10b981' },
    { id: 'commercial' as const, label: 'Commercial Policies', icon: Building2, color: '#8b5cf6' }
  ];

  const filterTabs = [
    { id: 'all', label: 'All Clients', icon: Users, color: 'var(--text-primary)' },
    { id: 'due_soon', label: 'Due Soon', icon: Clock, color: 'var(--status-due-text)' },
    { id: 'this_month', label: 'This Month', icon: Calendar, color: 'var(--brand-primary)' },
    { id: 'expired', label: 'Expired', icon: AlertCircle, color: 'var(--status-expired-text)' },
    { id: 'active', label: 'Active', icon: CheckCircle2, color: '#10b981' },
    { id: 'archived', label: 'Archived', icon: Archive, color: 'var(--text-muted)' }
  ];

  const maskDl = (dl?: string) => {
    if (!dl || dl.length <= 4) return '••••';
    return '••••-••••-' + dl.slice(-4);
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden'
    }}>
      {/* 1. Top Tier: Direct Product Switcher Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {/* Product Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
            Insurance Type:
          </span>
          {productTabs.map(tab => {
            const active = selectedPolicyType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onPolicyTypeChange(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? `2px solid ${tab.color}` : '1px solid var(--border-subtle)',
                  background: active ? `${tab.color}15` : 'var(--bg-surface-subtle)',
                  color: active ? tab.color : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={14} style={{ color: active ? tab.color : 'var(--text-muted)' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-strong)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="expiryDate">Nearest Expiry (Soonest)</option>
            <option value="renewalDate">Nearest Renewal (Soonest)</option>
            <option value="name">Client Name (A-Z)</option>
            <option value="createdAt">Date Added</option>
          </select>
        </div>
      </div>

      {/* 2. Secondary Tier: Status Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '0.75rem',
        flexWrap: 'wrap',
        background: 'var(--bg-surface-subtle)'
      }}>
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {filterTabs.map(tab => {
            const active = currentFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectFilter(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: active ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  background: active ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={13} style={{ color: active ? '#ffffff' : tab.color }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing <strong>{clients.length}</strong> {clients.length === 1 ? 'client' : 'clients'}
          {selectedPolicyType !== 'all' && <span> with <strong>{selectedPolicyType.toUpperCase()}</strong></span>}
        </span>
      </div>

      {/* Table Content or Empty State */}
      {(() => {
        const displayedClients = clients.filter(c => {
          if (selectedPolicyType === 'all') return true;
          return c.policies.some(p => p.policyType === selectedPolicyType);
        });

        if (displayedClients.length === 0) {
          return (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--text-secondary)'
              }}>
                <UserCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No {selectedPolicyType !== 'all' ? selectedPolicyType.toUpperCase() : ''} Client Records Found
              </h3>
              <p style={{ fontSize: '0.8125rem', maxWidth: '420px', margin: '0 auto' }}>
                {searchQuery
                  ? `No clients matched your search for "${searchQuery}".`
                  : `There are currently no clients with ${selectedPolicyType.toUpperCase()} policies in this view.`}
              </p>
            </div>
          );
        }

        return (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'var(--bg-surface)'
                }}>
                  <th style={{ padding: '0.75rem 1.25rem', width: '24%' }}>Client</th>
                  <th style={{ padding: '0.75rem 1rem', width: '40%' }}>
                    {selectedPolicyType === 'auto' ? 'Auto Policy & Plate' :
                     selectedPolicyType === 'home' ? 'Home Policy & Address' :
                     selectedPolicyType === 'commercial' ? 'Commercial Business Policy' :
                     'Attached Policies'}
                  </th>
                  <th style={{ padding: '0.75rem 1rem', width: '16%' }}>Next Renewal Target</th>
                  <th style={{ padding: '0.75rem 1rem', width: '10%' }}>Driver License</th>
                  <th style={{ padding: '0.75rem 1.25rem', width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedClients.map((client) => {
                const isDlRevealed = revealedDlIds.has(client.id);
                const isExpired = client.status === 'expired';
                const isDueSoon = client.status === 'due_soon';
                const isArchived = Boolean(client.archivedAt);

                // Filter policies to display if policyType is active
                const displayedPolicies = selectedPolicyType === 'all'
                  ? client.policies
                  : client.policies.filter(p => p.policyType === selectedPolicyType);

                return (
                  <tr
                    key={client.id}
                    onClick={() => onOpenDetailDrawer(client)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                      background: isExpired
                        ? 'rgba(239, 68, 68, 0.03)'
                        : isDueSoon
                        ? 'rgba(245, 158, 11, 0.03)'
                        : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isExpired
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isDueSoon
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'var(--bg-surface-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isExpired
                        ? 'rgba(239, 68, 68, 0.03)'
                        : isDueSoon
                        ? 'rgba(245, 158, 11, 0.03)'
                        : 'transparent';
                    }}
                  >
                    {/* 1. Client Column */}
                    <td style={{ padding: '0.875rem 1.25rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                          {client.lastName}, {client.firstName}
                        </span>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-surface-subtle)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          {client.policies.length}P
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        DOB: {isoToDisplay(client.dateOfBirth)}
                      </div>

                      {client.phoneNumber && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={11} /> {client.phoneNumber}
                        </div>
                      )}
                    </td>

                    {/* 2. Policies Column */}
                    <td style={{ padding: '0.875rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {displayedPolicies.map((p) => {
                          const pExpired = p.status === 'expired';
                          const pDueSoon = p.status === 'due_soon';

                          return (
                            <div
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                                padding: '0.35rem 0.6rem',
                                borderRadius: 'var(--radius-md)',
                                background: pExpired
                                  ? 'rgba(239, 68, 68, 0.08)'
                                  : pDueSoon
                                  ? 'rgba(245, 158, 11, 0.08)'
                                  : 'var(--bg-surface-subtle)',
                                border: `1px solid ${
                                  pExpired ? 'var(--status-expired-border)' :
                                  pDueSoon ? 'var(--status-due-border)' : 'var(--border-subtle)'
                                }`
                              }}
                            >
                              {/* Left Chip Content */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                                {p.policyType === 'auto' && (
                                  <>
                                    <Car size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                    {p.plateNumber && (
                                      <span className="plate-badge" style={{ fontSize: '0.6875rem', padding: '0.1rem 0.35rem' }}>
                                        {p.plateNumber}
                                      </span>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {p.vehicleMakeModel || 'Auto Policy'}
                                    </span>
                                  </>
                                )}

                                {p.policyType === 'home' && (
                                  <>
                                    <Home size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {p.propertyAddress || 'Home Policy'}
                                    </span>
                                  </>
                                )}

                                {p.policyType === 'commercial' && (
                                  <>
                                    <Building2 size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {p.businessName || 'Business Policy'}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Right: Status Pill & Inline Renew Button */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                {pExpired ? (
                                  <span className="badge badge-expired" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                                    Overdue {Math.abs(p.daysUntilExpiry)}d
                                  </span>
                                ) : pDueSoon ? (
                                  <span className="badge badge-due pulse-amber" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                                    Due in {p.daysUntilRenewal}d
                                  </span>
                                ) : (
                                  <span className="badge badge-active" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                                    {p.daysUntilExpiry}d left
                                  </span>
                                )}

                                {!isArchived && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenRenewModal(client, p);
                                    }}
                                    className="btn btn-sm btn-primary"
                                    style={{ padding: '0.15rem 0.45rem', fontSize: '0.6875rem' }}
                                    title="Renew Policy"
                                  >
                                    <RefreshCw size={11} /> Renew
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Inline Add Policy */}
                        {!isArchived && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddPolicyModal(client);
                            }}
                            style={{
                              alignSelf: 'flex-start',
                              background: 'none',
                              border: 'none',
                              color: 'var(--brand-primary)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: '0.15rem 0'
                            }}
                          >
                            <Plus size={12} /> Add policy
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 3. Next Renewal Target */}
                    <td style={{ padding: '0.875rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isExpired || isDueSoon ? 'var(--status-due-text)' : 'var(--text-primary)' }}>
                        {isoToDisplay(client.nearestRenewalDate)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        Exp: {isoToDisplay(client.nearestExpiryDate)}
                      </div>

                      <div style={{ marginTop: '0.35rem' }}>
                        {isExpired ? (
                          <span className="badge badge-expired" style={{ fontSize: '0.6875rem' }}>
                            <AlertCircle size={10} /> Expired
                          </span>
                        ) : isDueSoon ? (
                          <span className="badge badge-due pulse-amber" style={{ fontSize: '0.6875rem' }}>
                            <Clock size={10} /> Renewal Due Soon
                          </span>
                        ) : (
                          <span className="badge badge-active" style={{ fontSize: '0.6875rem' }}>
                            <CheckCircle2 size={10} /> Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Driver's License */}
                    <td style={{ padding: '0.875rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          {isDlRevealed ? client.dlNumber : maskDl(client.dlNumber)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggleDlReveal(client.id, e)}
                          title={isDlRevealed ? 'Hide DL' : 'Reveal DL'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.15rem' }}
                        >
                          {isDlRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        {isDlRevealed && (
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(client.dlNumber, 'DL Number', e)}
                            title="Copy DL"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.15rem' }}
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 5. Actions */}
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right', verticalAlign: 'top' }}>
                      <div
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(client)}
                          className="btn btn-sm btn-secondary btn-icon"
                          title="Edit Personal Info"
                        >
                          <Edit size={13} />
                        </button>

                        {isArchived ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onRestoreClient(client.id)}
                              className="btn btn-sm btn-secondary"
                              title="Restore Client"
                            >
                              <RotateCcw size={12} /> Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePermanently(client.id)}
                              className="btn btn-sm btn-danger btn-icon"
                              title="Permanently Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onArchiveClient(client.id)}
                            className="btn btn-sm btn-ghost btn-icon"
                            title="Archive Client"
                          >
                            <Archive size={13} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenDetailDrawer(client)}
                          className="btn btn-sm btn-secondary btn-icon"
                          title="View Full Dossier"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        );
      })()}
    </div>
  );
}
