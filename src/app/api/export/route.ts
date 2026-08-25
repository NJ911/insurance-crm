import { NextRequest, NextResponse } from 'next/server';
import { getClients, exportClientsToCsv } from '@/lib/storage';
import { verifyAuthCookie } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const isAuth = await verifyAuthCookie();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let clients = getClients({ status: 'all' });
    if (includeArchived) {
      const archived = getClients({ status: 'archived' });
      clients = [...clients, ...archived];
    }

    const csvContent = exportClientsToCsv(clients);
    const filename = `insurance_clients_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
