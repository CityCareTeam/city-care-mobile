/**
 * `resolvePhotoUrl` n'est pas exporté : on l'exerce par `getPhotos`, en
 * rechargeant le module pour chaque valeur d'`EXPO_PUBLIC_API_URL` — elle est
 * lue au chargement.
 */
const photo = (url: string) => ({
  id: 'p1', incidentId: 'i1', url, fileName: 'p.jpg',
  contentType: 'image/jpeg', sizeBytes: 1, uploadedByUserId: 'u1',
  createdAt: '2026-08-15T00:00:00Z',
});

async function resolve(apiUrl: string, photoUrl: string): Promise<string> {
  jest.resetModules();
  process.env.EXPO_PUBLIC_API_URL = apiUrl;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [photo(photoUrl)],
  }) as unknown as typeof fetch;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getPhotos } = require('@/services/incidents');
  const [result] = await getPhotos('i1');
  return result.url;
}

const MINIO = 'http://localhost:9000/citycare-photos/i1/p1.jpg';

describe('resolvePhotoUrl', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;
  afterAll(() => { process.env.EXPO_PUBLIC_API_URL = original; });

  describe('topologie directe — l’API porte un port', () => {
    // Le cas qui cassait : le port du stockage était perdu et la photo
    // pointait sur le port 80 d’une machine qui n’y écoute pas.
    it('remplace l’hôte en gardant le port du stockage', async () => {
      const url = await resolve('http://192.168.1.152:5158', MINIO);
      expect(url).toBe('http://192.168.1.152:9000/citycare-photos/i1/p1.jpg');
    });

    it('laisse localhost intact quand l’API y répond déjà', async () => {
      const url = await resolve('http://localhost:5158', MINIO);
      expect(url).toBe(MINIO);
    });

    it('conserve le port de l’API sur une URL relative', async () => {
      const url = await resolve('http://192.168.1.152:5158', '/citycare-photos/i1/p1.jpg');
      expect(url).toBe('http://192.168.1.152:5158/citycare-photos/i1/p1.jpg');
    });
  });

  describe('topologie proxifiée — l’API n’a pas de port', () => {
    it('reconstruit le chemin /photos', async () => {
      const url = await resolve('http://172.20.10.245/api', MINIO);
      expect(url).toBe('http://172.20.10.245/photos/citycare-photos/i1/p1.jpg');
    });

    it('préfixe aussi les URL relatives', async () => {
      const url = await resolve('http://172.20.10.245/api', '/i1/p1.jpg');
      expect(url).toBe('http://172.20.10.245/photos/i1/p1.jpg');
    });
  });

  // Une URL déjà publique est renvoyée telle quelle : c'est le cas en
  // production, et c'est pourquoi les photos y fonctionnaient.
  it('ne touche pas à une URL déjà publique', async () => {
    const public_ = 'https://cdn.citycare.fr/photos/i1/p1.jpg';
    expect(await resolve('http://192.168.1.152:5158', public_)).toBe(public_);
    expect(await resolve('http://172.20.10.245/api', public_)).toBe(public_);
  });
});
