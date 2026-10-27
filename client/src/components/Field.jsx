import { useTranslation } from 'react-i18next';

// Label + input + error message
export default function Field({ label, error, children }) {
  const { t } = useTranslation();
  const message = error
    ? error.message?.startsWith('errors.')
      ? t(error.message)
      : t('errors.invalid')
    : null;

  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {message && <span className="mt-1 block text-sm text-accent">{message}</span>}
    </label>
  );
}
