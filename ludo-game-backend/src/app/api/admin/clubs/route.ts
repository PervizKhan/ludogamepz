import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const clubs = db.prepare(`
    SELECT c.*, COUNT(g.id) as total_games
    FROM clubs c
    LEFT JOIN games g ON c.id = g.club_id
    GROUP BY c.id
    ORDER BY c.bet_amount ASC
  `).all();

  return NextResponse.json({ clubs });
}

export async function POST(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const { name, code, bet_amount } = await request.json();
  
  db.prepare('INSERT INTO clubs (name, code, bet_amount) VALUES (?, ?, ?)')
    .run(name, code, bet_amount);

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const { id, name, bet_amount } = await request.json();
  
  db.prepare('UPDATE clubs SET name = ?, bet_amount = ? WHERE id = ?')
    .run(name, bet_amount, id);

  return NextResponse.json({ success: true });
}
