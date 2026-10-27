import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PawPrint, Milk as MilkIcon, Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAnimal, archiveAnimal, sellAnimal } from '../api/animals';
import { getMilkTrend } from '../api/milk';
import { getBreedingRecords } from '../api/breeding';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import HealthTab from '../components/HealthTab';
import MoneyTab from '../components/MoneyTab';

const TABS = ['overview', 'health', 'milk', 'breeding', 'money'];

export default function AnimalProfile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('overview');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [selling, setSelling] = useState(false);
  const [sale, setSale] = useState({ soldDate: '', soldPrice: '' });

  const { data: animal, isLoading, isError, refetch } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => getAnimal(id),
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveAnimal(id),
    onSuccess: () => {
      toast.success(t('animals.archived'));
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      navigate('/animals');
    },
    onError: (err) => toast.error(err.message),
  });

  const milkQuery = useQuery({
    queryKey: ['milk-trend', id],
    queryFn: () => getMilkTrend(id, 365),
    enabled: tab === 'milk',
  });

  const breedingQuery = useQuery({
    queryKey: ['breeding', id],
    queryFn: () => getBreedingRecords({ animalId: id }),
    enabled: tab === 'breeding',
  });

  const sellMutation = useMutation({
    mutationFn: () =>
      sellAnimal(id, { soldDate: sale.soldDate, soldPrice: Number(sale.soldPrice) }),
    onSuccess: () => {
      toast.success(t('animals.sold'));
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      setSelling(false);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" /> <Skeleton className="h-12" /> <Skeleton className="h-40" />
      </div>
    );
  }

  if (isError || !animal) {
    return (
      <EmptyState icon={PawPrint} title={t('common.loadFailed')}>
        <button className="btn-secondary" onClick={() => refetch()}>
          {t('common.retry')}
        </button>
      </EmptyState>
    );
  }

  const rows = [
    ['animals.type', t(`types.${animal.type}`)],
    ['animals.gender', t(`genders.${animal.gender}`)],
    ['animals.ageMonths', animal.ageMonths],
    ['animals.weightKg', animal.weightKg],
    ['animals.milkingStatus', t(`milking.${animal.milkingStatus}`)],
    ['animals.status', t(`status.${animal.status}`)],
    ['animals.purchaseDate', animal.purchaseDate],
    ['animals.purchasePrice', animal.purchasePrice],
    ['animals.soldDate', animal.soldDate],
    ['animals.soldPrice', animal.soldPrice],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3">
        <PawPrint className="h-10 w-10 text-earth" />
        <div>
          <h1 className="text-xl font-bold text-earth">{animal.name}</h1>
          <p className="text-sm text-stone-500">#{animal.tag}</p>
          {animal.archivedAt && <p className="text-sm font-medium text-amber-800">{t('animals.archivedLabel')}</p>}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`min-h-12 shrink-0 rounded-full px-5 text-sm font-medium ${
              tab === k ? 'bg-brand text-white' : 'bg-white text-earth'
            }`}
          >
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="card divide-y divide-stone-100">
            {rows.map(([labelKey, value]) => (
              <div key={labelKey} className="flex justify-between py-2 text-sm">
                <span className="text-stone-500">{t(labelKey)}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>

          {animal.status === 'active' && !animal.archivedAt && !selling && (
            <button className="btn-secondary" onClick={() => setSelling(true)}>
              {t('animals.sell')}
            </button>
          )}

          {selling && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-earth">{t('animals.sellTitle')}</h2>
              <label className="block">
                <span className="label">{t('animals.soldDate')}</span>
                <input
                  className="input"
                  type="date"
                  value={sale.soldDate}
                  onChange={(e) => setSale({ ...sale, soldDate: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="label">{t('animals.soldPrice')}</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  value={sale.soldPrice}
                  onChange={(e) => setSale({ ...sale, soldPrice: e.target.value })}
                />
              </label>
              <button
                className="btn-primary"
                disabled={!sale.soldDate || sale.soldPrice === '' || sellMutation.isPending}
                onClick={() => sellMutation.mutate()}
              >
                {t('animals.confirmSell')}
              </button>
            </div>
          )}

          {!animal.archivedAt && (
            <button className="btn-secondary" onClick={() => setConfirmArchive(true)}>
              {t('animals.archive')}
            </button>
          )}
        </>
      )}

      {tab === 'health' && <HealthTab animalId={id} />}

      {tab === 'milk' && (
        <section className="card space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-earth">
            <MilkIcon className="h-5 w-5" aria-hidden="true" />
            {t('animalProfile.milkTitle')}
          </h2>
          {milkQuery.isLoading && <Skeleton className="h-24" />}
          {milkQuery.isError && (
            <EmptyState icon={MilkIcon} title={t('common.loadFailed')}>
              <button className="btn-secondary" onClick={() => milkQuery.refetch()}>
                {t('common.retry')}
              </button>
            </EmptyState>
          )}
          {milkQuery.data && !milkQuery.data.some((record) => record.totalL !== null) && (
            <EmptyState icon={MilkIcon} title={t('animalProfile.noMilkRecords')} />
          )}
          {milkQuery.data?.some((record) => record.totalL !== null) && (
            <ul className="divide-y divide-stone-100">
              {milkQuery.data.filter((record) => record.totalL !== null).map((record) => (
                <li key={record.date} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="text-stone-500">{new Date(`${record.date}T12:00:00`).toLocaleDateString()}</span>
                  <span className="font-medium text-earth">{record.totalL.toFixed(1)} L</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'breeding' && (
        <section className="card space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-earth">
            <Baby className="h-5 w-5" aria-hidden="true" />
            {t('animalProfile.breedingTitle')}
          </h2>
          {breedingQuery.isLoading && <Skeleton className="h-24" />}
          {breedingQuery.isError && (
            <EmptyState icon={Baby} title={t('common.loadFailed')}>
              <button className="btn-secondary" onClick={() => breedingQuery.refetch()}>
                {t('common.retry')}
              </button>
            </EmptyState>
          )}
          {breedingQuery.data && breedingQuery.data.length === 0 && (
            <EmptyState icon={Baby} title={t('animalProfile.noBreedingRecords')} />
          )}
          {breedingQuery.data?.map((record) => (
            <article key={record.id} className="border-t border-stone-100 pt-3 text-sm">
              <p className="font-medium text-earth">
                {t('animalProfile.breedingDate')}: {new Date(`${record.breedingDate}T12:00:00`).toLocaleDateString()}
              </p>
              <p className="mt-1 text-stone-600">{t('animalProfile.method')}: {record.method === 'AI' ? 'Artificial insemination' : 'Natural'}</p>
              <p className="mt-1 text-stone-600">{t('animalProfile.expectedDelivery')}: {new Date(`${record.expectedDelivery}T12:00:00`).toLocaleDateString()}</p>
              <p className="mt-1 text-stone-500">{t('animalProfile.status')}: {record.status}</p>
            </article>
          ))}
        </section>
      )}

      {tab === 'money' && <MoneyTab animalId={id} animal={animal} />}

      {confirmArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md space-y-4" role="dialog" aria-modal="true" aria-labelledby="archive-title">
            <div>
              <h2 id="archive-title" className="text-lg font-semibold text-earth">{t('animals.archiveTitle')}</h2>
              <p className="mt-2 text-sm text-stone-600">{t('animals.confirmArchive')}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" disabled={archiveMutation.isPending} onClick={() => setConfirmArchive(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-primary" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate()}>
                {archiveMutation.isPending ? t('common.loading') : t('animals.confirmArchiveAction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
