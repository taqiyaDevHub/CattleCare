import Animal from '../models/Animal.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const monthNow = () => new Date().toISOString().slice(0, 7);
const monthBounds = (month) => ({ start: `${month}-01`, end: `${month}-31` });
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

async function getMilkModel() {
  try {
    const mod = await import('../models/MilkRecord.js');
    return mod.default ?? mod.MilkRecord ?? null;
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw err;
  }
}

/**
 * Returns a month-level profit/loss report. Milk income is calculated from
 * recorded litres × the farmer's milk rate; it is never stored as a transaction.
 * Expenses without an animal are shared equally across currently active animals.
 */
export async function getMonthProfit(ownerId, month = monthNow()) {
  const { start, end } = monthBounds(month);
  const [user, animals, transactions, MilkRecord] = await Promise.all([
    User.findById(ownerId).select('milkRatePerLitre').lean(),
    Animal.find({ owner: ownerId }).select('name tag type status milkingStatus archivedAt').lean(),
    Transaction.find({ owner: ownerId, date: { $gte: start, $lte: end } }).lean(),
    getMilkModel(),
  ]);

  let milkRows = [];
  if (MilkRecord) {
    milkRows = await MilkRecord.find({ owner: ownerId, date: { $gte: start, $lte: end } })
      .select('animal morningL eveningL date')
      .lean();
  }

  const rate = Number(user?.milkRatePerLitre || 0);
  const perAnimal = new Map(animals.map((animal) => [String(animal._id), {
    animalId: String(animal._id), name: animal.name, tag: animal.tag, status: animal.status, archivedAt: animal.archivedAt,
    income: 0, directExpense: 0, sharedExpense: 0, profit: 0, milkLitres: 0,
  }]));
  let milkIncome = 0;
  for (const row of milkRows) {
    const litres = Number(row.morningL || 0) + Number(row.eveningL || 0);
    const income = litres * rate;
    milkIncome += income;
    const item = perAnimal.get(String(row.animal));
    if (item) { item.milkLitres += litres; item.income += income; }
  }

  let transactionIncome = 0;
  let directExpense = 0;
  let sharedExpense = 0;
  for (const tx of transactions) {
    const amount = Number(tx.amount || 0);
    if (tx.type === 'income') {
      transactionIncome += amount;
      const item = tx.animal ? perAnimal.get(String(tx.animal)) : null;
      if (item) item.income += amount;
    } else if (tx.animal) {
      directExpense += amount;
      const item = perAnimal.get(String(tx.animal));
      if (item) item.directExpense += amount;
    } else {
      sharedExpense += amount;
    }
  }

  const activeAnimals = [...perAnimal.values()].filter((animal) => animal.status === 'active' && !animal.archivedAt);
  if (activeAnimals.length) {
    const share = sharedExpense / activeAnimals.length;
    for (const animal of activeAnimals) animal.sharedExpense += share;
  }

  for (const animal of perAnimal.values()) {
    animal.income = roundMoney(animal.income);
    animal.directExpense = roundMoney(animal.directExpense);
    animal.sharedExpense = roundMoney(animal.sharedExpense);
    animal.milkLitres = roundMoney(animal.milkLitres);
    animal.expense = roundMoney(animal.directExpense + animal.sharedExpense);
    animal.profit = roundMoney(animal.income - animal.expense);
  }

  const income = roundMoney(milkIncome + transactionIncome);
  const expense = roundMoney(directExpense + sharedExpense);
  return {
    month,
    totals: { income, expense, profit: roundMoney(income - expense), milkIncome: roundMoney(milkIncome), otherIncome: roundMoney(transactionIncome) },
    animals: [...perAnimal.values()].sort((a, b) => a.profit - b.profit),
    notes: {
      sharedExpenseRule: 'Expenses without an animal are split equally across active animals.',
      purchasePriceExcluded: true,
      milkRatePerLitre: rate,
    },
  };
}

export { monthNow };
