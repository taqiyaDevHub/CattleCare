import mongoose from 'mongoose';

const breedingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
  breedingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  method: { type: String, enum: ['natural', 'AI'], default: 'natural' },
  expectedDelivery: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  dryPeriodStart: { type: String, default: null },
  heatCheckDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  pregnancyCheckDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ['pending', 'confirmed', 'not_pregnant', 'delivered', 'aborted'], default: 'pending' },
  deliveryDate: { type: String, default: null },
}, { timestamps: true });

breedingSchema.set('toJSON', { transform(doc, ret) {
  ret.id = ret._id.toString(); delete ret._id; delete ret.__v; delete ret.owner;
  return ret;
} });

export default mongoose.model('Breeding', breedingSchema);
