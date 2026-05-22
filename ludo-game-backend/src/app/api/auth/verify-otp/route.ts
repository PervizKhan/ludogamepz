import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { verifyOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  const { email, otp, username, password } = await request.json();
  if (!email || !otp || !username || !password) {
    return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
  }

  const valid = verifyOTP(email, otp);
  if (!valid) return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });

  const lastUser = await User.findOne().sort({ id: -1 });
  const newId = (lastUser?.id || 0) + 1;

  const user = await User.create({ 
    id: newId, 
    username: username.trim(), 
    email: email.trim(), 
    password, 
    balance: 500 
  });

  return NextResponse.json({ 
    success: true, 
    user: { id: user.id, username: user.username, email: user.email, balance: user.balance } 
  });
}
