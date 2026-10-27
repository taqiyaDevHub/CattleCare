import mongoose from 'mongoose';

const DATE_FIELDS = ['dueDate', 'doneDate', 'sinceDate'];

const healthEventSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
    kind: { type: String, enum: ['vaccine', 'deworming', 'illness'], required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    vaccineId: { type: String, trim: true },
    dueDate: { type: Date },
    doneDate: { type: Date },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
    sinceDate: { type: Date },
    urgency: { type: String, enum: ['watch', 'see_vet_today', 'emergency'] },
    symptoms: { type: [String], default: [] },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

healthEventSchema.index({ owner: 1, animal: 1, status: 1 });
healthEventSchema.index({ owner: 1, kind: 1, status: 1, dueDate: 1 });

healthEventSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.owner;
    ret.animal = String(ret.animal);
    for (const f of DATE_FIELDS) {
      if (ret[f] instanceof Date) ret[f] = ret[f].toISOString().slice(0, 10);
    }
    return ret;
  },
});

export default mongoose.model('HealthEvent', healthEventSchema);
