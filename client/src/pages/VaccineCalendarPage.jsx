import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAnimals } from '../api/animals';
import { getHealth } from '../api/health';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import VaccineCalendar from '../components/VaccineCalendar';

// Vaccine calendar for all animals
export default function VaccineCalendarPage() {
  const { t } = useTranslation();

  const animalsQuery = useQuery({
    queryKey: ['animals', 'active'],
    queryFn: () => getAnimals({ status: 'active' }),
  });
  const healthQuery = useQuery({
    queryKey: ['health-pending'],
    queryFn: () => getHealth({ status: 'pending' }),
  });

  const isLoading = animalsQuery.isLoading || healthQuery.isLoading;
  const isError = animalsQuery.isError || healthQuery.isError;

  const animalsById = Object.fromEntries((animalsQuery.data || []).map((a) => [a.id, a]));
  // Only vaccines and deworming of animals that are still active
  const events = (healthQuery.data || []).filter((e) => e.kind !== 'illness' && animalsById[e.animal]);

  return (
    <div className="space-y-4">
      <Link to="/help" className="inline-flex min-h-12 items-center gap-2 font-medium text-brand">
        <ArrowLeft className="h-5 w-5" />
        {t('common.back')}
      </Link>

      <h1 className="text-2xl font-bold text-earth">{t('vaccines.calendarTitle')}</h1>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24" /> <Skeleton className="h-24" /> <Skeleton className="h-24" />
        </div>
      )}

      {isError && (
        <EmptyState icon={HeartPulse} title={t('common.loadFailed')}>
          <button
            className="btn-secondary"
            onClick={() => {
              animalsQuery.refetch();
              healthQuery.refetch();
            }}
          >
            {t('common.retry')}
          </button>
        </EmptyState>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={t('vaccines.calendarEmptyTitle')}
          text={t('vaccines.calendarEmptyText')}
        />
      )}

      {events.length > 0 && <VaccineCalendar events={events} animalsById={animalsById} />}

      {!isLoading && !isError && (
        <p className="text-center text-sm text-stone-500" data-testid="vaccine-disclaimer">
          {t('vaccines.disclaimer')}
        </p>
      )}
    </div>
  );
}
