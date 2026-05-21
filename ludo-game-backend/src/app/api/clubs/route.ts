import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const clubs = db.prepare('SELECT * FROM clubs ORDER BY bet_amount ASC').all();
  return NextResponse.json({ clubs });
}
