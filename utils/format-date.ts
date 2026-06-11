export function formatIncidentDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Types de voies françaises courants (pour filtrer la partie "rue" des adresses)
const STREET_PATTERN = /\b(rue|avenue|boulevard|place|allée|allee|chemin|impasse|passage|route|voie|square|cours|esplanade|quai|lotissement|résidence|residence|sente|sentier|montée|montee|traverse|traversée|traversee|ruelle|venelle|clos|domaine|promenade|corniche|digue|levée|levee|villa|cité|cite)\b/i;

// Noms de départements français (sans tiret — ceux avec tirets sont captés par la règle >= 2 tirets)
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

  // "69002 Lyon" — code postal collé au nom de ville
  for (const part of parts) {
    const match = part.match(/^\d{5}\s+(.+)$/);
    if (match?.[1]) return match[1].trim();
  }

  // En géocodage français (Nominatim) : rue → quartier → "Ville Xe Arrondissement" → Ville → Métropole → dept → région → CP → pays
  const isNoise = (p: string) =>
    /^france/i.test(p) ||
    /^\d/.test(p) ||
    (p.match(/-/g) ?? []).length >= 2 ||
    /métropole|arrondissement|département/i.test(p) ||
    STREET_PATTERN.test(p) ||
    FRENCH_DEPTS.has(normKey(p));

  const meaningful = parts.filter((p) => !isNoise(p));

  // Les entrées "Métropole de X" ou "X 2e Arrondissement" trahissent le nom de la ville.
  // On cherche la partie significative qui apparaît dans l'une de ces entrées admin.
  const adminParts = parts.filter((p) => /métropole|arrondissement/i.test(p));
  if (adminParts.length > 0) {
    const fromAdmin = meaningful.find((m) =>
      adminParts.some((a) => a.toLowerCase().includes(m.toLowerCase())),
    );
    if (fromAdmin) return fromAdmin;
  }

  return meaningful[0] ?? address;
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
