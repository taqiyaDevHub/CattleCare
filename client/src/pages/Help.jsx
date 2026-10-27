import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HeartPulse, PawPrint, CalendarDays, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAnimals } from '../api/animals';
import { getSymptomOptions, checkSymptoms } from '../api/health';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import SymptomResult from '../components/SymptomResult';

const SINCE_DAYS = [0, 1, 2, 3, 4, 5, 7, 14, 30];

function SignButton({ sign, checked, onToggle }) {
  const Box = checked ? CheckSquare : Square;
  return (
    <button
      type="button"
      aria-pressed={checked}
      data-key={sign.key}
      onClick={onToggle}
      className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${
        checked ? 'border-brand bg-green-50 text-brand' : 'border-stone-200 bg-white text-stone-700'
      }`}
    >
      <Box className="h-6 w-6 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{sign.label}</span>
      {sign.redFlag && <AlertTriangle className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />}
    </button>
  );
}

// Help page = symptom checker
export default function Help() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();

  const [animalId, setAnimalId] = useState(params.get('animal') || '');
  const [selected, setSelected] = useState([]);
  const [sinceDays, setSinceDays] = useState(0);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);

  const animalsQuery = useQuery({
    queryKey: ['animals', 'active'],
    queryFn: () => getAnimals({ status: 'active' }),
  });
  const optionsQuery = useQuery({
    queryKey: ['symptom-options'],
    queryFn: getSymptomOptions,
    staleTime: Infinity,
  });

  const animals = animalsQuery.data || [];
  const current = animals.find((a) => a.id === animalId) || animals[0];
  const signs = optionsQuery.data?.symptoms || [];

  const mutation = useMutation({
    mutationFn: () =>
      checkSymptoms({
        animalId: current.id,
        symptoms: selected,
        sinceDays: Number(sinceDays),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: (data) => {
      toast.success(t('symptoms.saved'));
      setResult({ ...data, animal: current, selectedKeys: selected });
      for (const key of ['illness', 'health-pending', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      window.scrollTo(0, 0);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggle = (key) =>
    setSelected((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  const reset = () => {
    setResult(null);
    setSelected([]);
    setSinceDays(0);
    setNotes('');
    window.scrollTo(0, 0);
  };

  if (result) {
    return (
      <SymptomResult
        result={result}
        animal={result.animal}
        selectedKeys={result.selectedKeys}
        onReset={reset}
      />
    );
  }

  if (animalsQuery.isLoading || optionsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12" /> <Skeleton className="h-24" /> <Skeleton className="h-48" />
      </div>
    );
  }

  if (animalsQuery.isError || optionsQuery.isError) {
    return (
      <EmptyState icon={HeartPulse} title={t('common.loadFailed')}>
        <button
          className="btn-secondary"
          onClick={() => {
            animalsQuery.refetch();
            optionsQuery.refetch();
          }}
        >
          {t('common.retry')}
        </button>
      </EmptyState>
    );
  }

  if (animals.length === 0) {
    return (
      <EmptyState icon={PawPrint} title={t('symptoms.noAnimalsTitle')} text={t('symptoms.noAnimalsText')}>
        <Link to="/animals/new" className="btn-primary">
          {t('symptoms.addAnimal')}
        </Link>
      </EmptyState>
    );
  }

  const warning = signs.filter((s) => s.redFlag);
  const other = signs.filter((s) => !s.redFlag);
  const canCheck = selected.length > 0 && !mutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-earth">{t('symptoms.title')}</h1>
        <p className="mt-1 text-sm text-stone-600">{t('symptoms.intro')}</p>
      </div>

      <Link to="/vaccines" className="btn-secondary">
        <CalendarDays className="h-5 w-5" />
        {t('vaccines.calendarTitle')}
      </Link>

      <div className="card space-y-4">
        <label className="block">
          <span className="label">{t('symptoms.chooseAnimal')}</span>
          <select
            className="input"
            value={current?.id || ''}
            data-testid="animal-select"
            onChange={(e) => setAnimalId(e.target.value)}
          >
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} #{a.tag}
              </option>
            ))}
          </select>
        </label>

        <section className="space-y-2">
          <h2 className="font-semibold text-earth">{t('symptoms.warningSigns')}</h2>
          {warning.map((s) => (
            <SignButton key={s.key} sign={s} checked={selected.includes(s.key)} onToggle={() => toggle(s.key)} />
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-earth">{t('symptoms.otherSigns')}</h2>
          {other.map((s) => (
            <SignButton key={s.key} sign={s} checked={selected.includes(s.key)} onToggle={() => toggle(s.key)} />
          ))}
        </section>

        <label className="block">
          <span className="label">{t('symptoms.sinceLabel')}</span>
          <select
            className="input"
            value={sinceDays}
            data-testid="since-select"
            onChange={(e) => setSinceDays(Number(e.target.value))}
          >
            {SINCE_DAYS.map((d) => (
              <option key={d} value={d}>
                {t(`symptoms.since.${d}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="label">{t('symptoms.notesLabel')}</span>
          <textarea
            className="input min-h-24 py-2"
            maxLength={500}
            value={notes}
            placeholder={t('symptoms.notesPlaceholder')}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {selected.length === 0 && <p className="text-sm text-stone-500">{t('symptoms.pickSign')}</p>}

        <button type="button" className="btn-primary" disabled={!canCheck} onClick={() => mutation.mutate()}>
          <HeartPulse className="h-5 w-5" />
          {mutation.isPending ? t('symptoms.checking') : t('symptoms.check')}
        </button>
      </div>

      <p className="text-center text-sm font-semibold text-earth" data-testid="disclaimer">
        {t('symptoms.disclaimer')}
      </p>
    </div>
  );
}
