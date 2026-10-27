import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Droplets, RefreshCw, Save, Sprout, Baby, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAnimals } from '../api/animals';
import { getMilkRecords, saveMilkRecords, getMilkAlerts } from '../api/milk';
import { getBreedingRecords, createBreedingRecord, getBreedingAlerts, updateBreedingOutcome } from '../api/breeding';
import { useAuth } from '../context/AuthContext';

const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString() : '—';
const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Pregnancy confirmed', not_pregnant: 'Not pregnant', delivered: 'Delivered', aborted: 'Aborted',
};

export default function Milk() {
  const { user } = useAuth();
  const [tab, setTab] = useState('milk');
  const [date, setDate] = useState(localDate());
  const [milkRows, setMilkRows] = useState([]);
  const [milkAlerts, setMilkAlerts] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [breedingRows, setBreedingRows] = useState([]);
  const [breedingAlerts, setBreedingAlerts] = useState([]);
  const [breedingForm, setBreedingForm] = useState({ animalId: '', breedingDate: localDate(), method: 'natural' });
  const [outcomes, setOutcomes] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingMilk, setSavingMilk] = useState(false);
  const [savingBreeding, setSavingBreeding] = useState(false);

  async function loadMilk(nextDate = date) {
    const [rows, alerts] = await Promise.all([getMilkRecords(nextDate), getMilkAlerts()]);
    setMilkRows((rows || []).map((row) => ({ ...row, morningL: String(row.morningL ?? 0), eveningL: String(row.eveningL ?? 0) })));
    setMilkAlerts(Array.isArray(alerts) ? alerts : []);
  }
  async function loadBreeding() {
    const [rows, alerts] = await Promise.all([getBreedingRecords(), getBreedingAlerts()]);
    setBreedingRows(Array.isArray(rows) ? rows : []);
    setBreedingAlerts(Array.isArray(alerts) ? alerts : []);
    setOutcomes(Object.fromEntries((rows || []).map((row) => [row.id, {
      status: row.status || 'pending', deliveryDate: row.deliveryDate || localDate(),
    }])));
  }
  async function loadAll() {
    setLoading(true);
    try {
      const allAnimals = await getAnimals({});
      setAnimals(Array.isArray(allAnimals) ? allAnimals : []);
      await Promise.all([loadMilk(date), loadBreeding()]);
    } catch (error) {
      toast.error(error.message || 'Could not load milk and breeding data.');
    } finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); // Initial load only; date changes use the dedicated effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loading) loadMilk(date).catch((error) => toast.error(error.message || 'Could not load milk records.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const totalMorning = useMemo(() => milkRows.reduce((sum, row) => sum + (Number(row.morningL) || 0), 0), [milkRows]);
  const totalEvening = useMemo(() => milkRows.reduce((sum, row) => sum + (Number(row.eveningL) || 0), 0), [milkRows]);
  const totalLitres = totalMorning + totalEvening;
  const milkRate = Number(user?.milkRatePerLitre ?? 0);
  const estimatedIncome = totalLitres * milkRate;
  const formatCurrency = (amount) => new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(amount);
  const femaleAnimals = animals.filter((animal) => animal.gender === 'female' && animal.status === 'active');

  function editMilk(animalId, field, value) {
    setMilkRows((rows) => rows.map((row) => row.animalId === animalId ? { ...row, [field]: value } : row));
  }
  async function handleSaveMilk(event) {
    event.preventDefault();
    if (!milkRows.length) { toast.error('No active milking animals found. Add an animal and set its status to Milking first.'); return; }
    const entries = milkRows.map((row) => ({
      animalId: row.animalId,
      morningL: Number(row.morningL),
      eveningL: Number(row.eveningL),
    }));
    if (entries.some((row) => !Number.isFinite(row.morningL) || !Number.isFinite(row.eveningL) || row.morningL < 0 || row.eveningL < 0)) {
      toast.error('Enter valid non-negative litres for every animal.'); return;
    }
    setSavingMilk(true);
    try {
      await saveMilkRecords({ date, entries });
      await loadMilk(date);
      toast.success('Milk records saved.');
    } catch (error) { toast.error(error.message || 'Could not save milk records.'); }
    finally { setSavingMilk(false); }
  }
  async function handleCreateBreeding(event) {
    event.preventDefault();
    if (!breedingForm.animalId) { toast.error('Choose a female animal.'); return; }
    setSavingBreeding(true);
    try {
      await createBreedingRecord(breedingForm);
      setBreedingForm({ animalId: '', breedingDate: localDate(), method: 'natural' });
      await loadBreeding();
      toast.success('Breeding record added.');
    } catch (error) { toast.error(error.message || 'Could not create breeding record.'); }
    finally { setSavingBreeding(false); }
  }
  async function handleOutcome(id) {
    const outcome = outcomes[id] || { status: 'pending', deliveryDate: '' };
    const body = { status: outcome.status, addCalf: false };
    if (outcome.status === 'delivered') {
      if (!outcome.deliveryDate) { toast.error('Choose the delivery date first.'); return; }
      body.deliveryDate = outcome.deliveryDate;
    }
    try {
      const result = await updateBreedingOutcome(id, body);
      await loadBreeding();
      toast.success(result?.addCalfOffered ? 'Delivery recorded. You can add the calf from Animals.' : 'Breeding outcome updated.');
    } catch (error) { toast.error(error.message || 'Could not update breeding outcome.'); }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-brand p-5 text-white shadow-sm">
        <div className="flex items-center gap-3"><Droplets className="h-8 w-8" /><div><p className="text-sm text-green-100">CattleCare records</p><h1 className="text-2xl font-bold">Milk & Breeding</h1></div></div>
        <p className="mt-2 text-sm text-green-100">Record daily milk production and keep track of breeding dates.</p>
      </section>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
        <button type="button" onClick={() => setTab('milk')} className={`min-h-12 rounded-xl px-3 text-sm font-semibold ${tab === 'milk' ? 'bg-white text-earth shadow-sm' : 'text-stone-600'}`}><Droplets className="mr-1 inline h-4 w-4" /> Milk records</button>
        <button type="button" onClick={() => setTab('breeding')} className={`min-h-12 rounded-xl px-3 text-sm font-semibold ${tab === 'breeding' ? 'bg-white text-earth shadow-sm' : 'text-stone-600'}`}><Baby className="mr-1 inline h-4 w-4" /> Breeding</button>
      </div>

      {loading ? <div className="card animate-pulse text-sm text-stone-500">Loading records…</div> : null}

      {!loading && tab === 'milk' && <>
        <div className="grid grid-cols-2 gap-3">
          <div className="card"><p className="text-sm text-stone-500">Morning total</p><p className="mt-1 text-2xl font-bold text-earth">{totalMorning.toFixed(1)} L</p></div>
          <div className="card"><p className="text-sm text-stone-500">Evening total</p><p className="mt-1 text-2xl font-bold text-earth">{totalEvening.toFixed(1)} L</p></div>
        </div>
        <section className="card">
          <p className="text-sm text-stone-500">Estimated milk income</p>
          <p className="mt-1 text-2xl font-bold text-earth">{formatCurrency(estimatedIncome)}</p>
          <p className="mt-1 text-sm text-stone-500">
            {totalLitres.toFixed(1)} L × {formatCurrency(milkRate)} per litre for {date}
          </p>
        </section>
        <section className="card space-y-3">
          <label className="block text-sm font-medium text-stone-700">Recording date
            <span className="mt-1 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-earth" /><input className="field flex-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></span>
          </label>
          {milkRows.length === 0 ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No active animals are marked as milking. Open an animal's profile and set Milking status to “milking” first.</p> : <form onSubmit={handleSaveMilk} className="space-y-3">
            {milkRows.map((row) => <div key={row.animalId} className="rounded-2xl border border-stone-100 p-3">
              <div className="mb-3 flex items-start justify-between gap-2"><div><p className="font-semibold text-stone-800">{row.name}</p><p className="text-xs text-stone-500">Tag: {row.tag}</p></div><span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">{(Number(row.morningL || 0) + Number(row.eveningL || 0)).toFixed(1)} L total</span></div>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm text-stone-600">Morning (L)<input className="field mt-1" type="number" min="0" max="1000" step="0.1" required value={row.morningL} onChange={(e) => editMilk(row.animalId, 'morningL', e.target.value)} /></label><label className="text-sm text-stone-600">Evening (L)<input className="field mt-1" type="number" min="0" max="1000" step="0.1" required value={row.eveningL} onChange={(e) => editMilk(row.animalId, 'eveningL', e.target.value)} /></label></div>
            </div>)}
            <button className="btn-primary w-full" type="submit" disabled={savingMilk}><Save className="h-5 w-5" />{savingMilk ? 'Saving…' : 'Save milk records'}</button>
          </form>}
        </section>
        {milkAlerts.length > 0 && <section className="space-y-2"><h2 className="font-bold text-earth">Milk alerts</h2>{milkAlerts.map((alert, index) => <div key={`${alert.animalId || 'animal'}-${index}`} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><AlertTriangle className="h-5 w-5 shrink-0" /><div><p className="font-semibold">{alert.animalName || 'Animal'}{alert.dropPercent != null ? ` · ${Math.round(alert.dropPercent)}% drop` : ''}</p><p>{alert.message || 'Milk production is lower than usual. Check feed, heat and animal health.'}</p></div></div>)}</section>}
      </>}

      {!loading && tab === 'breeding' && <>
        <section className="card space-y-3"><h2 className="text-lg font-bold text-earth"><Sprout className="mr-2 inline h-5 w-5" />Add breeding record</h2><form onSubmit={handleCreateBreeding} className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">Female animal<select className="field mt-1" required value={breedingForm.animalId} onChange={(e) => setBreedingForm((f) => ({ ...f, animalId: e.target.value }))}><option value="">Choose animal</option>{femaleAnimals.map((animal) => <option key={animal.id} value={animal.id}>{animal.name} · {animal.tag} ({animal.type})</option>)}</select></label>
          <label className="block text-sm font-medium text-stone-700">Breeding date<input className="field mt-1" type="date" required value={breedingForm.breedingDate} onChange={(e) => setBreedingForm((f) => ({ ...f, breedingDate: e.target.value }))} /></label>
          <label className="block text-sm font-medium text-stone-700">Method<select className="field mt-1" value={breedingForm.method} onChange={(e) => setBreedingForm((f) => ({ ...f, method: e.target.value }))}><option value="natural">Natural</option><option value="AI">Artificial insemination (AI)</option></select></label>
          <button className="btn-primary w-full" type="submit" disabled={savingBreeding || femaleAnimals.length === 0}><Sprout className="h-5 w-5" />{savingBreeding ? 'Saving…' : 'Add breeding record'}</button>
          {femaleAnimals.length === 0 && <p className="text-sm text-stone-500">Add an active female animal before recording breeding.</p>}
        </form></section>
        {breedingAlerts.length > 0 && <section className="space-y-2"><h2 className="font-bold text-earth">Upcoming checks</h2>{breedingAlerts.map((alert, index) => <div key={`${alert.animalId || 'animal'}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"><p className="font-semibold">{alert.animalName || 'Animal'}</p><p>{String(alert.type || 'Breeding check').replaceAll('_', ' ')} · {dateLabel(alert.date)}</p></div>)}</section>}
        <section className="space-y-3"><h2 className="text-lg font-bold text-earth">Breeding history</h2>
          {breedingRows.length === 0 ? <div className="card text-sm text-stone-500">No breeding records yet.</div> : breedingRows.map((row) => { const outcome = outcomes[row.id] || { status: row.status || 'pending', deliveryDate: row.deliveryDate || localDate() }; return <article key={row.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-stone-800">{row.animal?.name || 'Animal'} <span className="text-xs font-normal text-stone-500">{row.animal?.tag ? `· ${row.animal.tag}` : ''}</span></h3><p className="text-sm text-stone-500">Breeding: {dateLabel(row.breedingDate)} · {row.method === 'AI' ? 'Artificial insemination' : 'Natural'}</p><p className="mt-1 text-sm text-stone-600">Expected delivery: <strong>{dateLabel(row.expectedDelivery)}</strong></p><p className="text-xs text-stone-500">Pregnancy check: {dateLabel(row.pregnancyCheckDate)} · Heat check: {dateLabel(row.heatCheckDate)}</p></div><span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold">{STATUS_LABELS[row.status] || row.status}</span></div>
            <label className="block text-sm text-stone-600">Update outcome<select className="field mt-1" value={outcome.status} onChange={(e) => setOutcomes((current) => ({ ...current, [row.id]: { ...outcome, status: e.target.value } }))}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {outcome.status === 'delivered' && <label className="block text-sm text-stone-600">Delivery date<input className="field mt-1" type="date" value={outcome.deliveryDate || ''} onChange={(e) => setOutcomes((current) => ({ ...current, [row.id]: { ...outcome, deliveryDate: e.target.value } }))} /></label>}
            <button className="btn-secondary w-full" type="button" onClick={() => handleOutcome(row.id)}><Check className="h-4 w-4" />Save outcome</button>
          </article>; })}
        </section>
      </>}

      <button type="button" onClick={loadAll} className="btn-secondary w-full"><RefreshCw className="h-4 w-4" /> Refresh records</button>
    </div>
  );
}
