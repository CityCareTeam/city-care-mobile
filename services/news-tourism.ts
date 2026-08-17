import { fetchWithTimeout } from "@/services/api-client";
import type { NewsItem } from "@/services/news";

/**
 * Agenda d'un office de tourisme, lu dans sa page.
 *
 * C'est le seul adaptateur de l'application qui lise du HTML, et il faut dire
 * pourquoi. L'office du Haut-Bugey publie les événements du Plateau
 * d'Hauteville — le marché du mercredi, les expositions du CACL, les visites —
 * que l'agrégation nationale n'a pas : elle en compte **un** sur la commune,
 * contre vingt-quatre ici. Or le site n'expose rien de machine : son type de
 * contenu est absent de l'API REST, sa route interne demande une
 * authentification, ses flux RSS ne portent que les dix derniers *publiés*
 * sans date d'événement, et ses fiches n'ont aucune donnée structurée. Vérifié
 * une par une.
 *
 * Le marché du mercredi ne se trouvant nulle part ailleurs, on lit la page.
 *
 * Ce que cela coûte, et comment on le paie : leur prochaine refonte cassera ce
 * fichier. Il est donc écrit pour échouer proprement — si la structure change,
 * l'extraction rend zéro élément, la fonction lève, et l'écran garde la
 * dernière liste connue en affichant son bandeau. On perd la fraîcheur, jamais
 * l'écran.
 */

/** Un élément de liste, tel que le thème le produit depuis des années. */
const ITEM = /<li class="wpet-list-item[\s\S]*?<\/li>/g;

const FIELD = {
  title: /class="wpet-list-item-title"[^>]*>([\s\S]*?)<\/a>/,
  link: /class="wpet-list-item-title"[^>]*href="([^"]+)"/,
  date: /class="wpet-list-item-date">([\s\S]*?)<\/div>/,
  town: /class="wpet-list-item-town">([\s\S]*?)<\/div>/,
  excerpt: /class="wpet-list-item-excerpt">([\s\S]*?)<\/div>/,
  image: /class="wpet-list-item-thumb"[\s\S]*?<img[^>]*?src="([^"]+)"/,
};

const MONTHS: Record<string, number> = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11,
};

/**
 * Le thème sort des entités typographiques — `&#8211;`, `&rsquo;` — au milieu
 * de caractères accentués bien réels. On décode donc le numérique et la
 * poignée de noms qui apparaissent, plutôt qu'une table de mille entrées.
 */
const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", deg: "°", euro: "€",
  // Les lettres accentuées du français, au complet : le thème sort tantôt
  // l'UTF-8, tantôt l'entité, et une « Façade » écrite `Fa&ccedil;ade` reste
  // lisible à l'écran — ce qui la rendrait d'autant plus facile à manquer.
  agrave: "à", acirc: "â", ccedil: "ç", eacute: "é", egrave: "è", ecirc: "ê", euml: "ë",
  icirc: "î", iuml: "ï", ocirc: "ô", oelig: "œ", ugrave: "ù", ucirc: "û", uuml: "ü", yuml: "ÿ",
  Agrave: "À", Acirc: "Â", Ccedil: "Ç", Eacute: "É", Egrave: "È", Ecirc: "Ê", Euml: "Ë",
  Icirc: "Î", Iuml: "Ï", Ocirc: "Ô", OElig: "Œ", Ugrave: "Ù", Ucirc: "Û", Uuml: "Ü",
};

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // La casse compte — `&Eacute;` n'est pas `&eacute;` — mais `&AMP;` existe
    // aussi : on tente l'exact, puis le minuscule.
    .replace(/&([a-zA-Z]+);/g, (whole, name) => NAMED[name] ?? NAMED[name.toLowerCase()] ?? whole);
}

/** Balises dehors, entités décodées, espaces recollés. */
function text(html: string | undefined): string {
  if (!html) return "";
  return decode(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function field(item: string, pattern: RegExp): string | undefined {
  return pattern.exec(item)?.[1];
}

/**
 * « Le 22 Août 2026 », « À partir du 29 Août 2026 », « Du 07 Juillet au 25
 * Août 2026 » : trois tournures, une seule forme utile — le premier couple
 * jour/mois, et l'année qui ferme la phrase.
 *
 * Le piège est la période à cheval sur l'an neuf : dans « Du 20 Décembre au 05
 * Janvier 2027 », l'année écrite n'est pas celle du début. Un mois de départ
 * postérieur au mois de fin trahit le passage, et l'année recule d'un cran.
 */
export function parseFrenchDate(label: string): string | null {
  const days = [...label.matchAll(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)/g)];
  const first = days[0];
  const year = /(\d{4})/.exec(label)?.[1];
  if (!first || !year) return null;

  const month = MONTHS[first[2].toLowerCase()];
  if (month === undefined) return null;

  const lastMonth = days.length > 1 ? MONTHS[days[days.length - 1][2].toLowerCase()] : month;
  const spansNewYear = lastMonth !== undefined && month > lastMonth;

  const date = new Date(Date.UTC(Number(year) - (spansNewYear ? 1 : 0), month, Number(first[1])));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getTourismEvents(url: string): Promise<NewsItem[]> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Agenda indisponible (${response.status})`);

  const page = await response.text();
  const items = page.match(ITEM) ?? [];

  const events = items.map((item, index) => {
    const when = text(field(item, FIELD.date));
    return {
      // La page ne porte pas d'identifiant ; le lien en fait un, stable tant
      // que la fiche existe.
      id: field(item, FIELD.link) ?? `tourism-${index}`,
      title: text(field(item, FIELD.title)),
      // Le résumé finit sur un lien « … » qui n'a pas de sens hors de la page.
      summary: text(field(item, FIELD.excerpt)?.replace(/<a[^>]*class="more"[\s\S]*$/, "")),
      when,
      place: text(field(item, FIELD.town)) || null,
      imageUrl: field(item, FIELD.image) ?? null,
      startsAt: parseFrenchDate(when),
      url: field(item, FIELD.link) ?? null,
    } satisfies NewsItem;
  });

  const usable = events.filter((event) => event.title);

  // Zéro élément sur une page qui a répondu 200 ne veut pas dire « rien à
  // l'affiche » : ça veut dire que la structure a changé sous nos pieds. On
  // lève, pour que l'écran garde sa dernière liste au lieu de se vider.
  if (usable.length === 0) throw new Error("Agenda illisible : la page a changé de forme");

  return usable;
}
