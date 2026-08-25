import { NextRequest, NextResponse } from 'next/server';
import { addPolicyToClient } from '@/lib/storage';
import { PolicyCreatePayload } from '@/lib/types';
import { verifyAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuthCookie();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      clientId,
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
      notes
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required.' }, { status: 400 });
    }

    if (!termStartDate || !renewalDate || !expiryDate) {
      return NextResponse.json({ error: 'Term start, renewal, and expiry dates are required.' }, { status: 400 });
    }

    if (policyType === 'auto' && !plateNumber?.trim()) {
      return NextResponse.json({ error: 'Plate number is required for Auto insurance.' }, { status: 400 });
    }
    if (policyType === 'home' && !propertyAddress?.trim()) {
      return NextResponse.json({ error: 'Property address is required for Home insurance.' }, { status: 400 });
    }
    if (policyType === 'commercial' && !businessName?.trim()) {
      return NextResponse.json({ error: 'Business name is required for Commercial insurance.' }, { status: 400 });
    }

    const payload: PolicyCreatePayload = {
      clientId,
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
      notes: notes?.trim() || undefined
    };

    const newPolicy = addPolicyToClient(payload);
    return NextResponse.json({ policy: newPolicy, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add policy' }, { status: 500 });
  }
}
