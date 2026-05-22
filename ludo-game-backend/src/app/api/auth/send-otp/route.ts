import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { generateOTP, sendOTPEmail, storeOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, message: 'Valid email required' }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
  }

  const otp = generateOTP();
  storeOTP(email, otp);
  const sent = await sendOTPEmail(email, otp);
  
  return NextResponse.json({ success: sent, message: sent ? 'OTP sent' : 'Failed to send' });
}
