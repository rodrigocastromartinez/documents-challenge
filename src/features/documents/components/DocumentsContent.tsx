import { FlatList, StyleSheet } from 'react-native';

import { DocumentGridItem } from '@/features/documents/components/DocumentGridItem';
import { DocumentListItem } from '@/features/documents/components/DocumentListItem';
import type { ViewMode } from '@/features/documents/components/ViewToggle';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorView } from '@/shared/components/ErrorView';
import { Spinner } from '@/shared/components/Spinner';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';
import type { Document } from '@/features/documents/types';

type Props = {
  status: 'loading' | 'success' | 'error';
  documents: Document[];
  viewMode: ViewMode;
  onRetry: () => void;
};

export function DocumentsContent({ status, documents, viewMode, onRetry }: Props) {
  if (status === 'loading' && documents.length === 0) {
    return <Spinner testID="documents-screen-loading" />;
  }

  if (status === 'error' && documents.length === 0) {
    return (
      <ErrorView
        testID="documents-screen-error"
        message={t('documents.loadError')}
        onRetry={onRetry}
      />
    );
  }

  if (documents.length === 0) {
    return <EmptyState testID="documents-screen-empty" title={t('documents.empty')} />;
  }

  const isGrid = viewMode === 'grid';

  return (
    <FlatList
      // FlatList throws if numColumns changes on an already-mounted list; keying by viewMode
      // forces a remount instead (see AGENTS.md gotchas log / TECH-PLAN §3.7).
      key={viewMode}
      testID="documents-screen-list"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={isGrid ? styles.columnWrapper : undefined}
      numColumns={isGrid ? 2 : 1}
      data={documents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) =>
        isGrid ? <DocumentGridItem document={item} /> : <DocumentListItem document={item} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    gap: spacing.md,
  },
});
