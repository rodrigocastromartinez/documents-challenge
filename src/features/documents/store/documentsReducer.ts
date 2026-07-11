import type { Document } from '@/features/documents/types';

export type DocumentsStatus = 'loading' | 'success' | 'error';

export type DocumentsState =
  | { status: 'loading'; documents: Document[] }
  | { status: 'success'; documents: Document[] }
  | { status: 'error'; documents: Document[]; error: string };

export type DocumentsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; documents: Document[] }
  | { type: 'FETCH_ERROR'; error: string };

export const initialDocumentsState: DocumentsState = { status: 'loading', documents: [] };

export function documentsReducer(state: DocumentsState, action: DocumentsAction): DocumentsState {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', documents: state.documents };
    case 'FETCH_SUCCESS':
      return { status: 'success', documents: action.documents };
    case 'FETCH_ERROR':
      return { status: 'error', documents: state.documents, error: action.error };
    default:
      return state;
  }
}
