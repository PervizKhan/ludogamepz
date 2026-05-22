import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { verifyOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  const { email, otp } = await request.json();
  if (!email || !otp) return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });

  const valid = verifyOTP(email, otp);
  if (!valid) return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  return NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email, balance: user.balance } });
}
