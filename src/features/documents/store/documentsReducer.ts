import type { Document } from '@/features/documents/types';

export type DocumentsStatus = 'loading' | 'success' | 'error';

// cachedAt tracks when the remote portion of `documents` was last known to be fresh — either
// hydrated from the offline cache or set by the latest successful fetch. The offline banner
// uses it for its "showing cached data from X" copy (see TECH-PLAN.md §3.8).
export type DocumentsState =
  | { status: 'loading'; documents: Document[]; cachedAt: string | null }
  | { status: 'success'; documents: Document[]; cachedAt: string | null }
  | { status: 'error'; documents: Document[]; cachedAt: string | null; error: string };

export type DocumentsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; documents: Document[]; cachedAt: string }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'HYDRATE_LOCAL_DOCUMENTS'; documents: Document[] }
  | { type: 'HYDRATE_REMOTE_CACHE'; documents: Document[]; cachedAt: string }
  | { type: 'ADD_LOCAL_DOCUMENT'; document: Document };

export const initialDocumentsState: DocumentsState = {
  status: 'loading',
  documents: [],
  cachedAt: null,
};

export function documentsReducer(state: DocumentsState, action: DocumentsAction): DocumentsState {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', documents: state.documents, cachedAt: state.cachedAt };
    case 'FETCH_SUCCESS': {
      // The server has no knowledge of locally-created documents (see TECH-PLAN.md §1) — a
      // fetch only ever returns "remote" ones, so any "local" documents already in state must
      // be preserved here rather than replaced, or they'd vanish on the next refetch/refresh.
      const localDocuments = state.documents.filter((document) => document.origin === 'local');
      return {
        status: 'success',
        documents: [...localDocuments, ...action.documents],
        cachedAt: action.cachedAt,
      };
    }
    case 'FETCH_ERROR':
      return {
        status: 'error',
        documents: state.documents,
        cachedAt: state.cachedAt,
        error: action.error,
      };
    case 'HYDRATE_LOCAL_DOCUMENTS':
      return { ...state, documents: [...action.documents, ...state.documents] };
    case 'HYDRATE_REMOTE_CACHE':
      return {
        ...state,
        documents: [...state.documents, ...action.documents],
        cachedAt: action.cachedAt,
      };
    case 'ADD_LOCAL_DOCUMENT':
      return { ...state, documents: [action.document, ...state.documents] };
    default:
      return state;
  }
}
