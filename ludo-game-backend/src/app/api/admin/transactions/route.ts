import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { Transaction } from '@/models/Transaction';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(100);
  const withUsernames = await Promise.all(transactions.map(async t => {
    const user = await User.findOne({ id: t.userId });
    return { ...t.toObject(), username: user?.username || 'Unknown' };
  }));

  return NextResponse.json({ transactions: withUsernames });
}
