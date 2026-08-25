export type ClientStatus = 'active' | 'due_soon' | 'expired';
export type PolicyType = 'auto' | 'home' | 'commercial';

export interface Policy {
  id: string;
  clientId: string;
  policyType: PolicyType;
  policyNumber?: string;
  
  // Auto specific fields
  plateNumber?: string;
  vehicleMakeModel?: string;

  // Home specific fields
  propertyAddress?: string;
  propertyType?: string; // Single Family, Condo, Townhouse, Rental, etc.

  // Commercial specific fields
  businessName?: string;
  businessType?: string; // Retail, Contractor, Tech, LLC, etc.

  // Term & Renewal
  termStartDate: string; // YYYY-MM-DD
  renewalDate: string;   // YYYY-MM-DD
  expiryDate: string;    // YYYY-MM-DD
  notes?: string;

  // Computed
  status: ClientStatus;
  daysUntilExpiry: number;
  daysUntilRenewal: number;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  dlNumber: string;    // Driver's License Number
  phoneNumber?: string;
  email?: string;
  notes?: string;

  // Policies
  policies: Policy[];

  // Highest urgency across all policies
  status: ClientStatus;
  nearestExpiryDate: string;
  nearestRenewalDate: string;
  minDaysUntilRenewal: number;
  minDaysUntilExpiry: number;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ClientCreatePayload {
  // Personal Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dlNumber: string;
  phoneNumber?: string;
  email?: string;
  notes?: string;

  // Initial Policy Info
  policyType: PolicyType;
  policyNumber?: string;
  plateNumber?: string;
  vehicleMakeModel?: string;
  propertyAddress?: string;
  propertyType?: string;
  businessName?: string;
  businessType?: string;
  termStartDate: string;
  renewalDate: string;
  expiryDate: string;
  policyNotes?: string;
}

export interface PolicyCreatePayload {
  clientId: string;
  policyType: PolicyType;
  policyNumber?: string;
  plateNumber?: string;
  vehicleMakeModel?: string;
  propertyAddress?: string;
  propertyType?: string;
  businessName?: string;
  businessType?: string;
  termStartDate: string;
  renewalDate: string;
  expiryDate: string;
  notes?: string;
}

export interface ClientFilterOptions {
  search?: string;
  status?: 'all' | 'due_soon' | 'expired' | 'active' | 'this_month' | 'archived';
  policyType?: 'all' | 'auto' | 'home' | 'commercial';
  urgencyDaysThreshold?: number; // default 30
  sortBy?: 'expiryDate' | 'renewalDate' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalClients: number;
  totalPolicies: number;
  autoPoliciesCount: number;
  homePoliciesCount: number;
  commercialPoliciesCount: number;
  dueSoonCount: number;
  expiredCount: number;
  activeCount: number;
  archivedCount: number;
  expiringThisMonthCount: number;
}

export type RenewalMonthOption = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface RenewalPayload {
  policyId: string;
  months: RenewalMonthOption;
  newTermStartDate: string;
  newRenewalDate: string;
  newExpiryDate: string;
  notes?: string;
}
