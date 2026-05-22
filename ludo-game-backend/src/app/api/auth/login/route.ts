import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  await connectDB();
  const { username, password } = await request.json();
  const user = await User.findOne({ username: username.trim(), password });
  if (!user) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  return NextResponse.json({ success: true, user: { id: user.id || user._id, username: user.username, balance: user.balance } });
}
