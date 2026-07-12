import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getDocuments } from '@/features/documents/api/getDocuments';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { DocumentsProvider } from '@/features/documents/store/DocumentsProvider';
import { saveLocalDocuments } from '@/features/documents/store/localDocumentsStorage';
import type { Document } from '@/features/documents/types';

jest.mock('@/features/documents/api/getDocuments');
jest.mock('expo-crypto', () => ({ randomUUID: () => 'mock-uuid' }));

const mockedGetDocuments = getDocuments as jest.MockedFunction<typeof getDocuments>;

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

describe('useDocuments', () => {
  afterEach(async () => {
    // clearAllMocks (not resetAllMocks): the AsyncStorage mock's methods are themselves
    // jest.fn()-wrapped with a real in-memory implementation, which resetAllMocks would strip
    // permanently (there's nothing to "restore" it to, unlike jest.spyOn). clearAllMocks only
    // clears call history, which is all that's needed between tests here.
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('throws when used outside a DocumentsProvider', async () => {
    await expect(renderHook(() => useDocuments())).rejects.toThrow(
      'useDocuments must be used within a DocumentsProvider',
    );
  });

  it('fetches documents on mount and exposes them once loaded', async () => {
    mockedGetDocuments.mockResolvedValueOnce([doc('1')]);

    const { result } = await renderHook(() => useDocuments(), {
      wrapper: DocumentsProvider,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.documents).toEqual([doc('1')]);
    expect(mockedGetDocuments).toHaveBeenCalledTimes(1);
  });

  it('transitions to an error state when the fetch rejects', async () => {
    mockedGetDocuments.mockRejectedValueOnce(new Error('network down'));

    const { result } = await renderHook(() => useDocuments(), {
      wrapper: DocumentsProvider,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.status === 'error' && result.current.error).toBe('network down');
  });

  it('refetch() re-fetches and replaces the documents', async () => {
    mockedGetDocuments.mockResolvedValueOnce([doc('1')]);

    const { result } = await renderHook(() => useDocuments(), {
      wrapper: DocumentsProvider,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    mockedGetDocuments.mockResolvedValueOnce([doc('2')]);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockedGetDocuments).toHaveBeenCalledTimes(2);
    expect(result.current.documents).toEqual([doc('2')]);
  });

  it('hydrates persisted local documents on mount, ahead of the fetched remote ones', async () => {
    const persistedLocal: Document = { ...doc('local-1'), origin: 'local' };
    await saveLocalDocuments([persistedLocal]);
    mockedGetDocuments.mockResolvedValueOnce([doc('remote-1')]);

    const { result } = await renderHook(() => useDocuments(), {
      wrapper: DocumentsProvider,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.documents).toEqual([persistedLocal, doc('remote-1')]);
  });

  it('addLocalDocument prepends a new local document and persists it to storage', async () => {
    mockedGetDocuments.mockResolvedValueOnce([doc('remote-1')]);

    const { result } = await renderHook(() => useDocuments(), {
      wrapper: DocumentsProvider,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    await act(async () => {
      result.current.addLocalDocument({ title: 'New doc', version: '1.0.0' });
    });

    await waitFor(() => {
      expect(result.current.documents[0]?.title).toBe('New doc');
    });
    expect(result.current.documents[0]?.origin).toBe('local');
    expect(result.current.documents[0]?.id).toBe('mock-uuid');
    expect(result.current.documents[0]?.contributors).toEqual([
      { id: 'current-user', name: 'You' },
    ]);
    expect(result.current.documents).toHaveLength(2);

    const persisted = await AsyncStorage.getItem('documents.local.v1');
    expect(JSON.parse(persisted ?? '[]')).toHaveLength(1);
  });

  it('preserves a locally-added document across a refetch', async () => {
    mockedGetDocuments.mockResolvedValueOnce([doc('remote-1')]);

    const { result } = await renderHook(() => useDocuments(), {
      wrapper: DocumentsProvider,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    await act(async () => {
      result.current.addLocalDocument({ title: 'New doc', version: '1.0.0' });
    });

    await waitFor(() => {
      expect(result.current.documents).toHaveLength(2);
    });

    mockedGetDocuments.mockResolvedValueOnce([doc('remote-2')]);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.documents.map((document) => document.id)).toEqual([
      'mock-uuid',
      'remote-2',
    ]);
  });
});
