import mongoose from 'mongoose';

const milkRecordSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  morningL: { type: Number, required: true, min: 0, max: 1000 },
  eveningL: { type: Number, required: true, min: 0, max: 1000 },
}, { timestamps: true });

milkRecordSchema.index({ owner: 1, animal: 1, date: 1 }, { unique: true });

milkRecordSchema.set('toJSON', { transform(doc, ret) {
  ret.id = ret._id.toString(); delete ret._id; delete ret.__v; delete ret.owner;
  return ret;
} });

export default mongoose.model('MilkRecord', milkRecordSchema);
