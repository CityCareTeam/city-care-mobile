const STREET_PATTERN = /\b(rue|avenue|boulevard|place|allée|allee|chemin|impasse|passage|route|voie|square|cours|esplanade|quai|lotissement|résidence|residence|sente|sentier|montée|montee|traverse|traversée|traversee|ruelle|venelle|clos|domaine|promenade|corniche|digue|levée|levee|villa|cité|cite)\b/i;

const FRENCH_DEPTS = new Set([
  'ain','aisne','allier','ariege','aube','aude','aveyron','calvados','cantal',
  'charente','correze','creuse','doubs','drome','eure','gard','gers','gironde',
  'herault','indre','isere','jura','landes','loire','loiret','lot','lozere',
  'manche','marne','mayenne','meuse','morbihan','moselle','nievre','oise','orne',
  'rhone','sarthe','savoie','somme','tarn','var','vaucluse','vendee','vienne',
  'vosges','yonne','essonne','yvelines',
]);

function normKey(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function extractCity(address: string | null | undefined): string {
  if (!address) return "Localisation inconnue";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "Localisation inconnue";

  for (const part of parts) {
    const match = part.match(/^\d{5}\s+(.+)$/);
    if (match?.[1]) return match[1].trim();
  }

  const isNoise = (p: string) =>
    /^france/i.test(p) ||
    /^\d/.test(p) ||
    (p.match(/-/g) ?? []).length >= 2 ||
    /métropole|arrondissement|département/i.test(p) ||
    STREET_PATTERN.test(p) ||
    FRENCH_DEPTS.has(normKey(p));

  const meaningful = parts.filter((p) => !isNoise(p));

  const adminParts = parts.filter((p) => /métropole|arrondissement/i.test(p));
  if (adminParts.length > 0) {
    const fromAdmin = meaningful.find((m) =>
      adminParts.some((a) => a.toLowerCase().includes(m.toLowerCase())),
    );
    if (fromAdmin) return fromAdmin;
  }

  return meaningful[0] ?? address;
}
