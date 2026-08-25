import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'insurance_crm.db');
let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: Database.Database) {
  // Create clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      dl_number TEXT NOT NULL,
      phone_number TEXT,
      email TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      policy_type TEXT NOT NULL, -- 'auto', 'home', 'commercial'
      policy_number TEXT,
      plate_number TEXT,
      vehicle_make_model TEXT,
      property_address TEXT,
      property_type TEXT,
      business_name TEXT,
      business_type TEXT,
      term_start_date TEXT NOT NULL,
      renewal_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_policies_client_id ON policies(client_id);
    CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(policy_type);
    CREATE INDEX IF NOT EXISTS idx_policies_plate ON policies(plate_number);
    CREATE INDEX IF NOT EXISTS idx_policies_expiry ON policies(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_policies_renewal ON policies(renewal_date);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(last_name, first_name);
  `);

  // Check if we need to seed
  const countClients = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  const countPolicies = db.prepare('SELECT COUNT(*) as count FROM policies').get() as { count: number };

  if (countClients.count === 0 || countPolicies.count === 0) {
    seedMultiPolicyClients(db);
  }
}

function seedMultiPolicyClients(db: Database.Database) {
  // Clear any partial data
  db.exec('DELETE FROM policies; DELETE FROM clients;');

  const insertClient = db.prepare(`
    INSERT INTO clients (
      id, first_name, last_name, date_of_birth, dl_number,
      phone_number, email, notes, created_at, updated_at, archived_at
    ) VALUES (
      @id, @firstName, @lastName, @dateOfBirth, @dlNumber,
      @phoneNumber, @email, @notes, @createdAt, @updatedAt, @archivedAt
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
      @id, @clientId, @policyType, @policyNumber,
      @plateNumber, @vehicleMakeModel,
      @propertyAddress, @propertyType,
      @businessName, @businessType,
      @termStartDate, @renewalDate, @expiryDate,
      @notes, @createdAt, @updatedAt, @archivedAt
    )
  `);

  const now = new Date();
  const formatDateOffset = (days: number) => {
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  const seedTransaction = db.transaction(() => {
    // Client 1: Sarah Jenkins - Has Auto AND Home policy
    insertClient.run({
      id: 'client-1',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      dateOfBirth: '1988-04-14',
      dlNumber: 'D8921-4492-9102',
      phoneNumber: '(555) 234-8901',
      email: 'sarah.j@example.com',
      notes: 'Bundled auto & home policy client. Very responsive via SMS.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    insertPolicy.run({
      id: 'pol-101',
      clientId: 'client-1',
      policyType: 'auto',
      policyNumber: 'AUT-882190',
      plateNumber: '7XYZ892',
      vehicleMakeModel: '2022 Honda CR-V (Silver)',
      propertyAddress: null,
      propertyType: null,
      businessName: null,
      businessType: null,
      termStartDate: formatDateOffset(-360),
      renewalDate: formatDateOffset(5), // Due in 5 days
      expiryDate: formatDateOffset(12),
      notes: 'Clean record, safe driver bundle discount applied.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    insertPolicy.run({
      id: 'pol-102',
      clientId: 'client-1',
      policyType: 'home',
      policyNumber: 'HOM-441029',
      plateNumber: null,
      vehicleMakeModel: null,
      propertyAddress: '742 Evergreen Terrace, Springfield',
      propertyType: 'Single Family Home (3 bed / 2 bath)',
      businessName: null,
      businessType: null,
      termStartDate: formatDateOffset(-200),
      renewalDate: formatDateOffset(150),
      expiryDate: formatDateOffset(165),
      notes: 'Roof updated in 2023. Earthquake & flood rider included.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    // Client 2: Marcus Vance - Has Auto AND Commercial policy
    insertClient.run({
      id: 'client-2',
      firstName: 'Marcus',
      lastName: 'Vance',
      dateOfBirth: '1975-11-20',
      dlNumber: 'V4420-1920-3381',
      phoneNumber: '(555) 872-1049',
      email: 'm.vance@example.com',
      notes: 'Owns Vance General Contracting LLC. Needs annual commercial general liability review.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    insertPolicy.run({
      id: 'pol-103',
      clientId: 'client-2',
      policyType: 'auto',
      policyNumber: 'AUT-991042',
      plateNumber: '8ABC410',
      vehicleMakeModel: '2020 Ford F-150 SuperCrew (Blue)',
      propertyAddress: null,
      propertyType: null,
      businessName: null,
      businessType: null,
      termStartDate: formatDateOffset(-365),
      renewalDate: formatDateOffset(-4), // Expired 4 days ago
      expiryDate: formatDateOffset(-2),
      notes: 'Left voicemail regarding expired truck policy.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    insertPolicy.run({
      id: 'pol-104',
      clientId: 'client-2',
      policyType: 'commercial',
      policyNumber: 'CGL-302194',
      plateNumber: null,
      vehicleMakeModel: null,
      propertyAddress: null,
      propertyType: null,
      businessName: 'Vance General Contracting LLC',
      businessType: 'General Contractor / Commercial Liability ($2M limit)',
      termStartDate: formatDateOffset(-340),
      renewalDate: formatDateOffset(18), // Due in 18 days
      expiryDate: formatDateOffset(25),
      notes: 'Commercial liability renewal. Needs certificate of insurance for city jobs.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    // Client 3: Elena Rostova - Has Home AND Commercial policy
    insertClient.run({
      id: 'client-3',
      firstName: 'Elena',
      lastName: 'Rostova',
      dateOfBirth: '1992-08-05',
      dlNumber: 'R1930-5821-4409',
      phoneNumber: '(555) 601-3829',
      email: 'elena.rostova@example.com',
      notes: 'Architectural consultant. High-value property & Professional E&O policy.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    insertPolicy.run({
      id: 'pol-105',
      clientId: 'client-3',
      policyType: 'home',
      policyNumber: 'HOM-910283',
      plateNumber: null,
      vehicleMakeModel: null,
      propertyAddress: '1280 Hillside Blvd, Suite 400',
      propertyType: 'Luxury Penthouse Condo',
      businessName: null,
      businessType: null,
      termStartDate: formatDateOffset(-340),
      renewalDate: formatDateOffset(20), // Due in 20 days
      expiryDate: formatDateOffset(25),
      notes: 'HOA requires master policy verification.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    insertPolicy.run({
      id: 'pol-106',
      clientId: 'client-3',
      policyType: 'commercial',
      policyNumber: 'BOP-552190',
      plateNumber: null,
      vehicleMakeModel: null,
      propertyAddress: null,
      propertyType: null,
      businessName: 'Rostova Design & Architecture Studio',
      businessType: 'Professional Errors & Omissions + Business Property',
      termStartDate: formatDateOffset(-180),
      renewalDate: formatDateOffset(180),
      expiryDate: formatDateOffset(185),
      notes: 'BOP policy with cyber liability endorsement.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    // Client 4: David Chen - Auto policy
    insertClient.run({
      id: 'client-4',
      firstName: 'David',
      lastName: 'Chen',
      dateOfBirth: '1982-01-30',
      dlNumber: 'C7731-9012-1144',
      phoneNumber: '(555) 412-9988',
      email: 'david.chen@example.com',
      notes: 'Auto policy paid in full upfront.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });

    insertPolicy.run({
      id: 'pol-107',
      clientId: 'client-4',
      policyType: 'auto',
      policyNumber: 'AUT-102948',
      plateNumber: '6TRK900',
      vehicleMakeModel: '2021 Toyota RAV4 Hybrid (Grey)',
      propertyAddress: null,
      propertyType: null,
      businessName: null,
      businessType: null,
      termStartDate: formatDateOffset(-290),
      renewalDate: formatDateOffset(75),
      expiryDate: formatDateOffset(85),
      notes: 'Annual policy.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });
  });

  seedTransaction();
}
