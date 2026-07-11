import { createContext, useCallback, useEffect, useReducer, type ReactNode } from 'react';

import { getDocuments } from '@/features/documents/api/getDocuments';
import {
  documentsReducer,
  initialDocumentsState,
  type DocumentsState,
} from '@/features/documents/store/documentsReducer';

export type DocumentsContextValue = DocumentsState & {
  refetch: () => Promise<void>;
};

export const DocumentsContext = createContext<DocumentsContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function DocumentsProvider({ children }: Props) {
  const [state, dispatch] = useReducer(documentsReducer, initialDocumentsState);

  const refetch = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const documents = await getDocuments();
      dispatch({ type: 'FETCH_SUCCESS', documents });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'FETCH_ERROR', error: message });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <DocumentsContext.Provider value={{ ...state, refetch }}>{children}</DocumentsContext.Provider>
  );
}
