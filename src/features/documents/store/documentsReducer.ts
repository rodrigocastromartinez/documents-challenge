import type { Document } from '@/features/documents/types';

export type DocumentsStatus = 'loading' | 'success' | 'error';

export type DocumentsState =
  | { status: 'loading'; documents: Document[] }
  | { status: 'success'; documents: Document[] }
  | { status: 'error'; documents: Document[]; error: string };

export type DocumentsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; documents: Document[] }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'HYDRATE_LOCAL_DOCUMENTS'; documents: Document[] }
  | { type: 'ADD_LOCAL_DOCUMENT'; document: Document };

export const initialDocumentsState: DocumentsState = { status: 'loading', documents: [] };

export function documentsReducer(state: DocumentsState, action: DocumentsAction): DocumentsState {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', documents: state.documents };
    case 'FETCH_SUCCESS': {
      // The server has no knowledge of locally-created documents (see TECH-PLAN.md §1) — a
      // fetch only ever returns "remote" ones, so any "local" documents already in state must
      // be preserved here rather than replaced, or they'd vanish on the next refetch/refresh.
      const localDocuments = state.documents.filter((document) => document.origin === 'local');
      return { status: 'success', documents: [...localDocuments, ...action.documents] };
    }
    case 'FETCH_ERROR':
      return { status: 'error', documents: state.documents, error: action.error };
    case 'HYDRATE_LOCAL_DOCUMENTS':
      return { ...state, documents: [...action.documents, ...state.documents] };
    case 'ADD_LOCAL_DOCUMENT':
      return { ...state, documents: [action.document, ...state.documents] };
    default:
      return state;
  }
}
