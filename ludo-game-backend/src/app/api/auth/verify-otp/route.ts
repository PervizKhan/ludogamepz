import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  await connectDB();
  const { email, otp, username, password } = await request.json();
  if (!email || !otp || !username || !password) return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
  if (!verifyOTP(email, otp)) return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });

  const lastUser = await User.findOne().sort({ id: -1 });
  const newId = (lastUser?.id || 0) + 1;
  const user = await User.create({ id: newId, username: username.trim(), email: email.trim(), password, balance: 500 });
  return NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email, balance: user.balance } });
}
