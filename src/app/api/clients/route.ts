import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClientWithPolicy, getDashboardStats } from '@/lib/storage';
import { ClientFilterOptions, ClientCreatePayload } from '@/lib/types';
import { verifyAuthCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAuth = await verifyAuthCookie();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as ClientFilterOptions['status']) || 'all';
    const policyType = (searchParams.get('policyType') as ClientFilterOptions['policyType']) || 'all';
    const urgencyDays = searchParams.get('urgencyDays') ? parseInt(searchParams.get('urgencyDays')!, 10) : 30;
    const sortBy = (searchParams.get('sortBy') as ClientFilterOptions['sortBy']) || 'expiryDate';
    const sortOrder = (searchParams.get('sortOrder') as ClientFilterOptions['sortOrder']) || 'asc';

    const filters: ClientFilterOptions = {
      search,
      status,
      policyType,
      urgencyDaysThreshold: isNaN(urgencyDays) ? 30 : urgencyDays,
      sortBy,
      sortOrder
    };

    const clients = getClients(filters);
    const stats = getDashboardStats(filters.urgencyDaysThreshold);

    return NextResponse.json({
      clients,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuthCookie();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      dlNumber,
      phoneNumber,
      email,
      notes,
      policyType,
      policyNumber,
      plateNumber,
      vehicleMakeModel,
      propertyAddress,
      propertyType,
      businessName,
      businessType,
      termStartDate,
      renewalDate,
      expiryDate,
      policyNotes
    } = body;

    // Validate personal fields
    if (!firstName?.trim() || !lastName?.trim() || !dateOfBirth || !dlNumber?.trim()) {
      return NextResponse.json({ error: 'Please fill in client name, DOB, and Driver License.' }, { status: 400 });
    }

    // Validate DOB in the past
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime()) || dob >= new Date()) {
      return NextResponse.json({ error: 'Date of birth must be a valid date in the past.' }, { status: 400 });
    }

    // Validate policy dates
    if (!termStartDate || !renewalDate || !expiryDate) {
      return NextResponse.json({ error: 'Please enter term start date, renewal target date, and expiry date.' }, { status: 400 });
    }

    const start = new Date(termStartDate);
    const end = new Date(expiryDate);
    if (end <= start) {
      return NextResponse.json({ error: 'Policy expiry date must be after term start date.' }, { status: 400 });
    }

    // Validate policy type specific fields
    if (policyType === 'auto' && !plateNumber?.trim()) {
      return NextResponse.json({ error: 'Plate number is required for Auto insurance.' }, { status: 400 });
    }
    if (policyType === 'home' && !propertyAddress?.trim()) {
      return NextResponse.json({ error: 'Property address is required for Home insurance.' }, { status: 400 });
    }
    if (policyType === 'commercial' && !businessName?.trim()) {
      return NextResponse.json({ error: 'Business name is required for Commercial insurance.' }, { status: 400 });
    }

    const payload: ClientCreatePayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      dlNumber: dlNumber.trim().toUpperCase(),
      phoneNumber: phoneNumber?.trim() || undefined,
      email: email?.trim() || undefined,
      notes: notes?.trim() || undefined,
      policyType: policyType || 'auto',
      policyNumber: policyNumber?.trim() || undefined,
      plateNumber: plateNumber?.trim().toUpperCase() || undefined,
      vehicleMakeModel: vehicleMakeModel?.trim() || undefined,
      propertyAddress: propertyAddress?.trim() || undefined,
      propertyType: propertyType?.trim() || undefined,
      businessName: businessName?.trim() || undefined,
      businessType: businessType?.trim() || undefined,
      termStartDate,
      renewalDate,
      expiryDate,
      policyNotes: policyNotes?.trim() || undefined
    };

    const newClient = createClientWithPolicy(payload);
    return NextResponse.json({ client: newClient, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}
