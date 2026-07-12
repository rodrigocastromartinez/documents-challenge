import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadLocalDocuments,
  saveLocalDocuments,
} from '@/features/documents/store/localDocumentsStorage';
import type { Document } from '@/features/documents/types';

const doc = (id: string): Document => ({
  id,
  title: `Document ${id}`,
  version: '1.0.0',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
  origin: 'local',
});

describe('localDocumentsStorage', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns an empty array when nothing has been saved yet', async () => {
    await expect(loadLocalDocuments()).resolves.toEqual([]);
  });

  it('round-trips whatever was saved', async () => {
    await saveLocalDocuments([doc('1'), doc('2')]);

    await expect(loadLocalDocuments()).resolves.toEqual([doc('1'), doc('2')]);
  });

  it('returns an empty array when the stored value is corrupted JSON', async () => {
    await AsyncStorage.setItem('documents.local.v1', 'not json{{{');

    await expect(loadLocalDocuments()).resolves.toEqual([]);
  });

  it('returns an empty array when the stored value is valid JSON but not an array', async () => {
    await AsyncStorage.setItem('documents.local.v1', JSON.stringify({ not: 'an array' }));

    await expect(loadLocalDocuments()).resolves.toEqual([]);
  });

  it('does not throw when the underlying storage write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(saveLocalDocuments([doc('1')])).resolves.toBeUndefined();
  });
});
