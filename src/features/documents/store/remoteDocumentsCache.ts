import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Document } from '@/features/documents/types';

const STORAGE_KEY = 'documents.cache.v1';

export type RemoteDocumentsCache = {
  documents: Document[];
  cachedAt: string;
};

export async function loadRemoteDocumentsCache(): Promise<RemoteDocumentsCache | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as RemoteDocumentsCache;
    if (!Array.isArray(parsed.documents) || typeof parsed.cachedAt !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    // A missing/corrupted cache should degrade to "no cache", never crash the app.
    return null;
  }
}

export async function saveRemoteDocumentsCache(documents: Document[]): Promise<void> {
  try {
    const cache: RemoteDocumentsCache = { documents, cachedAt: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Best-effort persistence — a storage failure shouldn't break the live fetch path.
  }
}
