import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  betAmount: { type: Number, required: true },
  onlinePlayers: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Club = mongoose.models.Club || mongoose.model('Club', ClubSchema);
