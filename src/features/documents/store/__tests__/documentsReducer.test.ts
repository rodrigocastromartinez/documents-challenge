import {
  documentsReducer,
  initialDocumentsState,
  type DocumentsState,
} from '@/features/documents/store/documentsReducer';
import type { Document } from '@/features/documents/types';

const doc = (id: string): Document => ({
  id,
  title: `Document ${id}`,
  version: '1.0.0',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
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
});
