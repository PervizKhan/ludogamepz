import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  const { email, otp } = await request.json();

  if (!email || !otp) {
    return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
  }

  const valid = verifyOTP(email, otp);
  if (!valid) {
    return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
  }

  const user = db.prepare('SELECT id, username, email, balance FROM users WHERE email = ?').get(email) as any;

  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}
