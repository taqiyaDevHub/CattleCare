import { AlertTriangle, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HealthEventItem from './HealthEventItem';
import { daysFromToday, formatMonth, monthKey } from '../utils/healthDates';

// Pending vaccine and deworming events grouped like a calendar:
// "Overdue" first, then one group for each month.
export function buildGroups(events) {
  const pending = events
    .filter((e) => e.status === 'pending' && e.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const overdue = pending.filter((e) => daysFromToday(e.dueDate) < 0);
  const months = new Map();
  for (const e of pending.filter((x) => daysFromToday(x.dueDate) >= 0)) {
    const key = monthKey(e.dueDate);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(e);
  }

  return { overdue, months: [...months.entries()] };
}

// animalsById (optional): { [id]: animal } to show the animal name on each card
export default function VaccineCalendar({ events, animalsById }) {
  const { t } = useTranslation();
  const { overdue, months } = buildGroups(events);
  const nameOf = (e) => (animalsById?.[e.animal] ? animalsById[e.animal].name : undefined);

  return (
    <div className="space-y-5">
      {overdue.length > 0 && (
        <section className="space-y-3" data-testid="group-overdue">
          <h3 className="flex items-center gap-2 font-semibold text-amber-800">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {t('health.overdue')}
          </h3>
          {overdue.map((e) => (
            <HealthEventItem key={e.id} event={e} animalName={nameOf(e)} />
          ))}
        </section>
      )}

      {months.map(([key, list]) => (
        <section key={key} className="space-y-3" data-testid="group-month">
          <h3 className="flex items-center gap-2 font-semibold text-earth">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            {formatMonth(key)}
          </h3>
          {list.map((e) => (
            <HealthEventItem key={e.id} event={e} animalName={nameOf(e)} />
          ))}
        </section>
      ))}
    </div>
  );
}
