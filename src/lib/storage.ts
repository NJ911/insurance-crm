import { getDb } from './db';
import {
  Client,
  Policy,
  ClientStatus,
  PolicyType,
  ClientFilterOptions,
  DashboardStats,
  ClientCreatePayload,
  PolicyCreatePayload,
  RenewalPayload
} from './types';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

export function computePolicyStatus(
  expiryDateStr: string,
  renewalDateStr: string,
  urgencyDaysThreshold: number = 30
): { status: ClientStatus; daysUntilExpiry: number; daysUntilRenewal: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = parseISO(expiryDateStr);
  const renewalDate = parseISO(renewalDateStr);

  const daysUntilExpiry = differenceInCalendarDays(expiryDate, today);
  const daysUntilRenewal = differenceInCalendarDays(renewalDate, today);

  if (daysUntilExpiry < 0 || daysUntilRenewal < 0) {
    return { status: 'expired', daysUntilExpiry, daysUntilRenewal };
  }

  if (daysUntilRenewal <= urgencyDaysThreshold || daysUntilExpiry <= urgencyDaysThreshold) {
    return { status: 'due_soon', daysUntilExpiry, daysUntilRenewal };
  }

  return { status: 'active', daysUntilExpiry, daysUntilRenewal };
}

function mapRowToPolicy(row: any, urgencyThreshold: number = 30): Policy {
  const computed = computePolicyStatus(row.expiry_date, row.renewal_date, urgencyThreshold);
  return {
    id: row.id,
    clientId: row.client_id,
    policyType: row.policy_type as PolicyType,
    policyNumber: row.policy_number || undefined,
    plateNumber: row.plate_number || undefined,
    vehicleMakeModel: row.vehicle_make_model || undefined,
    propertyAddress: row.property_address || undefined,
    propertyType: row.property_type || undefined,
    businessName: row.business_name || undefined,
    businessType: row.business_type || undefined,
    termStartDate: row.term_start_date,
    renewalDate: row.renewal_date,
    expiryDate: row.expiry_date,
    notes: row.notes || undefined,
    status: computed.status,
    daysUntilExpiry: computed.daysUntilExpiry,
    daysUntilRenewal: computed.daysUntilRenewal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null
  };
}

export function getClients(filters?: ClientFilterOptions): Client[] {
  const db = getDb();
  const threshold = filters?.urgencyDaysThreshold || 30;

  // 1. Fetch raw client rows
  let clientQuery = 'SELECT * FROM clients';
  const clientConditions: string[] = [];
  const clientParams: any[] = [];

  if (filters?.status === 'archived') {
    clientConditions.push('archived_at IS NOT NULL');
  } else {
    clientConditions.push('archived_at IS NULL');
  }

  if (clientConditions.length > 0) {
    clientQuery += ' WHERE ' + clientConditions.join(' AND ');
  }

  const clientRows = db.prepare(clientQuery).all(...clientParams);

  // 2. Fetch all policies
  const policyRows = db.prepare('SELECT * FROM policies WHERE archived_at IS NULL').all();
  const policiesByClientId = new Map<string, Policy[]>();

  for (const pr of policyRows) {
    const policy = mapRowToPolicy(pr, threshold);
    const list = policiesByClientId.get(policy.clientId) || [];
    list.push(policy);
    policiesByClientId.set(policy.clientId, list);
  }

  // 3. Assemble clients with policies & compute aggregate statuses
  let clients: Client[] = [];

  for (const cr of clientRows as any[]) {
    let clientPolicies = policiesByClientId.get(cr.id) || [];

    // If a policy type filter is active (e.g. 'auto', 'home', 'commercial'), we check if client matches
    const hasMatchingPolicyType = !filters?.policyType || filters.policyType === 'all'
      ? true
      : clientPolicies.some(p => p.policyType === filters.policyType);

    if (!hasMatchingPolicyType) {
      continue;
    }

    // Determine highest urgency across all policies
    let clientStatus: ClientStatus = 'active';
    let nearestExpiry = '9999-12-31';
    let nearestRenewal = '9999-12-31';
    let minDaysRenewal = 9999;
    let minDaysExpiry = 9999;

    for (const p of clientPolicies) {
      if (p.status === 'expired') {
        clientStatus = 'expired';
      } else if (p.status === 'due_soon' && clientStatus !== 'expired') {
        clientStatus = 'due_soon';
      }

      if (p.expiryDate < nearestExpiry) nearestExpiry = p.expiryDate;
      if (p.renewalDate < nearestRenewal) nearestRenewal = p.renewalDate;
      if (p.daysUntilRenewal < minDaysRenewal) minDaysRenewal = p.daysUntilRenewal;
      if (p.daysUntilExpiry < minDaysExpiry) minDaysExpiry = p.daysUntilExpiry;
    }

    if (clientPolicies.length === 0) {
      nearestExpiry = 'N/A';
      nearestRenewal = 'N/A';
      minDaysRenewal = 0;
      minDaysExpiry = 0;
    }

    const clientObj: Client = {
      id: cr.id,
      firstName: cr.first_name,
      lastName: cr.last_name,
      dateOfBirth: cr.date_of_birth,
      dlNumber: cr.dl_number,
      phoneNumber: cr.phone_number || undefined,
      email: cr.email || undefined,
      notes: cr.notes || undefined,
      policies: clientPolicies,
      status: clientStatus,
      nearestExpiryDate: nearestExpiry,
      nearestRenewalDate: nearestRenewal,
      minDaysUntilRenewal: minDaysRenewal,
      minDaysUntilExpiry: minDaysExpiry,
      createdAt: cr.created_at,
      updatedAt: cr.updated_at,
      archivedAt: cr.archived_at || null
    };

    clients.push(clientObj);
  }

  // 4. Search Filter
  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    clients = clients.filter(c => {
      // Check personal info
      const nameMatch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(term);
      const dlMatch = (c.dlNumber || '').toLowerCase().includes(term);
      const phoneMatch = c.phoneNumber?.toLowerCase().includes(term);
      const emailMatch = c.email?.toLowerCase().includes(term);

      // Check all policies for matching plate, address, business name, or policy #
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

  // 5. Status Filter
  if (filters?.status && filters.status !== 'all' && filters.status !== 'archived') {
    if (filters.status === 'due_soon') {
      clients = clients.filter(c => c.status === 'due_soon');
    } else if (filters.status === 'expired') {
      clients = clients.filter(c => c.status === 'expired');
    } else if (filters.status === 'active') {
      clients = clients.filter(c => c.status === 'active');
    } else if (filters.status === 'this_month') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      clients = clients.filter(c => {
        return c.policies.some(p => {
          const exp = parseISO(p.expiryDate);
          return exp.getMonth() === currentMonth && exp.getFullYear() === currentYear;
        });
      });
    }
  }

  // 6. Sorting
  const sortBy = filters?.sortBy || 'expiryDate';
  const sortOrder = filters?.sortOrder || 'asc';

  clients.sort((a, b) => {
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

  return clients;
}

export function getClientById(id: string): Client | null {
  const clients = getClients({ status: 'all' });
  const found = clients.find(c => c.id === id);
  if (found) return found;

  const archived = getClients({ status: 'archived' });
  return archived.find(c => c.id === id) || null;
}

export function createClientWithPolicy(data: ClientCreatePayload): Client {
  const db = getDb();
  const clientId = 'c-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const policyId = 'pol-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const insertClient = db.prepare(`
    INSERT INTO clients (
      id, first_name, last_name, date_of_birth, dl_number,
      phone_number, email, notes, created_at, updated_at, archived_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
    )
  `);

  const insertPolicy = db.prepare(`
    INSERT INTO policies (
      id, client_id, policy_type, policy_number,
      plate_number, vehicle_make_model,
      property_address, property_type,
      business_name, business_type,
      term_start_date, renewal_date, expiry_date,
      notes, created_at, updated_at, archived_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
    )
  `);

  const tx = db.transaction(() => {
    insertClient.run(
      clientId,
      data.firstName.trim(),
      data.lastName.trim(),
      data.dateOfBirth,
      data.dlNumber.trim().toUpperCase(),
      data.phoneNumber?.trim() || null,
      data.email?.trim() || null,
      data.notes?.trim() || null,
      now,
      now
    );

    insertPolicy.run(
      policyId,
      clientId,
      data.policyType,
      data.policyNumber?.trim() || null,
      data.plateNumber?.trim().toUpperCase() || null,
      data.vehicleMakeModel?.trim() || null,
      data.propertyAddress?.trim() || null,
      data.propertyType?.trim() || null,
      data.businessName?.trim() || null,
      data.businessType?.trim() || null,
      data.termStartDate,
      data.renewalDate,
      data.expiryDate,
      data.policyNotes?.trim() || null,
      now,
      now
    );
  });

  tx();

  return getClientById(clientId)!;
}

export function addPolicyToClient(payload: PolicyCreatePayload): Policy {
  const db = getDb();
  const policyId = 'pol-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const insertPolicy = db.prepare(`
    INSERT INTO policies (
      id, client_id, policy_type, policy_number,
      plate_number, vehicle_make_model,
      property_address, property_type,
      business_name, business_type,
      term_start_date, renewal_date, expiry_date,
      notes, created_at, updated_at, archived_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
    )
  `);

  insertPolicy.run(
    policyId,
    payload.clientId,
    payload.policyType,
    payload.policyNumber?.trim() || null,
    payload.plateNumber?.trim().toUpperCase() || null,
    payload.vehicleMakeModel?.trim() || null,
    payload.propertyAddress?.trim() || null,
    payload.propertyType?.trim() || null,
    payload.businessName?.trim() || null,
    payload.businessType?.trim() || null,
    payload.termStartDate,
    payload.renewalDate,
    payload.expiryDate,
    payload.notes?.trim() || null,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId);
  return mapRowToPolicy(row);
}

export function updateClientPersonal(id: string, data: Partial<Client>): Client | null {
  const db = getDb();
  const existing = getClientById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE clients SET
      first_name = ?,
      last_name = ?,
      date_of_birth = ?,
      dl_number = ?,
      phone_number = ?,
      email = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    data.firstName ?? existing.firstName,
    data.lastName ?? existing.lastName,
    data.dateOfBirth ?? existing.dateOfBirth,
    (data.dlNumber ?? existing.dlNumber).toUpperCase(),
    data.phoneNumber !== undefined ? data.phoneNumber : existing.phoneNumber,
    data.email !== undefined ? data.email : existing.email,
    data.notes !== undefined ? data.notes : existing.notes,
    now,
    id
  );

  return getClientById(id);
}

export function renewPolicy(payload: RenewalPayload): Policy | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM policies WHERE id = ?').get(payload.policyId) as any;
  if (!row) return null;

  const now = new Date().toISOString();
  let updatedNotes = row.notes || '';
  const renewalLog = `\n[${format(new Date(), 'yyyy-MM-dd')}] Renewed for ${payload.months} months. Prior term ended ${row.expiry_date}.`;
  if (payload.notes) {
    updatedNotes += `${renewalLog} Note: ${payload.notes}`;
  } else {
    updatedNotes += renewalLog;
  }

  db.prepare(`
    UPDATE policies SET
      term_start_date = ?,
      renewal_date = ?,
      expiry_date = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    payload.newTermStartDate,
    payload.newRenewalDate,
    payload.newExpiryDate,
    updatedNotes.trim(),
    now,
    payload.policyId
  );

  const updatedRow = db.prepare('SELECT * FROM policies WHERE id = ?').get(payload.policyId);
  return mapRowToPolicy(updatedRow);
}

export function deletePolicy(policyId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM policies WHERE id = ?').run(policyId);
  return result.changes > 0;
}

export function archiveClient(id: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare('UPDATE clients SET archived_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
  return result.changes > 0;
}

export function restoreClient(id: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare('UPDATE clients SET archived_at = NULL, updated_at = ? WHERE id = ?').run(now, id);
  return result.changes > 0;
}

export function deleteClientPermanently(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getDashboardStats(urgencyDaysThreshold: number = 30): DashboardStats {
  const activeClients = getClients({ status: 'all', urgencyDaysThreshold });
  const archivedClients = getClients({ status: 'archived', urgencyDaysThreshold });

  let dueSoonCount = 0;
  let expiredCount = 0;
  let activeCount = 0;
  let expiringThisMonthCount = 0;
  let totalPolicies = 0;
  let autoPoliciesCount = 0;
  let homePoliciesCount = 0;
  let commercialPoliciesCount = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (const c of activeClients) {
    if (c.status === 'due_soon') dueSoonCount++;
    else if (c.status === 'expired') expiredCount++;
    else if (c.status === 'active') activeCount++;

    for (const p of c.policies) {
      totalPolicies++;
      if (p.policyType === 'auto') autoPoliciesCount++;
      else if (p.policyType === 'home') homePoliciesCount++;
      else if (p.policyType === 'commercial') commercialPoliciesCount++;

      const exp = parseISO(p.expiryDate);
      if (exp.getMonth() === currentMonth && exp.getFullYear() === currentYear) {
        expiringThisMonthCount++;
      }
    }
  }

  return {
    totalClients: activeClients.length,
    totalPolicies,
    autoPoliciesCount,
    homePoliciesCount,
    commercialPoliciesCount,
    dueSoonCount,
    expiredCount,
    activeCount,
    archivedCount: archivedClients.length,
    expiringThisMonthCount
  };
}

export function exportClientsToCsv(clients: Client[]): string {
  const headers = [
    'Client ID',
    'Client Name',
    'Date of Birth',
    'Driver License (DL)',
    'Phone Number',
    'Email',
    'Policy ID',
    'Policy Type',
    'Policy Number',
    'Vehicle Plate / Address / Business',
    'Term Start Date',
    'Renewal Target Date',
    'Policy Expiry Date',
    'Policy Status',
    'Days Until Expiry',
    'Notes',
    'Archived'
  ];

  const rows: string[] = [];

  for (const c of clients) {
    if (c.policies.length === 0) {
      rows.push([
        `"${c.id}"`,
        `"${c.lastName}, ${c.firstName}"`,
        `"${c.dateOfBirth}"`,
        `"${c.dlNumber}"`,
        `"${c.phoneNumber || ''}"`,
        `"${c.email || ''}"`,
        '""',
        '"None"',
        '""',
        '""',
        '""',
        '""',
        '""',
        `"${c.status}"`,
        '""',
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        `"${c.archivedAt ? 'Yes' : 'No'}"`
      ].join(','));
    } else {
      for (const p of c.policies) {
        const identifier = p.policyType === 'auto'
          ? (p.plateNumber ? `Plate: ${p.plateNumber} (${p.vehicleMakeModel || ''})` : '')
          : p.policyType === 'home'
          ? (p.propertyAddress || '')
          : (p.businessName ? `${p.businessName} (${p.businessType || ''})` : '');

        rows.push([
          `"${c.id}"`,
          `"${c.lastName}, ${c.firstName}"`,
          `"${c.dateOfBirth}"`,
          `"${c.dlNumber}"`,
          `"${c.phoneNumber || ''}"`,
          `"${c.email || ''}"`,
          `"${p.id}"`,
          `"${p.policyType.toUpperCase()}"`,
          `"${p.policyNumber || ''}"`,
          `"${identifier.replace(/"/g, '""')}"`,
          `"${p.termStartDate}"`,
          `"${p.renewalDate}"`,
          `"${p.expiryDate}"`,
          `"${p.status}"`,
          `"${p.daysUntilExpiry}"`,
          `"${(p.notes || c.notes || '').replace(/"/g, '""')}"`,
          `"${c.archivedAt ? 'Yes' : 'No'}"`
        ].join(','));
      }
    }
  }

  return [headers.join(','), ...rows].join('\n');
}
