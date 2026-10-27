import { NavLink } from 'react-router-dom';
import { Home, PawPrint, Droplets, Wallet, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const items = [
  { to: '/', key: 'nav.home', icon: Home, end: true },
  { to: '/animals', key: 'nav.animals', icon: PawPrint },
  { to: '/milk', key: 'nav.milk', icon: Droplets },
  { to: '/money', key: 'nav.money', icon: Wallet },
  { to: '/help', key: 'nav.help', icon: HeartPulse },
];

export default function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 bg-brand">
      {items.map(({ to, key, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              isActive ? 'font-bold text-white' : 'text-green-200'
            }`
          }
        >
          <Icon className="h-6 w-6" />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  );
}
