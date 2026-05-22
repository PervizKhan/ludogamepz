import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Club } from '@/models/Club';

export async function GET() {
  await connectDB();
  const clubs = await Club.find({}).sort({ betAmount: 1 });
  return NextResponse.json({ clubs: clubs.map(c => ({ id: c._id, name: c.name, code: c.code, bet_amount: c.betAmount, online_players: c.onlinePlayers })) });
}
