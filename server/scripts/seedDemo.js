import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Animal from '../src/models/Animal.js';
import Transaction from '../src/models/Transaction.js';

const DEMO_PHONE = process.env.SEED_DEMO_PHONE || '03000000000';
const DEMO_PIN = process.env.SEED_DEMO_PIN || '2468';
const roundDate = (date) => date.toISOString().slice(0, 10);
const daysAgo = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - days); return roundDate(d); };
const daysFromNow = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return roundDate(d); };
const monthFor = (monthsAgo) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - monthsAgo); return d.toISOString().slice(0, 7); };
const dateForMonth = (month, day) => `${month}-${String(day).padStart(2, '0')}`;
const optionalModel = async (relativePath) => {
  try { const mod = await import(relativePath); return mod.default ?? mod[Object.keys(mod).find((key) => key.endsWith('Event') || key.endsWith('Record') || key === 'Breeding')] ?? null; }
  catch (err) { if (err.code === 'ERR_MODULE_NOT_FOUND') return null; throw err; }
};

async function main() {
  await connectDB();
  const existing = await User.findOne({ phone: DEMO_PHONE });
  if (existing) {
    console.log(`A user with demo phone ${DEMO_PHONE} already exists. No data was changed. Choose another SEED_DEMO_PHONE if you want a separate demo account.`);
    return;
  }

  const user = await User.create({ name: 'Demo Farmer', phone: DEMO_PHONE, pinHash: await bcrypt.hash(DEMO_PIN, 10), milkRatePerLitre: 180 });
  const animalSpecs = [
    ['C-001', 'Gulabo', 'cow', 'female', 48, 'milking'],
    ['C-002', 'Chandni', 'cow', 'female', 30, 'milking'],
    ['C-003', 'Rani', 'cow', 'female', 8, 'none'],
    ['B-001', 'Moti', 'buffalo', 'female', 60, 'milking'],
    ['B-002', 'Sona', 'buffalo', 'female', 42, 'dry'],
    ['B-003', 'Badal', 'buffalo', 'male', 24, 'none'],
    ['G-001', 'Choti', 'goat', 'female', 18, 'none'],
    ['G-002', 'Noori', 'goat', 'female', 14, 'none'],
    ['G-003', 'Kalu', 'goat', 'male', 12, 'none'],
    ['C-004', 'Mehak', 'cow', 'female', 36, 'dry'],
  ];
  const animals = await Animal.insertMany(animalSpecs.map(([tag, name, type, gender, ageMonths, milkingStatus], index) => ({
    owner: user._id, tag, name, type, gender, ageMonths,
    dob: new Date(Date.now() - ageMonths * 30.4375 * 86400000),
    weightKg: type === 'goat' ? 35 + index * 2 : type === 'cow' ? 280 + index * 13 : 420 + index * 10,
    purchaseDate: daysAgo(180 + index * 17), purchasePrice: type === 'goat' ? 18000 + index * 1500 : type === 'cow' ? 180000 + index * 15000 : 250000 + index * 18000,
    status: 'active', milkingStatus,
    ...(index === 1 ? { lastCalvingDate: daysAgo(80) } : {}),
  })));
  const byTag = Object.fromEntries(animals.map((animal) => [animal.tag, animal]));

  const MilkRecord = await optionalModel('../src/models/MilkRecord.js');
  if (MilkRecord) {
    const rows = [];
    for (let day = 29; day >= 0; day--) {
      const date = daysAgo(day);
      for (const [tag, baseMorning, baseEvening] of [['C-001', 7.5, 6.8], ['C-002', 6.2, 5.7], ['B-001', 5.8, 5.2]]) {
        const isDropCow = tag === 'C-001' && day < 5;
        const factor = isDropCow ? 0.58 : 1;
        const variation = ((day % 5) - 2) * 0.12;
        rows.push({ owner: user._id, animal: byTag[tag]._id, date, morningL: Math.max(0, Number((baseMorning * factor + variation).toFixed(1))), eveningL: Math.max(0, Number((baseEvening * factor + variation).toFixed(1))) });
      }
    }
    await MilkRecord.insertMany(rows, { ordered: false });
    console.log(`Seeded ${rows.length} milk records.`);
  } else console.log('MilkRecord model not present yet; milk demo data was skipped until Member 3 merges it.');

  const HealthEvent = await optionalModel('../src/models/HealthEvent.js');
  if (HealthEvent) {
    const healthRows = [
      { animal: byTag['C-001'], name: 'FMD booster', dueDate: daysAgo(4), status: 'pending' },
      { animal: byTag['B-001'], name: 'HS vaccine', dueDate: daysFromNow(2), status: 'pending' },
      { animal: byTag['C-002'], name: 'Deworming', dueDate: daysFromNow(12), status: 'pending' },
      { animal: byTag['G-001'], name: 'PPR vaccine', dueDate: daysAgo(40), doneDate: daysAgo(39), status: 'done' },
      { animal: byTag['C-004'], name: 'Anthrax vaccine', dueDate: daysFromNow(5), status: 'pending' },
    ].map((event) => ({ owner: user._id, animal: event.animal._id, kind: 'vaccine', name: event.name, dueDate: event.dueDate, ...(event.doneDate ? { doneDate: event.doneDate } : {}), status: event.status }));
    await HealthEvent.insertMany(healthRows);
    console.log(`Seeded ${healthRows.length} health events.`);
  } else console.log('HealthEvent model not present yet; vaccine demo data was skipped until Member 2 merges it.');

  const Breeding = await optionalModel('../src/models/Breeding.js');
  if (Breeding) {
    const delivery = daysFromNow(7);
    const breedingDate = roundDate(new Date(new Date(`${delivery}T00:00:00.000Z`).getTime() - 283 * 86400000));
    await Breeding.create({ owner: user._id, animal: byTag['C-002']._id, breedingDate, method: 'AI', expectedDelivery: delivery, dryPeriodStart: daysAgo(53), heatCheckDate: daysAgo(255), pregnancyCheckDate: daysAgo(216), status: 'confirmed' });
    console.log('Seeded one confirmed pregnancy with delivery due soon.');
  } else console.log('Breeding model not present yet; breeding demo data was skipped until Member 3 merges it.');

  const expenseRows = [];
  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const month = monthFor(monthsAgo);
    expenseRows.push(
      { owner: user._id, type: 'expense', category: 'feed', amount: 18000 + monthsAgo * 1200, date: dateForMonth(month, 3), note: 'Shared monthly feed' },
      { owner: user._id, type: 'expense', category: 'labour', amount: 9000, date: dateForMonth(month, 8), note: 'Farm labour' },
      { owner: user._id, animal: byTag['C-001']._id, type: 'expense', category: 'medicine', amount: 1800 + monthsAgo * 150, date: dateForMonth(month, 12), note: 'Animal-specific supplies' },
      { owner: user._id, animal: byTag['B-001']._id, type: 'expense', category: 'vet_fee', amount: 2500, date: dateForMonth(month, 17), note: 'Vet visit' },
      { owner: user._id, type: 'expense', category: 'feed', amount: 6500, date: dateForMonth(month, 23), note: 'Additional shared feed' },
    );
  }
  expenseRows.push({ owner: user._id, type: 'income', category: 'other', amount: 3500, date: daysAgo(10), note: 'Other farm income' });
  await Transaction.insertMany(expenseRows);

  console.log('\nDemo seed completed.');
  console.log(`Demo phone: ${DEMO_PHONE}`);
  console.log(`Demo PIN: ${DEMO_PIN}`);
  console.log('Use this account only in your development/demo database. Do not use the default demo PIN in production.');
}

main().catch((err) => { console.error('Demo seed failed:', err); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect().catch(() => {}); });
