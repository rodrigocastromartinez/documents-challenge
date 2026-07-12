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

describe('documentsReducer', () => {
  it('starts in a loading state with no documents', () => {
    expect(initialDocumentsState).toEqual({ status: 'loading', documents: [] });
  });

  it('FETCH_START moves to loading, keeping any documents already loaded', () => {
    const state: DocumentsState = { status: 'success', documents: [doc('1')] };

    expect(documentsReducer(state, { type: 'FETCH_START' })).toEqual({
      status: 'loading',
      documents: [doc('1')],
    });
  });

  it('FETCH_SUCCESS replaces the documents and clears any prior error', () => {
    const state: DocumentsState = { status: 'error', documents: [doc('1')], error: 'boom' };

    expect(documentsReducer(state, { type: 'FETCH_SUCCESS', documents: [doc('2')] })).toEqual({
      status: 'success',
      documents: [doc('2')],
    });
  });

  it('FETCH_ERROR keeps documents already loaded and records the error', () => {
    const state: DocumentsState = { status: 'loading', documents: [doc('1')] };

    expect(documentsReducer(state, { type: 'FETCH_ERROR', error: 'network down' })).toEqual({
      status: 'error',
      documents: [doc('1')],
      error: 'network down',
    });
  });

  it('FETCH_SUCCESS preserves existing local documents ahead of the newly fetched remote ones', () => {
    const state: DocumentsState = {
      status: 'loading',
      documents: [doc('local-1', 'local'), doc('remote-old', 'remote')],
    };

    expect(
      documentsReducer(state, { type: 'FETCH_SUCCESS', documents: [doc('remote-new')] }),
    ).toEqual({
      status: 'success',
      documents: [doc('local-1', 'local'), doc('remote-new')],
    });
  });

  it('HYDRATE_LOCAL_DOCUMENTS prepends persisted local documents ahead of whatever is loaded', () => {
    const state: DocumentsState = { status: 'loading', documents: [doc('remote-1')] };

    expect(
      documentsReducer(state, {
        type: 'HYDRATE_LOCAL_DOCUMENTS',
        documents: [doc('local-1', 'local')],
      }),
    ).toEqual({
      status: 'loading',
      documents: [doc('local-1', 'local'), doc('remote-1')],
    });
  });

  it('ADD_LOCAL_DOCUMENT prepends the new document', () => {
    const state: DocumentsState = { status: 'success', documents: [doc('remote-1')] };

    expect(
      documentsReducer(state, { type: 'ADD_LOCAL_DOCUMENT', document: doc('local-1', 'local') }),
    ).toEqual({
      status: 'success',
      documents: [doc('local-1', 'local'), doc('remote-1')],
    });
  });
});
