import {
  documentsReducer,
  initialDocumentsState,
  type DocumentsState,
} from '@/features/documents/store/documentsReducer';
import type { Document } from '@/features/documents/types';

const doc = (id: string, origin: Document['origin'] = 'remote'): Document => ({
  id,
  title: `Document ${id}`,
  version: '1.0.0',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
  origin,
});

const CACHED_AT = '2026-07-12T10:00:00.000Z';

describe('documentsReducer', () => {
  it('starts in a loading state with no documents', () => {
    expect(initialDocumentsState).toEqual({ status: 'loading', documents: [], cachedAt: null });
  });

  it('FETCH_START moves to loading, keeping documents and cachedAt already loaded', () => {
    const state: DocumentsState = {
      status: 'success',
      documents: [doc('1')],
      cachedAt: CACHED_AT,
    };

    expect(documentsReducer(state, { type: 'FETCH_START' })).toEqual({
      status: 'loading',
      documents: [doc('1')],
      cachedAt: CACHED_AT,
    });
  });

  it('FETCH_SUCCESS replaces the documents, clears any prior error, and stamps cachedAt', () => {
    const state: DocumentsState = {
      status: 'error',
      documents: [doc('1')],
      cachedAt: null,
      error: 'boom',
    };

    expect(
      documentsReducer(state, {
        type: 'FETCH_SUCCESS',
        documents: [doc('2')],
        cachedAt: CACHED_AT,
      }),
    ).toEqual({
      status: 'success',
      documents: [doc('2')],
      cachedAt: CACHED_AT,
    });
  });

  it('FETCH_ERROR keeps documents and cachedAt already loaded and records the error', () => {
    const state: DocumentsState = {
      status: 'loading',
      documents: [doc('1')],
      cachedAt: CACHED_AT,
    };

    expect(documentsReducer(state, { type: 'FETCH_ERROR', error: 'network down' })).toEqual({
      status: 'error',
      documents: [doc('1')],
      cachedAt: CACHED_AT,
      error: 'network down',
    });
  });

  it('FETCH_SUCCESS preserves existing local documents ahead of the newly fetched remote ones', () => {
    const state: DocumentsState = {
      status: 'loading',
      documents: [doc('local-1', 'local'), doc('remote-old', 'remote')],
      cachedAt: null,
    };

    expect(
      documentsReducer(state, {
        type: 'FETCH_SUCCESS',
        documents: [doc('remote-new')],
        cachedAt: CACHED_AT,
      }),
    ).toEqual({
      status: 'success',
      documents: [doc('local-1', 'local'), doc('remote-new')],
      cachedAt: CACHED_AT,
    });
  });

  it('HYDRATE_LOCAL_DOCUMENTS prepends persisted local documents ahead of whatever is loaded', () => {
    const state: DocumentsState = {
      status: 'loading',
      documents: [doc('remote-1')],
      cachedAt: null,
    };

    expect(
      documentsReducer(state, {
        type: 'HYDRATE_LOCAL_DOCUMENTS',
        documents: [doc('local-1', 'local')],
      }),
    ).toEqual({
      status: 'loading',
      documents: [doc('local-1', 'local'), doc('remote-1')],
      cachedAt: null,
    });
  });

  it('HYDRATE_REMOTE_CACHE appends cached remote documents behind local ones and sets cachedAt', () => {
    const state: DocumentsState = {
      status: 'loading',
      documents: [doc('local-1', 'local')],
      cachedAt: null,
    };

    expect(
      documentsReducer(state, {
        type: 'HYDRATE_REMOTE_CACHE',
        documents: [doc('remote-cached')],
        cachedAt: CACHED_AT,
      }),
    ).toEqual({
      status: 'loading',
      documents: [doc('local-1', 'local'), doc('remote-cached')],
      cachedAt: CACHED_AT,
    });
  });

  it('ADD_LOCAL_DOCUMENT prepends the new document', () => {
    const state: DocumentsState = {
      status: 'success',
      documents: [doc('remote-1')],
      cachedAt: null,
    };

    expect(
      documentsReducer(state, { type: 'ADD_LOCAL_DOCUMENT', document: doc('local-1', 'local') }),
    ).toEqual({
      status: 'success',
      documents: [doc('local-1', 'local'), doc('remote-1')],
      cachedAt: null,
    });
  });
});
