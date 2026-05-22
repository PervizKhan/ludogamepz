import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });

  let user;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId);
  }
  if (!user) {
    user = await User.findOne({ id: parseInt(userId) });
  }
  if (!user) {
    user = await User.findOne({ username: userId });
  }

  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  const transactions = await Transaction.find({ 
    $or: [{ userId: user.id?.toString() }, { userId: user._id?.toString() }] 
  }).sort({ createdAt: -1 }).limit(20);

  return NextResponse.json({ 
    success: true, 
    user: { id: user.id || user._id.toString(), username: user.username, balance: user.balance }, 
    transactions 
  });
}
