import { supabase, isSupabaseConfigured } from './supabase';

function getDb() {
  const { getDb: loadDb } = require('./db');
  return loadDb();
}
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

export async function getClients(filters?: ClientFilterOptions): Promise<Client[]> {
  const threshold = filters?.urgencyDaysThreshold || 30;

  let clientRows: any[] = [];
  let policyRows: any[] = [];

  if (isSupabaseConfigured && supabase) {
    // 1. Fetch from Supabase
    let clientQuery = supabase.from('clients').select('*');
    if (filters?.status === 'archived') {
      clientQuery = clientQuery.not('archived_at', 'is', null);
    } else {
      clientQuery = clientQuery.is('archived_at', null);
    }

    const { data: cData, error: cErr } = await clientQuery;
    if (cErr) console.error('Supabase fetch clients error:', cErr);
    clientRows = cData || [];

    const { data: pData, error: pErr } = await supabase
      .from('policies')
      .select('*')
      .is('archived_at', null);
    if (pErr) console.error('Supabase fetch policies error:', pErr);
    policyRows = pData || [];
  } else {
    // 2. Fetch from Local SQLite
    const db = getDb();
    let clientQueryStr = 'SELECT * FROM clients';
    if (filters?.status === 'archived') {
      clientQueryStr += ' WHERE archived_at IS NOT NULL';
    } else {
      clientQueryStr += ' WHERE archived_at IS NULL';
    }
    clientRows = db.prepare(clientQueryStr).all();
    policyRows = db.prepare('SELECT * FROM policies WHERE archived_at IS NULL').all();
  }

  // 3. Assemble policies by client ID
  const policiesByClientId = new Map<string, Policy[]>();
  for (const pr of policyRows) {
    const policy = mapRowToPolicy(pr, threshold);
    const list = policiesByClientId.get(policy.clientId) || [];
    list.push(policy);
    policiesByClientId.set(policy.clientId, list);
  }

  // 4. Assemble clients with policies & compute aggregate statuses
  let clients: Client[] = [];

  for (const cr of clientRows) {
    let clientPolicies = policiesByClientId.get(cr.id) || [];

    const hasMatchingPolicyType = !filters?.policyType || filters.policyType === 'all'
      ? true
      : clientPolicies.some(p => p.policyType === filters.policyType);

    if (!hasMatchingPolicyType) {
      continue;
    }

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

  // 5. Search Filter
  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    clients = clients.filter(c => {
      const nameMatch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(term);
      const dlMatch = (c.dlNumber || '').toLowerCase().includes(term);
      const phoneMatch = c.phoneNumber?.toLowerCase().includes(term);
      const emailMatch = c.email?.toLowerCase().includes(term);

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

  // 6. Status Filter
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

  // 7. Sorting
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

export async function getClientById(id: string): Promise<Client | null> {
  const clients = await getClients({ status: 'all' });
  const found = clients.find(c => c.id === id);
  if (found) return found;

  const archived = await getClients({ status: 'archived' });
  return archived.find(c => c.id === id) || null;
}

export async function createClientWithPolicy(data: ClientCreatePayload): Promise<Client> {
  const clientId = 'c-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const policyId = 'pol-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { error: cErr } = await supabase.from('clients').insert({
      id: clientId,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      date_of_birth: data.dateOfBirth,
      dl_number: data.dlNumber.trim().toUpperCase(),
      phone_number: data.phoneNumber?.trim() || null,
      email: data.email?.trim() || null,
      notes: data.notes?.trim() || null,
      created_at: now,
      updated_at: now
    });
    if (cErr) throw new Error(cErr.message);

    const { error: pErr } = await supabase.from('policies').insert({
      id: policyId,
      client_id: clientId,
      policy_type: data.policyType,
      policy_number: data.policyNumber?.trim() || null,
      plate_number: data.plateNumber?.trim().toUpperCase() || null,
      vehicle_make_model: data.vehicleMakeModel?.trim() || null,
      property_address: data.propertyAddress?.trim() || null,
      property_type: data.propertyType?.trim() || null,
      business_name: data.businessName?.trim() || null,
      business_type: data.businessType?.trim() || null,
      term_start_date: data.termStartDate,
      renewal_date: data.renewalDate,
      expiry_date: data.expiryDate,
      notes: data.policyNotes?.trim() || null,
      created_at: now,
      updated_at: now
    });
    if (pErr) throw new Error(pErr.message);
  } else {
    const db = getDb();
    db.prepare(`
      INSERT INTO clients (
        id, first_name, last_name, date_of_birth, dl_number,
        phone_number, email, notes, created_at, updated_at, archived_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `).run(
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

    db.prepare(`
      INSERT INTO policies (
        id, client_id, policy_type, policy_number,
        plate_number, vehicle_make_model,
        property_address, property_type,
        business_name, business_type,
        term_start_date, renewal_date, expiry_date,
        notes, created_at, updated_at, archived_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `).run(
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
  }

  const newClient = await getClientById(clientId);
  return newClient!;
}

export async function addPolicyToClient(payload: PolicyCreatePayload): Promise<Policy> {
  const policyId = 'pol-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('policies').insert({
      id: policyId,
      client_id: payload.clientId,
      policy_type: payload.policyType,
      policy_number: payload.policyNumber?.trim() || null,
      plate_number: payload.plateNumber?.trim().toUpperCase() || null,
      vehicle_make_model: payload.vehicleMakeModel?.trim() || null,
      property_address: payload.propertyAddress?.trim() || null,
      property_type: payload.propertyType?.trim() || null,
      business_name: payload.businessName?.trim() || null,
      business_type: payload.businessType?.trim() || null,
      term_start_date: payload.termStartDate,
      renewal_date: payload.renewalDate,
      expiry_date: payload.expiryDate,
      notes: payload.notes?.trim() || null,
      created_at: now,
      updated_at: now
    }).select().single();

    if (error) throw new Error(error.message);
    return mapRowToPolicy(data);
  } else {
    const db = getDb();
    db.prepare(`
      INSERT INTO policies (
        id, client_id, policy_type, policy_number,
        plate_number, vehicle_make_model,
        property_address, property_type,
        business_name, business_type,
        term_start_date, renewal_date, expiry_date,
        notes, created_at, updated_at, archived_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `).run(
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
}

export async function updateClientPersonal(id: string, data: Partial<Client>): Promise<Client | null> {
  const existing = await getClientById(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('clients').update({
      first_name: data.firstName ?? existing.firstName,
      last_name: data.lastName ?? existing.lastName,
      date_of_birth: data.dateOfBirth ?? existing.dateOfBirth,
      dl_number: (data.dlNumber ?? existing.dlNumber).toUpperCase(),
      phone_number: data.phoneNumber !== undefined ? data.phoneNumber : existing.phoneNumber,
      email: data.email !== undefined ? data.email : existing.email,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updated_at: now
    }).eq('id', id);

    if (error) throw new Error(error.message);
  } else {
    const db = getDb();
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
  }

  return getClientById(id);
}

export async function updatePolicyDetails(policyId: string, data: Partial<Policy>): Promise<Policy | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const updatePayload: any = { updated_at: now };
    if (data.policyType) updatePayload.policy_type = data.policyType;
    if (data.policyNumber !== undefined) updatePayload.policy_number = data.policyNumber?.trim() || null;
    if (data.plateNumber !== undefined) updatePayload.plate_number = data.plateNumber?.trim().toUpperCase() || null;
    if (data.vehicleMakeModel !== undefined) updatePayload.vehicle_make_model = data.vehicleMakeModel?.trim() || null;
    if (data.propertyAddress !== undefined) updatePayload.property_address = data.propertyAddress?.trim() || null;
    if (data.propertyType !== undefined) updatePayload.property_type = data.propertyType?.trim() || null;
    if (data.businessName !== undefined) updatePayload.business_name = data.businessName?.trim() || null;
    if (data.businessType !== undefined) updatePayload.business_type = data.businessType?.trim() || null;
    if (data.termStartDate) updatePayload.term_start_date = data.termStartDate;
    if (data.renewalDate) updatePayload.renewal_date = data.renewalDate;
    if (data.expiryDate) updatePayload.expiry_date = data.expiryDate;
    if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;

    const { data: updatedData, error } = await supabase.from('policies').update(updatePayload).eq('id', policyId).select().single();

    if (error) throw new Error(error.message);
    return mapRowToPolicy(updatedData);
  } else {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId);
    if (!existing) return null;

    db.prepare(`
      UPDATE policies SET
        policy_type = COALESCE(?, policy_type),
        policy_number = ?,
        plate_number = ?,
        vehicle_make_model = ?,
        property_address = ?,
        property_type = ?,
        business_name = ?,
        business_type = ?,
        term_start_date = COALESCE(?, term_start_date),
        renewal_date = COALESCE(?, renewal_date),
        expiry_date = COALESCE(?, expiry_date),
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      data.policyType || null,
      data.policyNumber !== undefined ? (data.policyNumber?.trim() || null) : existing.policy_number,
      data.plateNumber !== undefined ? (data.plateNumber?.trim().toUpperCase() || null) : existing.plate_number,
      data.vehicleMakeModel !== undefined ? (data.vehicleMakeModel?.trim() || null) : existing.vehicle_make_model,
      data.propertyAddress !== undefined ? (data.propertyAddress?.trim() || null) : existing.property_address,
      data.propertyType !== undefined ? (data.propertyType?.trim() || null) : existing.property_type,
      data.businessName !== undefined ? (data.businessName?.trim() || null) : existing.business_name,
      data.businessType !== undefined ? (data.businessType?.trim() || null) : existing.business_type,
      data.termStartDate || null,
      data.renewalDate || null,
      data.expiryDate || null,
      data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
      now,
      policyId
    );

    const row = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId);
    return mapRowToPolicy(row);
  }
}

export async function renewPolicy(payload: RenewalPayload): Promise<Policy | null> {
  let row: any = null;
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('policies').select('*').eq('id', payload.policyId).single();
    row = data;
  } else {
    const db = getDb();
    row = db.prepare('SELECT * FROM policies WHERE id = ?').get(payload.policyId);
  }

  if (!row) return null;

  let updatedNotes = row.notes || '';
  const renewalLog = `\n[${format(new Date(), 'yyyy-MM-dd')}] Renewed for ${payload.months} months. Prior term ended ${row.expiry_date}.`;
  if (payload.notes) {
    updatedNotes += `${renewalLog} Note: ${payload.notes}`;
  } else {
    updatedNotes += renewalLog;
  }

  if (isSupabaseConfigured && supabase) {
    const { data: updatedData, error } = await supabase.from('policies').update({
      term_start_date: payload.newTermStartDate,
      renewal_date: payload.newRenewalDate,
      expiry_date: payload.newExpiryDate,
      notes: updatedNotes.trim(),
      updated_at: now
    }).eq('id', payload.policyId).select().single();

    if (error) throw new Error(error.message);
    return mapRowToPolicy(updatedData);
  } else {
    const db = getDb();
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
}

export async function deletePolicy(policyId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('policies').delete().eq('id', policyId);
    return !error;
  } else {
    const db = getDb();
    const result = db.prepare('DELETE FROM policies WHERE id = ?').run(policyId);
    return result.changes > 0;
  }
}

export async function archiveClient(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('clients').update({ archived_at: now, updated_at: now }).eq('id', id);
    return !error;
  } else {
    const db = getDb();
    const result = db.prepare('UPDATE clients SET archived_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
    return result.changes > 0;
  }
}

export async function restoreClient(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('clients').update({ archived_at: null, updated_at: now }).eq('id', id);
    return !error;
  } else {
    const db = getDb();
    const result = db.prepare('UPDATE clients SET archived_at = NULL, updated_at = ? WHERE id = ?').run(now, id);
    return result.changes > 0;
  }
}

export async function deleteClientPermanently(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    return !error;
  } else {
    const db = getDb();
    const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export async function getDashboardStats(urgencyDaysThreshold: number = 30): Promise<DashboardStats> {
  const activeClients = await getClients({ status: 'all', urgencyDaysThreshold });
  const archivedClients = await getClients({ status: 'archived', urgencyDaysThreshold });

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
