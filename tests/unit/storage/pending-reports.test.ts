import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearRejectedReports,
  enqueueReport,
  listPendingReports,
  listRejectedReports,
  recordFailedAttempt,
  rejectReport,
  removePendingReport,
} from '@/storage/pending-reports';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const report = {
  latitude: 45.75,
  longitude: 4.85,
  type: 'Road' as const,
  description: 'Nid-de-poule',
  photos: [],
};

beforeEach(() => AsyncStorage.clear());

describe('pending-reports', () => {
  it('part d’une file vide', async () => {
    expect(await listPendingReports()).toEqual([]);
  });

  it('met en file et rend un identifiant', async () => {
    const queued = await enqueueReport(report);
    expect(queued.id).toBeTruthy();
    expect(queued.attempts).toBe(0);
    expect(await listPendingReports()).toHaveLength(1);
  });

  it('garde l’ordre d’arrivée', async () => {
    await enqueueReport({ ...report, description: 'premier' });
    await enqueueReport({ ...report, description: 'second' });
    const queue = await listPendingReports();
    expect(queue.map((r) => r.description)).toEqual(['premier', 'second']);
  });

  it('sort de la file une fois envoyé', async () => {
    const queued = await enqueueReport(report);
    await removePendingReport(queued.id);
    expect(await listPendingReports()).toEqual([]);
  });

  it('ne touche pas aux autres en supprimant', async () => {
    const first = await enqueueReport({ ...report, description: 'premier' });
    await enqueueReport({ ...report, description: 'second' });
    await removePendingReport(first.id);
    const queue = await listPendingReports();
    expect(queue.map((r) => r.description)).toEqual(['second']);
  });

  // Échec réseau : rien ne cloche dans le signalement, on garde et on compte.
  it('compte les tentatives sans jeter le signalement', async () => {
    const queued = await enqueueReport(report);
    expect(await recordFailedAttempt(queued.id)).toBe(true);
    const queue = await listPendingReports();
    expect(queue[0].attempts).toBe(1);
  });

  // Passé un seuil, insister reviendrait à empoisonner tous les envois suivants.
  it('abandonne après cinq tentatives', async () => {
    const queued = await enqueueReport(report);
    for (let i = 0; i < 4; i++) await recordFailedAttempt(queued.id);
    expect(await recordFailedAttempt(queued.id)).toBe(false);

    expect(await listPendingReports()).toEqual([]);
    const rejected = await listRejectedReports();
    expect(rejected).toHaveLength(1);
    expect(rejected[0].description).toBe('Nid-de-poule');
  });

  // Le serveur a répondu et refusé : inutile d'insister, mais il faut le dire.
  it('verse un refus du serveur dans les refusés', async () => {
    const queued = await enqueueReport(report);
    await rejectReport(queued.id, 'Description trop longue');

    expect(await listPendingReports()).toEqual([]);
    const rejected = await listRejectedReports();
    expect(rejected[0].reason).toBe('Description trop longue');
  });

  it('n’invente rien pour un identifiant inconnu', async () => {
    await enqueueReport(report);
    expect(await recordFailedAttempt('inconnu')).toBe(false);
    await rejectReport('inconnu', 'peu importe');
    expect(await listPendingReports()).toHaveLength(1);
    expect(await listRejectedReports()).toEqual([]);
  });

  it('oublie les refusés une fois l’utilisateur prévenu', async () => {
    const queued = await enqueueReport(report);
    await rejectReport(queued.id, 'Refusé');
    await clearRejectedReports();
    expect(await listRejectedReports()).toEqual([]);
  });

  it('ignore une file illisible plutôt que d’échouer', async () => {
    await AsyncStorage.setItem('pending_reports', 'pas du JSON');
    expect(await listPendingReports()).toEqual([]);
  });
});
