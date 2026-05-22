import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  if (!username || !password) return NextResponse.json({ success: false, message: 'Required fields missing' }, { status: 400 });

  const user = await User.findOne({ username: username.trim(), password });
  if (!user) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });

  return NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email, balance: user.balance } });
}
