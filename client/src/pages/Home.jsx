import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Droplets, Wallet, Syringe, RefreshCw, ArrowRight, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getDashboard } from '../api/money';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';

const money = (value) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setData(await getDashboard()); }
    catch (error) { toast.error(error.message || t('common.loadFailed')); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const greetingName = user?.name?.trim()?.split(/\s+/)[0] || t('dashboard.farmer');
  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-brand p-5 text-white shadow-sm">
        <p className="text-sm text-green-100">{t('dashboard.greeting')}</p>
        <h1 className="mt-1 text-2xl font-bold">{t('dashboard.welcome', { name: greetingName })}</h1>
        <p className="mt-2 text-sm text-green-100">{t('dashboard.subtitle')}</p>
        <Link to="/animals" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 font-semibold text-brand">
          <Sprout className="h-5 w-5" /> {t('dashboard.manageAnimals')} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-earth">{t('dashboard.todayOverview')}</h2>
          <button onClick={load} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-earth" aria-label={t('common.refresh')}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={Droplets} label={t('dashboard.todayMilk')} value={loading ? '—' : `${data?.todayMilkL ?? 0} L`} />
          <StatCard icon={Syringe} label={t('dashboard.dueVaccines')} value={loading ? '—' : String(data?.dueVaccinesCount ?? 0)} />
          <StatCard icon={Wallet} label={t('dashboard.monthProfit')} value={loading ? '—' : money(data?.monthProfit)} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-earth">{t('dashboard.alerts')}</h2>
          <CalendarClock className="h-5 w-5 text-earth" />
        </div>
        {loading ? <div className="card animate-pulse text-sm text-stone-400">{t('common.loading')}</div> : data?.alerts?.length ? data.alerts.map((alert, index) => (
          <AlertCard key={`${alert.type}-${alert.animalId || index}-${alert.date}`} icon={alert.type === 'vaccine' ? Syringe : alert.type === 'milk' ? Droplets : CalendarClock}
            title={`${alert.animalName || t('dashboard.animal')} · ${t(`dashboard.alertTypes.${alert.type}`, { defaultValue: alert.type })}`}
            message={alert.message} tone="amber" />
        )) : <EmptyState icon={CalendarClock} title={t('dashboard.allClear')} text={t('dashboard.noAlerts')} />}
      </section>
    </div>
  );
}
