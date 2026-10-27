import { Navigate, Outlet, Link } from 'react-router-dom';
import { PawPrint, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';

export default function Layout() {
  const { token } = useAuth();
  const { t } = useTranslation();

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto min-h-screen max-w-md">
      <header className="flex items-center justify-between bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 text-earth">
          <PawPrint className="h-6 w-6" />
          <span className="text-lg font-bold">{t('app.name')}</span>
        </div>
        <Link
          to="/settings"
          aria-label={t('settings.title')}
          className="flex h-12 w-12 items-center justify-center text-earth"
        >
          <SettingsIcon className="h-6 w-6" />
        </Link>
      </header>
      <main className="p-4 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
