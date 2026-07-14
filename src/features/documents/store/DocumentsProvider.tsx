import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import { getDocuments } from '@/features/documents/api/getDocuments';
import {
  documentsReducer,
  initialDocumentsState,
  type DocumentsState,
} from '@/features/documents/store/documentsReducer';
import {
  loadLocalDocuments,
  saveLocalDocuments,
} from '@/features/documents/store/localDocumentsStorage';
import {
  loadRemoteDocumentsCache,
  saveRemoteDocumentsCache,
} from '@/features/documents/store/remoteDocumentsCache';
import type { Contributor, Document } from '@/features/documents/types';
import { t } from '@/shared/i18n/t';

// Stands in for the authenticated user's real name/id — there's no login/session anywhere in
// this app (the reference server has no auth), so a locally-created document always credits this
// placeholder contributor instead of leaving the list empty.
const CURRENT_USER_CONTRIBUTOR: Contributor = {
  id: 'current-user',
  name: t('documents.currentUserContributorName'),
};

export type AddLocalDocumentInput = {
  title: string;
  version: string;
  attachments?: string[];
};

export type DocumentsContextValue = DocumentsState & {
  refetch: () => Promise<void>;
  addLocalDocument: (input: AddLocalDocumentInput) => void;
};

export const DocumentsContext = createContext<DocumentsContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function DocumentsProvider({ children }: Props) {
  const [state, dispatch] = useReducer(documentsReducer, initialDocumentsState);
  // Guards the persist effect below from firing (with an empty array) before hydration has had
  // a chance to load whatever was saved in a previous session — otherwise the very first render
  // would immediately overwrite that saved data with `[]`. Set (synchronously, right after the
  // HYDRATE dispatch) once loadLocalDocuments() resolves.
  const hasHydratedRef = useRef(false);
  // Guards the mount effect itself against running twice (React StrictMode double-invokes
  // effects in development) — without this, a double-run would dispatch HYDRATE_LOCAL_DOCUMENTS
  // twice and duplicate every persisted local document.
  const hydrationStartedRef = useRef(false);

  const refetch = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const documents = await getDocuments();
      const cachedAt = new Date().toISOString();
      dispatch({ type: 'FETCH_SUCCESS', documents, cachedAt });
      saveRemoteDocumentsCache(documents, cachedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'FETCH_ERROR', error: message });
    }
  }, []);

  useEffect(() => {
    if (hydrationStartedRef.current) {
      return;
    }
    hydrationStartedRef.current = true;
    (async () => {
      const [localDocuments, remoteCache] = await Promise.all([
        loadLocalDocuments(),
        loadRemoteDocumentsCache(),
      ]);
      // Always dispatch, even with an empty array: this guarantees `state.documents` gets a new
      // reference right as `hasHydratedRef` flips to true, so the persist effect below reliably
      // re-runs afterwards — covering the edge case where addLocalDocument() was called while
      // hydration was still in flight (which the persist effect would otherwise have skipped).
      dispatch({ type: 'HYDRATE_LOCAL_DOCUMENTS', documents: localDocuments });
      if (remoteCache) {
        dispatch({
          type: 'HYDRATE_REMOTE_CACHE',
          documents: remoteCache.documents,
          cachedAt: remoteCache.cachedAt,
        });
      }
      hasHydratedRef.current = true;
      refetch();
    })();
  }, [refetch]);

  const addLocalDocument = useCallback((input: AddLocalDocumentInput) => {
    const now = new Date().toISOString();
    const document: Document = {
      id: Crypto.randomUUID(),
      title: input.title,
      version: input.version,
      createdAt: now,
      updatedAt: now,
      attachments: input.attachments ?? [],
      contributors: [CURRENT_USER_CONTRIBUTOR],
      origin: 'local',
    };
    dispatch({ type: 'ADD_LOCAL_DOCUMENT', document });
  }, []);

  // Persist whenever the local subset of `documents` changes — covers both creation and the
  // initial hydration (a harmless no-op re-write of what was just loaded). Simpler than trying
  // to track "did local documents actually change" separately, and cheap at this app's scale.
  const localDocuments = useMemo(
    () => state.documents.filter((document) => document.origin === 'local'),
    [state.documents],
  );

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }
    saveLocalDocuments(localDocuments);
  }, [localDocuments]);

  return (
    <DocumentsContext.Provider value={{ ...state, refetch, addLocalDocument }}>
      {children}
    </DocumentsContext.Provider>
  );
}
