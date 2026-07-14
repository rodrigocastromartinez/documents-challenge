import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadRemoteDocumentsCache,
  saveRemoteDocumentsCache,
} from '@/features/documents/store/remoteDocumentsCache';
import type { Document } from '@/features/documents/types';

const doc = (id: string): Document => ({
  id,
  title: `Document ${id}`,
  version: '1.0.0',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
  origin: 'remote',
});

describe('remoteDocumentsCache', () => {
  afterEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('round-trips documents along with the given cachedAt timestamp', async () => {
    const cachedAt = '2026-07-12T10:00:00.000Z';
    await saveRemoteDocumentsCache([doc('1')], cachedAt);

    const cache = await loadRemoteDocumentsCache();

    expect(cache?.documents).toEqual([doc('1')]);
    expect(cache?.cachedAt).toBe(cachedAt);
  });

  it('returns null when nothing has been cached yet', async () => {
    await expect(loadRemoteDocumentsCache()).resolves.toBeNull();
  });

  it('returns null for corrupted JSON', async () => {
    await AsyncStorage.setItem('documents.cache.v1', 'not json');

    await expect(loadRemoteDocumentsCache()).resolves.toBeNull();
  });

  it('returns null when the stored value has the wrong shape', async () => {
    await AsyncStorage.setItem('documents.cache.v1', JSON.stringify({ documents: 'nope' }));

    await expect(loadRemoteDocumentsCache()).resolves.toBeNull();
  });

  it('swallows storage write failures', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

    await expect(
      saveRemoteDocumentsCache([doc('1')], '2026-07-12T10:00:00.000Z'),
    ).resolves.toBeUndefined();
  });
});
