import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Syringe, Bug, Stethoscope, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { markHealthDone } from '../api/health';
import { daysFromToday, formatDate, todayStr } from '../utils/healthDates';

const ICONS = { vaccine: Syringe, deworming: Bug, illness: Stethoscope };

const BADGE = {
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-green-100 text-brand',
  stone: 'bg-stone-100 text-stone-600',
  // Red is used for emergencies ONLY
  red: 'bg-danger text-white',
};

// Server notes that we show as translated text
function useNoteText(note) {
  const { t } = useTranslation();
  if (!note) return '';
  if (note === 'Due now (history unknown)') return t('vaccines.historyUnknown');
  if (note === 'Added from history') return t('vaccines.fromHistory');
  const age = /^From (\d+) months of age$/.exec(note);
  if (age) return t('vaccines.fromAge', { months: age[1] });
  return note;
}

function dueBadge(event, t) {
  const days = daysFromToday(event.dueDate);
  if (days < 0) {
    return {
      tone: 'amber',
      text: days === -1 ? t('health.overdueByOne') : t('health.overdueBy', { days: -days }),
    };
  }
  if (days === 0) return { tone: 'amber', text: t('health.dueToday') };
  if (days === 1) return { tone: 'amber', text: t('health.dueTomorrow') };
  if (days <= 7) return { tone: 'amber', text: t('health.dueIn', { days }) };
  return { tone: 'stone', text: t('health.dueIn', { days }) };
}

// One vaccine, deworming or illness record with a "Mark done" button
export default function HealthEventItem({ event, animalName }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayStr());
  const note = useNoteText(event.notes);

  const isIllness = event.kind === 'illness';
  const isPending = event.status === 'pending';
  const Icon = ICONS[event.kind] || Syringe;

  const mutation = useMutation({
    mutationFn: () => markHealthDone(event.id, date),
    onSuccess: (res) => {
      toast.success(
        res?.nextEvent
          ? t('health.doneNext', { date: formatDate(res.nextEvent.dueDate) })
          : t('health.done')
      );
      for (const key of ['schedule', 'illness', 'health-pending', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  let badge = null;
  if (!isPending) {
    badge = { tone: 'green', text: t('health.doneOn', { date: formatDate(event.doneDate) }) };
  } else if (isIllness) {
    badge = {
      tone: event.urgency === 'emergency' ? 'red' : event.urgency === 'see_vet_today' ? 'amber' : 'stone',
      text: t(`symptoms.urgency.${event.urgency || 'watch'}`),
    };
  } else if (event.dueDate) {
    badge = dueBadge(event, t);
  }

  const dateLine = isIllness
    ? t('health.sickSince', { date: formatDate(event.sinceDate) })
    : isPending
      ? formatDate(event.dueDate)
      : null;

  return (
    <div className="card space-y-3" data-testid="health-item">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-6 w-6 shrink-0 text-earth" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-800">{event.name}</p>
          {animalName && (
            <Link to={`/animals/${event.animal}`} className="text-sm font-medium text-brand">
              {animalName}
            </Link>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {badge && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[badge.tone]}`}>
                {badge.text}
              </span>
            )}
            {dateLine && <span className="text-sm text-stone-500">{dateLine}</span>}
          </div>
          {note && <p className="mt-1 text-sm text-stone-500">{note}</p>}
        </div>
      </div>

      {isPending && !open && (
        <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
          <Check className="h-5 w-5" />
          {t('health.markDone')}
        </button>
      )}

      {isPending && open && (
        <div className="space-y-3 rounded-xl bg-cream p-3">
          <label className="block">
            <span className="label">{t('health.dateGiven')}</span>
            <input
              className="input"
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={!date || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {t('health.saveDone')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              {t('health.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
