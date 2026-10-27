import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/symptoms.json', import.meta.url), 'utf8'));

export const SYMPTOMS = data.symptoms;
const BY_KEY = new Map(SYMPTOMS.map((s) => [s.key, s]));

export const URGENCY_ORDER = ['watch', 'see_vet_today', 'emergency'];
export const URGENCY_LABEL = {
  watch: 'Watch',
  see_vet_today: 'See vet today',
  emergency: 'Emergency',
};

export const NOT_A_DIAGNOSIS = 'This is not a diagnosis.';
export const DEAD_ANIMAL_WARNING = 'Do not open the dead animal. Tell a vet.';

export const isKnownSymptom = (key) => BY_KEY.has(key);

// GET /symptoms/options -> {symptoms: [{key, label, redFlag}]}
export const getSymptomOptions = () =>
  SYMPTOMS.map(({ key, label, redFlag }) => ({ key, label, redFlag }));

export const getSymptomLabels = (keys) => keys.map((k) => BY_KEY.get(k).label);

// ---------- urgency ----------
// 1. Any red flag -> emergency (always).
// 2. Any "see vet today" sign -> see_vet_today.
// 3. When unsure, go higher: 3+ signs, sick 3+ days (or 2+ days with 2+ signs),
//    or a young animal (under 6 months) -> at least see_vet_today.
// 4. Otherwise -> watch.
export function assessSymptoms({ symptoms, sinceDays, ageMonths }) {
  const selected = symptoms.map((k) => BY_KEY.get(k));
  const reasons = [];
  let rank = 0;

  if (selected.some((s) => s.redFlag)) {
    rank = 2;
  } else {
    if (selected.some((s) => s.level === 'see_vet_today')) rank = 1;

    if (selected.length >= 3) {
      rank = Math.max(rank, 1);
      reasons.push('Three or more signs together need a vet check.');
    }
    if (sinceDays >= 3) {
      rank = Math.max(rank, 1);
      reasons.push('Sick for 3 days or more. Do not wait longer.');
    } else if (sinceDays >= 2 && selected.length >= 2) {
      rank = Math.max(rank, 1);
      reasons.push('Several signs for 2 days. A vet check is safer.');
    }
    if (ageMonths < 6) {
      rank = Math.max(rank, 1);
      reasons.push('Young animals can get worse very fast.');
    }
  }

  return { urgency: URGENCY_ORDER[rank], reasons };
}

// ---------- hints and tips (never any medicine or treatment) ----------
export function buildHints(symptoms, reasons) {
  const selected = symptoms.map((k) => BY_KEY.get(k));
  const ordered = [...selected.filter((s) => s.redFlag), ...selected.filter((s) => !s.redFlag)];
  return [...new Set([...ordered.map((s) => s.hint), ...reasons])];
}

export function buildTips(urgency, symptoms) {
  const tips = [];

  if (symptoms.includes('sudden_death') || symptoms.includes('bleeding_nose_mouth')) {
    tips.push(DEAD_ANIMAL_WARNING);
  }
  if (symptoms.includes('sudden_death')) {
    tips.push('Keep people and other animals away from the animal.');
  }

  if (urgency === 'emergency') {
    tips.push('Call a vet now.');
    tips.push('Keep the animal calm in a safe place.');
    tips.push('Keep other animals away from it.');
    tips.push("Wait for the vet's advice before giving anything.");
  } else if (urgency === 'see_vet_today') {
    tips.push('Contact a vet today.');
    tips.push('Keep the animal apart from the herd.');
    tips.push('Note when it last ate, drank and gave milk, and tell the vet.');
  } else {
    tips.push('Check the animal again this evening and tomorrow morning.');
    tips.push('Watch eating, cud chewing, dung and milk.');
    tips.push('If it gets worse or new signs appear, check again right away.');
  }

  return tips;
}

// ---------- vet summary (plain text, copied by the farmer) ----------
function ageText(months) {
  if (months < 24) return `${months} months`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} years ${rest} months` : `${years} years`;
}

function sinceText(sinceDate, sinceDays) {
  if (sinceDays === 0) return `${sinceDate} (today)`;
  return `${sinceDate} (${sinceDays} ${sinceDays === 1 ? 'day' : 'days'} ago)`;
}

export function buildVetSummary({
  animal,
  ageMonths,
  symptoms,
  urgency,
  sinceDate,
  sinceDays,
  notes,
  lastVaccines,
  today,
}) {
  const animalBits = [animal.type, animal.gender, ageText(ageMonths)];
  if (animal.weightKg) animalBits.push(`${animal.weightKg} kg`);

  const lines = [
    'CattleCare vet summary',
    `Date: ${today}`,
    `Animal: ${animal.name} (tag ${animal.tag}) - ${animalBits.join(', ')}`,
  ];
  if (animal.milkingStatus && animal.milkingStatus !== 'none') {
    lines.push(`Milking status: ${animal.milkingStatus === 'milking' ? 'Milking' : 'Dry'}`);
  }
  lines.push(`Sick since: ${sinceText(sinceDate, sinceDays)}`);
  lines.push(`Urgency shown by the app: ${URGENCY_LABEL[urgency]}`);
  lines.push(`Signs: ${getSymptomLabels(symptoms).join('; ')}`);
  if (notes) lines.push(`Notes: ${notes}`);
  lines.push(
    `Last vaccines: ${
      lastVaccines.length
        ? lastVaccines.map((v) => `${v.name} ${v.doneDate}`).join('; ')
        : 'none recorded'
    }`
  );
  lines.push(NOT_A_DIAGNOSIS);
  return lines.join('\n');
}
