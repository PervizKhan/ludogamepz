import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function findUser(userId: any) {
  if (!userId) return null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return await User.findById(userId);
  }
  return await User.findOne({ id: parseInt(userId) });
}
