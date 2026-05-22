import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.Mixed },
  playerAId: { type: mongoose.Schema.Types.Mixed },
  playerBId: { type: mongoose.Schema.Types.Mixed },
  playerAName: { type: String },
  playerBName: { type: String },
  playerARolls: { type: [Number], default: [] },
  playerBRolls: { type: [Number], default: [] },
  playerATotal: { type: Number, default: 0 },
  playerBTotal: { type: Number, default: 0 },
  currentTurn: { type: String, default: 'A' },
  winnerId: { type: mongoose.Schema.Types.Mixed },
  betAmount: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'playing', 'completed', 'cancelled'] },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);
