import { getTourismEvents, parseFrenchDate } from '@/services/news-tourism';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function page(html: string, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: () => Promise.resolve(html) } as Response;
}

// Balisage relevé sur la page de l'office du Haut-Bugey, entités comprises.
const ITEM = `
<li class="wpet-list-item wrapper_wpet_offer">
<article class="wpet-list-item-body resultsListItem">
<div class="wpet-list-item-top">
<a class="wpet-list-item-thumb" href="https://www.hautbugey-tourisme.com/fete-manifestations/marche/" rel="nofollow">
<img width="345" height="234" src="https://www.hautbugey-tourisme.com/wp-content/uploads/40133516-345x234.jpg" loading="lazy" />
</a>
</div>
<div class="wpet-list-item-bottom">
<header class="wpet-list-item-header ">
<div class="wpet-list-item-header-top">
<a class="wpet-list-item-title" href="https://www.hautbugey-tourisme.com/fete-manifestations/marche/" title="Voir">
Exposition CACL &#8211; La Fa&ccedil;ade #6 &rsquo;26                    </a>
</div>
<div class="wpet-list-item-header-sub">
<div class="wpet-list-item-date">
Du  14 Juin au  25 Octobre 2026                            </div>
<div class="wpet-list-item-town">
Plateau d'Hauteville                        </div>
</div>
</header>
<div class="wpet-list-item-infos">
<div class="wpet-list-item-excerpt">
La commune organise son march&eacute; hebdomadaire<a rel="nofollow" href="https://www.hautbugey-tourisme.com/fete-manifestations/marche/" class="more">...</a>                    </div>
</div>
</div>
</article>
</li>`;

const URL = 'https://www.hautbugey-tourisme.com/bouger/agenda/plateau-dhauteville/';

beforeEach(() => mockFetch.mockReset());

describe('getTourismEvents', () => {
  it('extrait les champs de chaque fiche', async () => {
    mockFetch.mockResolvedValueOnce(page(`<ul>${ITEM}</ul>`));
    const [item] = await getTourismEvents(URL);

    expect(item.title).toBe('Exposition CACL – La Façade #6 ’26');
    expect(item.when).toBe('Du 14 Juin au 25 Octobre 2026');
    expect(item.place).toBe("Plateau d'Hauteville");
    expect(item.imageUrl).toContain('40133516-345x234.jpg');
    expect(item.id).toContain('/fete-manifestations/marche/');
    expect(item.url).toBe('https://www.hautbugey-tourisme.com/fete-manifestations/marche/');
  });

  // Le résumé se termine par un lien « … » qui n'a pas de sens hors de la page.
  it('nettoie le résumé de son lien « lire la suite »', async () => {
    mockFetch.mockResolvedValueOnce(page(`<ul>${ITEM}</ul>`));
    const [item] = await getTourismEvents(URL);

    expect(item.summary).toBe('La commune organise son marché hebdomadaire');
  });

  it('lit toutes les fiches de la page', async () => {
    mockFetch.mockResolvedValueOnce(page(`<ul>${ITEM}${ITEM}${ITEM}</ul>`));
    expect(await getTourismEvents(URL)).toHaveLength(3);
  });

  /**
   * Le garde-fou du procédé. Lire le HTML de quelqu'un d'autre, c'est accepter
   * que sa prochaine refonte casse l'extraction — mais un écran vide mentirait
   * en annonçant qu'il n'y a rien à l'affiche. On lève, et l'appelant garde sa
   * dernière liste connue.
   */
  it('lève plutôt que de rendre une liste vide quand la page change de forme', async () => {
    mockFetch.mockResolvedValueOnce(page('<ul><li class="autre-theme">Refonte</li></ul>'));
    await expect(getTourismEvents(URL)).rejects.toThrow(/illisible/);
  });

  it('remonte une erreur du serveur', async () => {
    mockFetch.mockResolvedValueOnce(page('', 503));
    await expect(getTourismEvents(URL)).rejects.toThrow('503');
  });
});

describe('parseFrenchDate', () => {
  it('comprend les trois tournures de la page', () => {
    expect(parseFrenchDate('Le 22 Août 2026')).toBe('2026-08-22T00:00:00.000Z');
    expect(parseFrenchDate('À partir du 29 Août 2026')).toBe('2026-08-29T00:00:00.000Z');
    expect(parseFrenchDate('Du 07 Juillet au 25 Août 2026')).toBe('2026-07-07T00:00:00.000Z');
  });

  // L'année écrite est celle de la fin. Sur une période à cheval, ce n'est pas
  // celle du début.
  it('recule d’un an sur une période qui franchit le nouvel an', () => {
    expect(parseFrenchDate('Du 20 Décembre au 05 Janvier 2027')).toBe('2026-12-20T00:00:00.000Z');
  });

  it('rend null sur ce qu’elle ne sait pas lire', () => {
    expect(parseFrenchDate('Toute l’année')).toBeNull();
    expect(parseFrenchDate('Le 22 Smarch 2026')).toBeNull();
  });
});
