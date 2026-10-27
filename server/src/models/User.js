import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    pinHash: { type: String, required: true },
    milkRatePerLitre: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);