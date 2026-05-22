import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
