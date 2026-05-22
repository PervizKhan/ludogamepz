import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Club } from '@/models/Club';
import { User } from '@/models/User';

let initialized = false;

export async function GET() {
  if (initialized) return NextResponse.json({ message: 'Already initialized' });
  
  await connectDB();
  console.log('MongoDB connected');

  const clubCount = await Club.countDocuments();
  if (clubCount === 0) {
    await Club.insertMany([
      { name: 'Mumbai Club', code: 'mumbai', betAmount: 100, onlinePlayers: 156 },
      { name: 'Karachi Club', code: 'karachi', betAmount: 250, onlinePlayers: 323 },
      { name: 'Delhi Club', code: 'delhi', betAmount: 500, onlinePlayers: 89 },
      { name: 'Lahore Club', code: 'lahore', betAmount: 1000, onlinePlayers: 45 },
      { name: 'Bangalore Club', code: 'bangalore', betAmount: 50, onlinePlayers: 234 },
      { name: 'Dubai Club', code: 'dubai', betAmount: 2000, onlinePlayers: 12 },
    ]);
  }

  const house = await User.findOne({ username: 'House' });
  if (!house) await User.create({ username: 'House', balance: 0 });

  initialized = true;
  return NextResponse.json({ message: 'Initialized' });
}
