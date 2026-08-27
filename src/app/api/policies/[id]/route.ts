import { NextRequest, NextResponse } from 'next/server';
import { renewPolicy, deletePolicy } from '@/lib/storage';
import { verifyAuthCookie } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const isAuth = await verifyAuthCookie();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === 'renew') {
      const renewed = await renewPolicy({
        policyId: id,
        months: payload.months,
        newTermStartDate: payload.newTermStartDate,
        newRenewalDate: payload.newRenewalDate,
        newExpiryDate: payload.newExpiryDate,
        notes: payload.notes
      });

      if (!renewed) {
        return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      }
      return NextResponse.json({ policy: renewed, success: true });
    }

    if (action === 'update') {
      const { updatePolicyDetails } = await import('@/lib/storage');
      const updated = await updatePolicyDetails(id, payload);
      if (!updated) {
        return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      }
      return NextResponse.json({ policy: updated, success: true });
    }

    return NextResponse.json({ error: 'Invalid patch action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const isAuth = await verifyAuthCookie();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const success = await deletePolicy(id);
    return NextResponse.json({ success, message: 'Policy removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete policy failed' }, { status: 500 });
  }
}
