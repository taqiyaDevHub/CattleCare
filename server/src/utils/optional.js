// Other members' files may not exist yet. This lets the skeleton run
// locally before their code is merged. Once merged, everything is used.
const tryImport = async (loader) => {
  try {
    return await loader();
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw err;
  }
};

const pick = (mod, name) => (mod ? mod.default ?? mod[name] ?? null : null);

export async function getRelatedModels() {
  const [h, m, b, t] = await Promise.all([
    tryImport(() => import('../models/HealthEvent.js')),
    tryImport(() => import('../models/MilkRecord.js')),
    tryImport(() => import('../models/Breeding.js')),
    tryImport(() => import('../models/Transaction.js')),
  ]);
  return {
    HealthEvent: pick(h, 'HealthEvent'),
    MilkRecord: pick(m, 'MilkRecord'),
    Breeding: pick(b, 'Breeding'),
    Transaction: pick(t, 'Transaction'),
  };
}

export async function getGenerateSchedule() {
  const mod = await tryImport(() => import('../services/vaccineEngine.js'));
  return mod?.generateSchedule ?? null;
}