// Translate server-authored symptom guidance without changing stable API keys.
const HINT_KEYS = {
  'Bleeding from the nose or mouth can be a sign of a very serious illness.': 'bleeding_nose_mouth',
  'Breathing trouble can become life-threatening very quickly.': 'difficulty_breathing',
  'A bloated belly can get worse within hours.': 'bloated_belly',
  'An animal that cannot stand needs urgent help.': 'cannot_stand',
  'Sudden death can be linked to a serious infection that spreads. Keep people and animals away.': 'sudden_death',
  'A snake bite is an emergency, even if the animal looks fine.': 'snake_bite',
  'A delivery that is not progressing can put the mother and her young one at risk.': 'difficult_delivery',
  'Blisters in the mouth together with limping can spread to other animals. Keep this animal apart.': 'mouth_blisters_limping',
  'Fever is a sign that the body is fighting a problem.': 'fever',
  'An animal that stops eating completely should be checked by a vet.': 'not_eating',
  'A dull or weak animal may be seriously unwell.': 'dull_weak',
  'Blood in the dung should always be checked.': 'bloody_dung',
  'A swollen or painful udder can quickly harm milk production.': 'swollen_udder',
  'Heavy drooling can point to a problem in the mouth or throat.': 'drooling',
  'Unusual discharge can be a sign of a problem with the womb.': 'abnormal_discharge',
  'Eating less than usual can be an early sign that something is wrong.': 'eating_less',
  'A healthy animal usually chews cud when resting.': 'not_chewing_cud',
  'Loose motions can make an animal weak from loss of water.': 'diarrhoea',
  'Coughing that continues should be watched closely.': 'cough',
  'A runny nose should be watched, especially if it continues.': 'nasal_discharge',
  'Limping can come from a hoof, leg or joint problem.': 'limping',
  'A drop in milk can come from feed, heat, stress or the udder.': 'milk_drop',
  'Watery or red eyes should be watched.': 'eye_problem',
  'Lumps or wounds should be watched for swelling or spreading.': 'skin_lumps',
  'Slow weight loss can have many causes.': 'weight_loss',
};
const REASON_KEYS = {
  'Three or more signs together need a vet check.': 'threeSigns',
  'Sick for 3 days or more. Do not wait longer.': 'sickThreeDays',
  'Several signs for 2 days. A vet check is safer.': 'severalSigns',
  'Young animals can get worse very fast.': 'youngAnimal',
};
const TIP_KEYS = {
  'Do not open the dead animal. Tell a vet.': 'deadWarning',
  'Keep people and other animals away from the animal.': 'keepAwayDead',
  'Call a vet now.': 'callVet',
  'Keep the animal calm in a safe place.': 'calm',
  'Keep other animals away from it.': 'separate',
  "Wait for the vet's advice before giving anything.": 'waitVet',
  'Contact a vet today.': 'contactVet',
  'Keep the animal apart from the herd.': 'apartHerd',
  'Note when it last ate, drank and gave milk, and tell the vet.': 'noteIntake',
  'Check the animal again this evening and tomorrow morning.': 'recheck',
  'Watch eating, cud chewing, dung and milk.': 'watchSigns',
  'If it gets worse or new signs appear, check again right away.': 'worsens',
};

export function translateHint(value, t) {
  const key = HINT_KEYS[value] || REASON_KEYS[value];
  return key ? t(`symptoms.hints.${key}`, { defaultValue: value }) : value;
}
export function translateTip(value, t) {
  const key = TIP_KEYS[value];
  return key ? t(`symptoms.tips.${key}`, { defaultValue: value }) : value;
}

function ageText(months, t) {
  if (months < 24) return `${months} ${t('symptoms.summary.months')}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} ${t('symptoms.summary.years')} ${rest} ${t('symptoms.summary.months')}` : `${years} ${t('symptoms.summary.years')}`;
}
function sinceText(date, days, t) {
  if (days === 0) return `${date} (${t('symptoms.summary.today')})`;
  if (days === 1) return `${date} (${t('symptoms.summary.dayAgo')})`;
  return `${date} (${days} ${t('symptoms.summary.daysAgo')})`;
}
export function buildLocalizedVetSummary(data, t) {
  if (!data) return '';
  const { animal, ageMonths, symptoms, urgency, sinceDate, sinceDays, notes, lastVaccines = [], today } = data;
  const s = 'symptoms.summary';
  const animalBits = [t(`types.${animal.type}`, { defaultValue: animal.type }), t(`genders.${animal.gender}`, { defaultValue: animal.gender }), ageText(ageMonths, t)];
  if (animal.weightKg) animalBits.push(`${animal.weightKg} ${t(`${s}.kg`)}`);
  const lines = [
    t(`${s}.title`),
    `${t(`${s}.date`)}: ${today}`,
    `${t(`${s}.animal`)}: ${animal.name} (${t(`${s}.tag`)} ${animal.tag}) - ${animalBits.join(', ')}`,
  ];
  if (animal.milkingStatus && animal.milkingStatus !== 'none') {
    lines.push(`${t(`${s}.milkingStatus`)}: ${t(`${s}.${animal.milkingStatus === 'milking' ? 'milking' : 'dry'}`)}`);
  }
  lines.push(`${t(`${s}.sickSince`)}: ${sinceText(sinceDate, sinceDays, t)}`);
  lines.push(`${t(`${s}.urgency`)}: ${t(`symptoms.urgency.${urgency}`)}`);
  lines.push(`${t(`${s}.signs`)}: ${symptoms.map((key) => t(`symptoms.signs.${key}`, { defaultValue: key })).join('؛ ')}`);
  if (notes) lines.push(`${t(`${s}.notes`)}: ${notes}`);
  const vaccineNames = { 'FMD (Foot and Mouth)': 'fmd', 'HS (Haemorrhagic Septicaemia)': 'hs', 'BQ (Black Quarter)': 'bq', Anthrax: 'anthrax', Brucellosis: 'brucellosis', 'PPR (Goat Plague)': 'ppr', Enterotoxemia: 'enterotoxemia', CCPP: 'ccpp', Deworming: 'deworming' };
  lines.push(`${t(`${s}.lastVaccines`)}: ${lastVaccines.length ? lastVaccines.map((v) => `${t(`vaccines.names.${vaccineNames[v.name]}`, { defaultValue: v.name })} ${v.doneDate}`).join('؛ ') : t(`${s}.noneRecorded`)}`);
  lines.push(t('symptoms.disclaimer'));
  return lines.join('\n');
}
