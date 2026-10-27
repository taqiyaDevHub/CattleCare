
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Plus, Trash2, WalletCards, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getAnimals } from '../api/animals';
import { createTransaction, deleteTransaction, getProfitLoss, getTransactions } from '../api/money';
import EmptyState from '../components/EmptyState';

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayISO().slice(0, 7);
const money = (value) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function Money() {
  const { t } = useTranslation();
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    type: 'expense',
    category: 'feed',
    expenseAmount: '',
    incomeAmount: '',
    date: todayISO(),
    animalId: '',
    note: ''
  });

  const categories = useMemo(() => form.type === 'expense'
    ? [['feed', t('money.categories.feed')], ['medicine', t('money.categories.medicine')], ['vet_fee', t('money.categories.vetFee')], ['labour', t('money.categories.labour')], ['other', t('money.categories.other')]]
    : [['animal_sale', t('money.categories.animalSale')], ['other', t('money.categories.other')]], [form.type, t]);

  async function load() {
    setLoading(true);
    try {
      const [nextReport, nextTransactions, nextAnimals] = await Promise.all([
        getProfitLoss(month), getTransactions({ month }), getAnimals({ status: 'active' }),
      ]);
      setReport(nextReport);
      setTransactions(nextTransactions);
      setAnimals(nextAnimals);
    } catch (error) {
      toast.error(error.message || t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [month]);
  useEffect(() => {
    if (!categories.some(([value]) => value === form.category)) {
      setForm((old) => ({ ...old, category: categories[0][0] }));
    }
  }, [categories, form.category]);

  async function submit(event) {
    event.preventDefault();

    const amount = Number(
      form.type === 'expense' ? form.expenseAmount : form.incomeAmount
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('money.amountError'));
      return;
    }

    setSaving(true);
    try {
      await createTransaction({
        type: form.type,
        category: form.category,
        amount,
        date: form.date,
        ...(form.animalId ? { animalId: form.animalId } : {}),
        ...(form.note.trim() ? { note: form.note.trim() } : {})
      });

      toast.success(t('money.saved'));

      setForm((old) => ({
        ...old,
        expenseAmount: '',
        incomeAmount: '',
        note: '',
        date: todayISO(),
        animalId: ''
      }));

      setShowForm(false);
      await load();
    } catch (error) {
      toast.error(error.message || t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm(t('money.confirmDelete'))) return;
    try {
      await deleteTransaction(id);
      toast.success(t('money.deleted'));
      await load();
    } catch (error) {
      toast.error(error.message || t('common.deleteFailed'));
    }
  }

  const totals = report?.totals || { income: 0, expense: 0, profit: 0 };
  const lossAnimals = (report?.animals || []).filter((animal) => animal.status === 'active' && !animal.archivedAt && animal.profit < 0);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">{t('money.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-earth">{t('money.title')}</h1>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="btn-primary !w-auto px-4">
          <Plus className="h-5 w-5" /> {t('money.addRecord')}
        </button>
      </header>

      <label className="block">
        <span className="label">{t('money.selectMonth')}</span>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-earth" />
          <input className="input pl-10" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </div>
      </label>

      {showForm && <form onSubmit={submit} className="card space-y-3">
        <h2 className="text-lg font-bold text-earth">{t('money.newRecord')}</h2>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setForm((old) => ({ ...old, type: 'expense', category: 'feed' }))} className={`min-h-12 rounded-xl border font-semibold ${form.type === 'expense' ? 'border-brand bg-green-50 text-brand' : 'border-stone-200 bg-white'}`}>
            <ArrowDownLeft className="mr-1 inline h-4 w-4" />{t('money.expense')}
          </button>
          <button type="button" onClick={() => setForm((old) => ({ ...old, type: 'income', category: 'animal_sale' }))} className={`min-h-12 rounded-xl border font-semibold ${form.type === 'income' ? 'border-brand bg-green-50 text-brand' : 'border-stone-200 bg-white'}`}>
            <ArrowUpRight className="mr-1 inline h-4 w-4" />{t('money.income')}
          </button>
        </div>

        <label className="block">
          <span className="label">{t('money.category')}</span>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="label">{t('money.amount')}</span>
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.type === 'expense' ? form.expenseAmount : form.incomeAmount}
            onChange={(e) => setForm((old) => ({
              ...old,
              [old.type === 'expense' ? 'expenseAmount' : 'incomeAmount']: e.target.value
            }))}
            placeholder={t('money.amountPlaceholder')}
          />
        </label>

        <label className="block">
          <span className="label">{t('money.date')}</span>
          <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>

        <label className="block">
          <span className="label">{t('money.animalOptional')}</span>
          <select className="input" value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })}>
            <option value="">{t('money.sharedExpense')}</option>
            {animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.tag} · {animal.name}</option>)}
          </select>
          <span className="mt-1 block text-xs text-stone-500">{t('money.sharedHelp')}</span>
        </label>

        <label className="block">
          <span className="label">{t('money.noteOptional')}</span>
          <input className="input" maxLength="300" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={t('money.notePlaceholder')} />
        </label>

        <div className="flex gap-2">
          <button className="btn-primary" disabled={saving}>{saving ? t('money.saving') : t('common.save')}</button>
          <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
        </div>
      </form>}

      <section className="grid grid-cols-3 gap-2">
        <div className="card !p-3">
          <TrendingUp className="h-5 w-5 text-brand" />
          <p className="mt-2 break-words text-base font-bold text-brand">{loading ? '—' : money(totals.income)}</p>
          <p className="text-xs text-stone-500">{t('money.income')}</p>
        </div>
        <div className="card !p-3">
          <TrendingDown className="h-5 w-5 text-accent" />
          <p className="mt-2 break-words text-base font-bold text-accent">{loading ? '—' : money(totals.expense)}</p>
          <p className="text-xs text-stone-500">{t('money.expense')}</p>
        </div>
        <div className="card !p-3">
          <PiggyBank className="h-5 w-5 text-earth" />
          <p className={`mt-2 break-words text-base font-bold ${totals.profit < 0 ? 'text-danger' : 'text-brand'}`}>{loading ? '—' : money(totals.profit)}</p>
          <p className="text-xs text-stone-500">{t('money.profit')}</p>
        </div>
      </section>

      <p className="text-xs text-stone-500">{t('money.milkIncomeNote')}</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-earth">{t('money.animalProfitLoss')}</h2>
        {loading ? <div className="card animate-pulse text-sm text-stone-400">{t('common.loading')}</div> : report?.animals?.length ? report.animals.map((animal) => (
          <div key={animal.animalId} className="card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-earth">{animal.name} <span className="text-xs font-normal text-stone-400">#{animal.tag}</span></p>
              <p className="text-xs text-stone-500">{t('money.income')}: {money(animal.income)} · {t('money.expense')}: {money(animal.expense)}</p>
            </div>
            <p className={`shrink-0 font-bold ${animal.profit < 0 ? 'text-danger' : 'text-brand'}`}>{money(animal.profit)}</p>
          </div>
        )) : <EmptyState icon={WalletCards} title={t('money.noAnimalData')} text={t('money.noAnimalDataHelp')} />}
      </section>

      {lossAnimals.length > 0 && <section className="card border-l-4 border-accent">
        <h2 className="font-bold text-earth">{t('money.animalsInLoss')}</h2>
        <div className="mt-3 space-y-2">
          {lossAnimals.map((animal) => (
            <div key={animal.animalId} className="flex justify-between gap-3 text-sm">
              <span>{animal.name}</span>
              <strong className="text-danger">{money(animal.profit)}</strong>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">{t('money.lossDisclaimer')}</p>
      </section>}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-earth">{t('money.records')}</h2>
        {loading ? <div className="card animate-pulse text-sm text-stone-400">{t('common.loading')}</div> : transactions.length ? transactions.map((tx) => (
          <div key={tx.id} className="card flex items-start gap-3">
            <div className={`rounded-xl p-2 ${tx.type === 'income' ? 'bg-green-50 text-brand' : 'bg-amber-50 text-accent'}`}>
              {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-earth">{t(`money.categories.${tx.category === 'vet_fee' ? 'vetFee' : tx.category === 'animal_sale' ? 'animalSale' : tx.category}`, { defaultValue: tx.category })}</p>
              <p className="text-xs text-stone-500">{tx.date}{tx.note ? ` · ${tx.note}` : ''}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${tx.type === 'income' ? 'text-brand' : 'text-stone-700'}`}>{tx.type === 'income' ? '+' : '−'}{money(tx.amount)}</p>
              <button onClick={() => remove(tx.id)} aria-label={t('money.deleteRecord')} className="mt-1 inline-flex min-h-8 items-center text-xs text-stone-400">
                <Trash2 className="mr-1 h-3 w-3" />{t('money.deleteRecord')}
              </button>
            </div>
          </div>
        )) : <EmptyState icon={WalletCards} title={t('money.noRecords')} text={t('money.noRecordsHelp')} />}
      </section>
    </div>
  );
}
