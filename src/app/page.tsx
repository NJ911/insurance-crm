'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Client,
  Policy,
  ClientFilterOptions,
  DashboardStats,
  ClientCreatePayload,
  PolicyCreatePayload,
  RenewalMonthOption,
  PolicyType
} from '@/lib/types';
import { Header } from '@/components/Header';
import { StatCards } from '@/components/StatCards';
import { ClientTable } from '@/components/ClientTable';
import { ClientModal } from '@/components/ClientModal';
import { AddPolicyModal } from '@/components/AddPolicyModal';
import { RenewModal } from '@/components/RenewModal';
import { EditPolicyModal } from '@/components/EditPolicyModal';
import { ClientDetailDrawer } from '@/components/ClientDetailDrawer';
import { AuthScreen } from '@/components/AuthScreen';
import { useToast } from '@/components/Toast';

import { parseISO } from 'date-fns';

export default function DashboardPage() {
  const { showToast } = useToast();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientFilterOptions['status']>('all');
  const [selectedPolicyType, setSelectedPolicyType] = useState<'all' | PolicyType>('all');
  const [urgencyThreshold, setUrgencyThreshold] = useState<number>(30);
  const [sortBy, setSortBy] = useState<ClientFilterOptions['sortBy']>('expiryDate');
  const [sortOrder, setSortOrder] = useState<ClientFilterOptions['sortOrder']>('asc');

  // Master Data State (All active + archived clients stored in memory)
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalPolicies: 0,
    autoPoliciesCount: 0,
    homePoliciesCount: 0,
    commercialPoliciesCount: 0,
    dueSoonCount: 0,
    expiredCount: 0,
    activeCount: 0,
    archivedCount: 0,
    expiringThisMonthCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Drawers State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [addingPolicyClientId, setAddingPolicyClientId] = useState<string | null>(null);

  const [renewingClientId, setRenewingClientId] = useState<string | null>(null);
  const [renewingPolicy, setRenewingPolicy] = useState<Policy | null>(null);

  const [editingPolicyClientId, setEditingPolicyClientId] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  const [inspectingClientId, setInspectingClientId] = useState<string | null>(null);
  const [returnToClientId, setReturnToClientId] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
    } catch (e) {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    const savedTheme = localStorage.getItem('crm_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [checkAuth]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('crm_theme', nextTheme);
  };

  // Fetch Clients from Server (Background sync)
  const fetchClients = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/clients?urgencyDays=${urgencyThreshold}`);
      if (res.ok) {
        const data = await res.json();
        const incomingClients = data.allClients || data.clients || [];
        setAllClients(incomingClients);
        if (data.stats) {
          setStats(data.stats);
        }
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, [urgencyThreshold]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
    }
  }, [isAuthenticated, fetchClients]);

  // Instant In-Memory Filtering & Sorting (0ms Tab Switching!)
  const clients = useMemo(() => {
    let result = [...allClients];

    // 1. Archive filter
    if (statusFilter === 'archived') {
      result = result.filter(c => !!c.archivedAt);
    } else {
      result = result.filter(c => !c.archivedAt);
    }

    // 2. Policy Type filter
    if (selectedPolicyType && selectedPolicyType !== 'all') {
      result = result.filter(c => c.policies.some(p => p.policyType === selectedPolicyType));
    }

    // 3. Status filter
    if (statusFilter && statusFilter !== 'all' && statusFilter !== 'archived') {
      if (statusFilter === 'due_soon') {
        result = result.filter(c => c.status === 'due_soon');
      } else if (statusFilter === 'expired') {
        result = result.filter(c => c.status === 'expired');
      } else if (statusFilter === 'active') {
        result = result.filter(c => c.status === 'active');
      } else if (statusFilter === 'this_month') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        result = result.filter(c =>
          c.policies.some(p => {
            try {
              const exp = parseISO(p.expiryDate);
              return exp.getMonth() === currentMonth && exp.getFullYear() === currentYear;
            } catch (e) {
              return false;
            }
          })
        );
      }
    }

    // 4. Search Filter
    if (searchQuery.trim()) {
      const term = searchQuery.trim().toLowerCase();
      result = result.filter(c => {
        const nameMatch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(term);
        const dlMatch = (c.dlNumber || '').toLowerCase().includes(term);
        const phoneMatch = (c.phoneNumber || '').toLowerCase().includes(term);
        const emailMatch = (c.email || '').toLowerCase().includes(term);
        const policyMatch = c.policies.some(p =>
          (p.plateNumber && p.plateNumber.toLowerCase().includes(term)) ||
          (p.vehicleMakeModel && p.vehicleMakeModel.toLowerCase().includes(term)) ||
          (p.propertyAddress && p.propertyAddress.toLowerCase().includes(term)) ||
          (p.businessName && p.businessName.toLowerCase().includes(term)) ||
          (p.businessType && p.businessType.toLowerCase().includes(term)) ||
          (p.policyNumber && p.policyNumber.toLowerCase().includes(term))
        );
        return nameMatch || dlMatch || phoneMatch || emailMatch || policyMatch;
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'expiryDate') {
        comp = a.nearestExpiryDate.localeCompare(b.nearestExpiryDate);
      } else if (sortBy === 'renewalDate') {
        comp = a.nearestRenewalDate.localeCompare(b.nearestRenewalDate);
      } else if (sortBy === 'name') {
        comp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      } else if (sortBy === 'createdAt') {
        comp = a.createdAt.localeCompare(b.createdAt);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return result;
  }, [allClients, statusFilter, selectedPolicyType, searchQuery, sortBy, sortOrder]);

  // Derived Client Targets for Modals (Looking up in allClients ensures seamless modal flow)
  const inspectingClient = useMemo(() => {
    if (!inspectingClientId) return null;
    return allClients.find(c => c.id === inspectingClientId) || null;
  }, [inspectingClientId, allClients]);

  const editingClient = useMemo(() => {
    if (!editingClientId) return null;
    return allClients.find(c => c.id === editingClientId) || null;
  }, [editingClientId, allClients]);

  const addingPolicyClient = useMemo(() => {
    if (!addingPolicyClientId) return null;
    return allClients.find(c => c.id === addingPolicyClientId) || null;
  }, [addingPolicyClientId, allClients]);

  const renewingClient = useMemo(() => {
    if (!renewingClientId) return null;
    return allClients.find(c => c.id === renewingClientId) || null;
  }, [renewingClientId, allClients]);

  const editingPolicyClient = useMemo(() => {
    if (!editingPolicyClientId) return null;
    return allClients.find(c => c.id === editingPolicyClientId) || null;
  }, [editingPolicyClientId, allClients]);

  // Handle Save New Client + Policy
  const handleSaveClient = async (formData: ClientCreatePayload): Promise<boolean> => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast('New client profile & policy created successfully!', 'success');
        setIsAddModalOpen(false);
        fetchClients();
        return true;
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        showToast('Session expired. Please log in again.', 'error');
        return false;
      } else {
        const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        showToast(err.error || 'Failed to create client', 'error');
        return false;
      }
    } catch (e: any) {
      showToast(e?.message || 'Network error while creating client.', 'error');
      return false;
    }
  };

  // Handle Update Personal Info
  const handleUpdatePersonal = async (id: string, data: Partial<Client>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('Client personal information updated!', 'success');
        setEditingClientId(null);
        if (returnToClientId) {
          setInspectingClientId(returnToClientId);
          setReturnToClientId(null);
        }
        fetchClients();
        return true;
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        showToast('Session expired. Please log in again.', 'error');
        return false;
      } else {
        const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        showToast(err.error || 'Failed to update client', 'error');
        return false;
      }
    } catch (e: any) {
      showToast(e?.message || 'Error updating client', 'error');
      return false;
    }
  };

  // Handle Add Policy to Client
  const handleSavePolicy = async (payload: PolicyCreatePayload): Promise<boolean> => {
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`${payload.policyType.toUpperCase()} policy added to client!`, 'success');
        setIsAddPolicyModalOpen(false);
        setAddingPolicyClientId(null);
        if (returnToClientId) {
          setInspectingClientId(returnToClientId);
          setReturnToClientId(null);
        }
        fetchClients();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add policy', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error adding policy', 'error');
      return false;
    }
  };

  // Handle Policy Renewal
  const handleConfirmRenewal = async (payload: {
    policyId: string;
    months: RenewalMonthOption;
    newTermStartDate: string;
    newRenewalDate: string;
    newExpiryDate: string;
    notes?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/policies/${payload.policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renew',
          ...payload
        })
      });

      if (res.ok) {
        showToast(`Policy successfully renewed for ${payload.months} months!`, 'success');
        setRenewingClientId(null);
        setRenewingPolicy(null);
        if (returnToClientId) {
          setInspectingClientId(returnToClientId);
          setReturnToClientId(null);
        }
        fetchClients();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to renew policy', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error executing renewal', 'error');
      return false;
    }
  };

  // Handle Update Policy Details & Dates
  const handleUpdatePolicy = async (policyId: string, updatedData: Partial<Policy>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          ...updatedData
        })
      });

      if (res.ok) {
        showToast('Policy details & dates updated successfully!', 'success');
        setEditingPolicyClientId(null);
        setEditingPolicy(null);
        if (returnToClientId) {
          setInspectingClientId(returnToClientId);
          setReturnToClientId(null);
        }
        fetchClients();
        return true;
      } else {
        const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        showToast(err.error || 'Failed to update policy', 'error');
        return false;
      }
    } catch (e: any) {
      showToast(e?.message || 'Error updating policy', 'error');
      return false;
    }
  };

  // Handle Delete Policy
  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      const res = await fetch(`/api/policies/${policyId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Policy deleted', 'info');
        fetchClients();
      }
    } catch (e) {
      showToast('Failed to delete policy', 'error');
    }
  };

  // Handle Archive Client
  const handleArchiveClient = async (id: string) => {
    if (!confirm('Are you sure you want to archive this client record? (You can restore them anytime from the Archived tab).')) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' })
      });

      if (res.ok) {
        showToast('Client moved to Archive', 'info');
        fetchClients();
      }
    } catch (e) {
      showToast('Failed to archive client', 'error');
    }
  };

  // Handle Restore Client
  const handleRestoreClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });

      if (res.ok) {
        showToast('Client restored to active list', 'success');
        fetchClients();
      }
    } catch (e) {
      showToast('Failed to restore client', 'error');
    }
  };

  // Handle Permanent Delete
  const handleDeletePermanently = async (id: string) => {
    if (!confirm('WARNING: This will permanently delete this client and all their policies. Proceed?')) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}?permanent=true`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Client permanently deleted', 'info');
        fetchClients();
      }
    } catch (e) {
      showToast('Failed to delete client', 'error');
    }
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    window.open('/api/export?includeArchived=true', '_blank');
    showToast('Downloading clients & policies CSV export...', 'info');
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    showToast('CRM Locked', 'info');
  };

  // Loading Screen while verifying session
  if (isAuthenticated === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        Loading ClientGuard CRM...
      </div>
    );
  }

  // Auth Screen if not logged in
  if (!isAuthenticated) {
    return <AuthScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Streamlined Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => {
          setEditingClientId(null);
          setIsAddModalOpen(true);
        }}
        onExportCsv={handleExportCsv}
        onLogout={handleLogout}
        onRefresh={() => fetchClients(true)}
        isRefreshing={isRefreshing}
        urgencyThreshold={urgencyThreshold}
        onUrgencyThresholdChange={(days) => {
          setUrgencyThreshold(days);
          showToast(`Urgency window set to ${days} days`, 'info');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <main className="app-container">
        {/* KPI Metrics Banner (Clean 4 Cards) */}
        <StatCards
          stats={stats}
          currentFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          selectedPolicyType={selectedPolicyType}
          onSelectPolicyType={setSelectedPolicyType}
          urgencyThreshold={urgencyThreshold}
        />

        {/* Client Records Table (Streamlined) */}
        <ClientTable
          clients={clients}
          currentFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          selectedPolicyType={selectedPolicyType}
          onPolicyTypeChange={setSelectedPolicyType}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={setSortBy}
          onOpenRenewModal={(c, p) => {
            setRenewingClientId(c.id);
            setRenewingPolicy(p);
          }}
          onOpenDetailDrawer={(c) => setInspectingClientId(c.id)}
          onOpenEditModal={(c) => {
            setEditingClientId(c.id);
            setIsAddModalOpen(true);
          }}
          onOpenAddPolicyModal={(c) => {
            setAddingPolicyClientId(c.id);
            setIsAddPolicyModalOpen(true);
          }}
          onArchiveClient={handleArchiveClient}
          onRestoreClient={handleRestoreClient}
          onDeletePermanently={handleDeletePermanently}
          searchQuery={searchQuery}
        />
      </main>

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingClientId(null);
          if (returnToClientId) {
            setInspectingClientId(returnToClientId);
            setReturnToClientId(null);
          }
        }}
        onSave={handleSaveClient}
        editingClient={editingClient}
        onUpdatePersonal={handleUpdatePersonal}
      />

      {/* Add Additional Policy Modal */}
      <AddPolicyModal
        isOpen={isAddPolicyModalOpen}
        onClose={() => {
          setIsAddPolicyModalOpen(false);
          setAddingPolicyClientId(null);
          if (returnToClientId) {
            setInspectingClientId(returnToClientId);
            setReturnToClientId(null);
          }
        }}
        client={addingPolicyClient}
        onSavePolicy={handleSavePolicy}
      />

      {/* Policy Fast Renewal Modal */}
      <RenewModal
        isOpen={Boolean(renewingPolicy && renewingClient)}
        onClose={() => {
          setRenewingPolicy(null);
          setRenewingClientId(null);
          if (returnToClientId) {
            setInspectingClientId(returnToClientId);
            setReturnToClientId(null);
          }
        }}
        client={renewingClient}
        policy={renewingPolicy}
        onConfirmRenewal={handleConfirmRenewal}
      />

      {/* Edit Policy Details & Dates Modal */}
      <EditPolicyModal
        isOpen={Boolean(editingPolicy && editingPolicyClient)}
        onClose={() => {
          setEditingPolicy(null);
          setEditingPolicyClientId(null);
          if (returnToClientId) {
            setInspectingClientId(returnToClientId);
            setReturnToClientId(null);
          }
        }}
        client={editingPolicyClient}
        policy={editingPolicy}
        onSave={handleUpdatePolicy}
      />

      {/* Client Detail Dossier Drawer (With working Close & Escape) */}
      <ClientDetailDrawer
        isOpen={Boolean(inspectingClient)}
        onClose={() => {
          setInspectingClientId(null);
          setReturnToClientId(null);
        }}
        client={inspectingClient}
        onOpenRenewModal={(c, p) => {
          setReturnToClientId(c.id);
          setInspectingClientId(null);
          setRenewingClientId(c.id);
          setRenewingPolicy(p);
        }}
        onOpenEditPolicyModal={(c, p) => {
          setReturnToClientId(c.id);
          setInspectingClientId(null);
          setEditingPolicyClientId(c.id);
          setEditingPolicy(p);
        }}
        onOpenEditModal={(c) => {
          setReturnToClientId(c.id);
          setInspectingClientId(null);
          setEditingClientId(c.id);
          setIsAddModalOpen(true);
        }}
        onOpenAddPolicyModal={(c) => {
          setReturnToClientId(c.id);
          setInspectingClientId(null);
          setAddingPolicyClientId(c.id);
          setIsAddPolicyModalOpen(true);
        }}
        onArchiveClient={handleArchiveClient}
        onRestoreClient={handleRestoreClient}
        onDeletePolicy={handleDeletePolicy}
      />
    </div>
  );
}
