import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from './EmptyState';

export default function Placeholder({ titleKey }) {
  const { t } = useTranslation();
  return <EmptyState icon={Clock} title={t(titleKey)} text={t('common.comingSoon')} />;
}
