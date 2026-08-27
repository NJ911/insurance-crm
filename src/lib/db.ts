import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
let dbInstance: any = null;

export function getDb(): any {
  if (!dbInstance) {
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
      } catch (e) {
        // ignore on read-only environments
      }
    }
    const dbPath = path.join(dbDir, 'insurance_crm.db');
    const Database = require('better-sqlite3');
    dbInstance = new Database(dbPath);
    try {
      dbInstance.pragma('journal_mode = WAL');
    } catch (e) {
      // ignore
    }
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: any) {
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
      policy_type TEXT NOT NULL,
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

  const countClients = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  const countPolicies = db.prepare('SELECT COUNT(*) as count FROM policies').get() as { count: number };

  if (countClients.count === 0 || countPolicies.count === 0) {
    seedMultiPolicyClients(db);
  }
}

function seedMultiPolicyClients(db: any) {
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
    insertClient.run({
      id: 'client-1',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      dateOfBirth: '1988-04-14',
      dlNumber: 'D8921-4492-9102',
      phoneNumber: '(555) 234-8901',
      email: 'sarah.j@example.com',
      notes: 'Bundled auto & home policy client.',
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
      renewalDate: formatDateOffset(5),
      expiryDate: formatDateOffset(12),
      notes: 'Standard auto coverage',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      archivedAt: null
    });
  });

  seedTransaction();
}
