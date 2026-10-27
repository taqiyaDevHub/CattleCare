import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, PawPrint, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAnimals } from '../api/animals';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const FILTERS = ['all', 'cow', 'buffalo', 'goat'];

export default function Animals() {
  const { t } = useTranslation();
  const [type, setType] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['animals', type],
    queryFn: () => getAnimals(type === 'all' ? {} : { type }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-earth">{t('animals.title')}</h1>

      <Link to="/animals/new" className="btn-primary">
        <Plus className="h-5 w-5" />
        {t('animals.add')}
      </Link>

      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setType(f)}
            className={`min-h-12 shrink-0 rounded-full px-5 text-sm font-medium ${
              type === f ? 'bg-brand text-white' : 'bg-white text-earth'
            }`}
          >
            {f === 'all' ? t('animals.filterAll') : t(`types.${f}`)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton /> <Skeleton /> <Skeleton /> <Skeleton />
        </div>
      )}

      {isError && (
        <EmptyState icon={PawPrint} title={t('common.loadFailed')}>
          <button className="btn-secondary" onClick={() => refetch()}>
            {t('common.retry')}
          </button>
        </EmptyState>
      )}

      {data && data.length === 0 && (
        <EmptyState icon={PawPrint} title={t('animals.emptyTitle')} text={t('animals.emptyText')} />
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((a) => (
            <li key={a.id}>
              <Link to={`/animals/${a.id}`} className="card flex items-center gap-3">
                <PawPrint className="h-8 w-8 shrink-0 text-earth" />
                <div className="flex-1">
                  <p className="font-semibold text-stone-800">
                    {a.name} <span className="text-sm text-stone-400">#{a.tag}</span>
                  </p>
                  <p className="text-sm text-stone-500">
                    {t(`types.${a.type}`)} · {a.ageMonths} {t('animals.months')} · {t(`status.${a.status}`)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-stone-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
