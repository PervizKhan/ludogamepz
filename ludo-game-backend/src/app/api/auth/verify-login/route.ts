import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  await connectDB();
  const { email, otp } = await request.json();
  if (!email || !otp) return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
  if (!verifyOTP(email, otp)) return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  return NextResponse.json({ success: true, user: { id: user.id || user._id, username: user.username, balance: user.balance } });
}
