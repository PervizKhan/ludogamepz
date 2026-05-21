import { NextRequest, NextResponse } from 'next/server';

// Use env variable or fallback
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'pzKing4@oxford-admin-token';

export function verifyAdmin(request: NextRequest) {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');
  const headerToken = request.headers.get('x-admin-token');
  const token = queryToken || headerToken;

  if (!token || token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
