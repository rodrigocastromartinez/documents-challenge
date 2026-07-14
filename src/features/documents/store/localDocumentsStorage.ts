import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Document } from '@/features/documents/types';

const STORAGE_KEY = 'documents.local.v1';

export async function loadLocalDocuments(): Promise<Document[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Document[]) : [];
  } catch {
    // A missing/corrupted value should degrade to "no local documents", never crash the app.
    return [];
  }
}

export async function saveLocalDocuments(documents: Document[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch {
    // Best-effort persistence — a full disk or storage failure shouldn't block document
    // creation from working for the rest of the session.
  }
}
