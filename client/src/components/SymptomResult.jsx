import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, Stethoscope, Eye, Copy, Check, Info, ListChecks, RotateCcw, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Banner look for each urgency. Red is used for emergencies ONLY.
const LOOK = {
  emergency: { box: 'bg-danger text-white', icon: AlertTriangle },
  see_vet_today: { box: 'bg-accent text-white', icon: Stethoscope },
  watch: { box: 'bg-brand text-white', icon: Eye },
};

const DEAD_WARNING_KEYS = ['sudden_death', 'bleeding_nose_mouth'];
const DEAD_WARNING_TEXT = 'Do not open the dead animal. Tell a vet.';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that block the clipboard API
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(area);
    }
  }
}

// result: {urgency, hints, tips, vetSummary, healthEventId}
export default function SymptomResult({ result, animal, selectedKeys, onReset }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const look = LOOK[result.urgency] || LOOK.watch;
  const Icon = look.icon;

  const showDeadWarning = selectedKeys.some((k) => DEAD_WARNING_KEYS.includes(k));
  const tips = (result.tips || []).filter((tip) => tip !== DEAD_WARNING_TEXT);

  const copy = async () => {
    const ok = await copyText(result.vetSummary);
    if (ok) {
      setCopied(true);
      toast.success(t('symptoms.copied'));
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error(t('symptoms.copyFailed'));
    }
  };

  return (
    <div className="space-y-4" data-testid="symptom-result">
      <div className={`rounded-2xl p-5 shadow-sm ${look.box}`} role="status" data-urgency={result.urgency}>
        <Icon className="h-10 w-10" aria-hidden="true" />
        <h1 className="mt-2 text-3xl font-bold">{t(`symptoms.urgency.${result.urgency}`)}</h1>
        <p className="mt-1 font-medium">{t(`symptoms.urgencySub.${result.urgency}`)}</p>
        {animal && (
          <p className="mt-3 text-sm opacity-90">
            {animal.name} #{animal.tag}
          </p>
        )}
      </div>

      {showDeadWarning && (
        <div className="card flex items-start gap-3 border-l-4 border-accent" data-testid="dead-warning">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
          <p className="font-semibold text-earth">{t('symptoms.deadWarning')}</p>
        </div>
      )}

      {result.hints?.length > 0 && (
        <section className="card space-y-2">
          <h2 className="flex items-center gap-2 font-semibold text-earth">
            <Info className="h-5 w-5" aria-hidden="true" />
            {t('symptoms.why')}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            {result.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      )}

      {tips.length > 0 && (
        <section className="card space-y-2">
          <h2 className="flex items-center gap-2 font-semibold text-earth">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
            {t('symptoms.todo')}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-earth">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          {t('symptoms.vetSummary')}
        </h2>
        <pre
          className="whitespace-pre-wrap break-words rounded-xl bg-cream p-3 font-sans text-sm text-stone-700"
          data-testid="vet-summary"
        >
          {result.vetSummary}
        </pre>
        <button type="button" className="btn-primary" onClick={copy}>
          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          {copied ? t('symptoms.copied') : t('symptoms.copy')}
        </button>
      </section>

      <p className="text-center text-sm font-semibold text-earth" data-testid="disclaimer">
        {t('symptoms.disclaimer')}
      </p>

      {animal && (
        <Link to={`/animals/${animal.id}`} className="btn-secondary">
          <Stethoscope className="h-5 w-5" />
          {t('symptoms.openHealth')}
        </Link>
      )}
      <button type="button" className="btn-secondary" onClick={onReset}>
        <RotateCcw className="h-5 w-5" />
        {t('symptoms.checkAnother')}
      </button>
    </div>
  );
}
