import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: mongoose.Schema.Types.Decimal128, required: true },
}, { timestamps: true });

export default mongoose.model('Wallet', walletSchema);
