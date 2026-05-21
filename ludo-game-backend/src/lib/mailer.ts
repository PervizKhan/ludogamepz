import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-game-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

// Store OTPs temporarily (in production use Redis)
const otpStore: Map<string, { otp: string; expires: number }> = new Map();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Dice Duel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Dice Duel Verification Code',
      html: `
        <div style="font-family: Arial; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #FFD700; background: #1a1a2e; padding: 20px; text-align: center;">
            🎲 Dice Duel
          </h2>
          <div style="padding: 20px; background: #16213e; color: #fff;">
            <p>Your verification code is:</p>
            <h1 style="text-align: center; color: #FFD700; font-size: 40px; letter-spacing: 10px;">
              ${otp}
            </h1>
            <p style="color: #aaa;">This code expires in 5 minutes.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

export function storeOTP(email: string, otp: string): void {
  otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });
}

export function verifyOTP(email: string, otp: string): boolean {
  const stored = otpStore.get(email);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    return false;
  }
  if (stored.otp === otp) {
    otpStore.delete(email);
    return true;
  }
  return false;
}
