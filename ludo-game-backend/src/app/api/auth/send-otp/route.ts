import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateOTP, sendOTPEmail, storeOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, message: 'Valid email required' }, { status: 400 });
  }

  
  // Check if email already registered
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return NextResponse.json({ success: false, message: 'Email already registered. Please login.' }, { status: 400 });
  }

  const otp = generateOTP();
  storeOTP(email, otp);
  
  const sent = await sendOTPEmail(email, otp);
  
  if (sent) {
    return NextResponse.json({ success: true, message: 'OTP sent to your email' });
  } else {
    return NextResponse.json({ success: false, message: 'Failed to send OTP. Check email config.' }, { status: 500 });
  }
}
