import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getDocuments } from '@/features/documents/api/getDocuments';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { DocumentsProvider } from '@/features/documents/store/DocumentsProvider';
import type { Document } from '@/features/documents/types';

jest.mock('@/features/documents/api/getDocuments');

const mockedGetDocuments = getDocuments as jest.MockedFunction<typeof getDocuments>;

const doc = (id: string): Document => ({
  id,
  title: `Document ${id}`,
  version: '1.0.0',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
});

describe('useDocuments', () => {
  afterEach(() => {
    jest.resetAllMocks();
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
});
