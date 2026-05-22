import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { Club } from '@/models/Club';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;
  const clubs = await Club.find().sort({ betAmount: 1 });
  return NextResponse.json({ clubs });
}
