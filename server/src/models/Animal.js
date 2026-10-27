import mongoose from 'mongoose';

const DATE_FIELDS = ['dob', 'purchaseDate', 'lastCalvingDate', 'soldDate'];

const animalSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tag: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['cow', 'buffalo', 'goat'], required: true },
    gender: { type: String, enum: ['female', 'male'], required: true },
    ageMonths: { type: Number, required: true, min: 0 },
    dob: { type: Date },
    weightKg: { type: Number, min: 0 },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    status: { type: String, enum: ['active', 'sold', 'dead'], default: 'active' },
    milkingStatus: { type: String, enum: ['milking', 'dry', 'none'], default: 'none' },
    lastCalvingDate: { type: Date },
    soldDate: { type: Date },
    soldPrice: { type: Number, min: 0 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

animalSchema.index({ owner: 1, tag: 1 }, { unique: true });

animalSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.owner;
    for (const f of DATE_FIELDS) {
      if (ret[f] instanceof Date) ret[f] = ret[f].toISOString().slice(0, 10);
    }
    return ret;
  },
});

export default mongoose.model('Animal', animalSchema);