import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', default: null, index: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    category: {
      type: String,
      enum: ['feed', 'medicine', 'vet_fee', 'labour', 'other', 'animal_sale'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

transactionSchema.index({ owner: 1, date: -1 });
transactionSchema.index({ owner: 1, animal: 1, date: -1 });
transactionSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    ret.animalId = ret.animal ? ret.animal.toString() : null;
    delete ret._id;
    delete ret.__v;
    delete ret.owner;
    delete ret.animal;
    return ret;
  },
});

export default mongoose.model('Transaction', transactionSchema);
