import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Stethoscope, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getHealth, getVaccineSchedule } from '../api/health';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import VaccineCalendar from './VaccineCalendar';
import HealthEventItem from './HealthEventItem';

// "Health" tab of the animal profile
export default function HealthTab({ animalId }) {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);

  const schedule = useQuery({
    queryKey: ['schedule', animalId],
    queryFn: () => getVaccineSchedule(animalId),
  });
  const illness = useQuery({
    queryKey: ['illness', animalId],
    queryFn: () => getHealth({ animalId, kind: 'illness' }),
  });

  const events = schedule.data || [];
  const pending = events.filter((e) => e.status === 'pending');
  const done = events.filter((e) => e.status === 'done');

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-earth">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          {t('health.vaccinesTitle')}
        </h2>

        {schedule.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24" /> <Skeleton className="h-24" /> <Skeleton className="h-24" />
          </div>
        )}

        {schedule.isError && (
          <EmptyState icon={HeartPulse} title={t('common.loadFailed')}>
            <button className="btn-secondary" onClick={() => schedule.refetch()}>
              {t('common.retry')}
            </button>
          </EmptyState>
        )}

        {schedule.data && events.length === 0 && (
          <EmptyState icon={ShieldCheck} title={t('health.emptyTitle')} text={t('health.emptyText')} />
        )}

        {schedule.data && events.length > 0 && pending.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title={t('health.nothingDueTitle')}
            text={t('health.nothingDueText')}
          />
        )}

        {pending.length > 0 && <VaccineCalendar events={pending} />}

        {schedule.data && events.length > 0 && (
          <p className="text-center text-sm text-stone-500" data-testid="vaccine-disclaimer">
            {t('vaccines.disclaimer')}
          </p>
        )}

        {done.length > 0 && (
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? t('health.hideHistory') : t('health.showHistory')}
            </button>
            {showHistory && (
              <div className="space-y-3">
                {done.map((e) => (
                  <HealthEventItem key={e.id} event={e} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-earth">
          <Stethoscope className="h-6 w-6" aria-hidden="true" />
          {t('health.illnessTitle')}
        </h2>

        <Link to={`/help?animal=${animalId}`} className="btn-primary">
          <HeartPulse className="h-5 w-5" />
          {t('health.checkSymptoms')}
        </Link>

        {illness.isLoading && <Skeleton className="h-24" />}

        {illness.isError && (
          <EmptyState icon={Stethoscope} title={t('common.loadFailed')}>
            <button className="btn-secondary" onClick={() => illness.refetch()}>
              {t('common.retry')}
            </button>
          </EmptyState>
        )}

        {illness.data && illness.data.length === 0 && (
          <EmptyState
            icon={Stethoscope}
            title={t('health.illnessEmptyTitle')}
            text={t('health.illnessEmptyText')}
          />
        )}

        {illness.data && illness.data.length > 0 && (
          <div className="space-y-3">
            {illness.data.map((e) => (
              <HealthEventItem key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
