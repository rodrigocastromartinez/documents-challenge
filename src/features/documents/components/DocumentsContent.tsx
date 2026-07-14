import { FlatList, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';

import { DocumentGridItem } from '@/features/documents/components/DocumentGridItem';
import { DocumentListItem } from '@/features/documents/components/DocumentListItem';
import type { ViewMode } from '@/features/documents/components/ViewToggle';
import type { DocumentsStatus } from '@/features/documents/store';
import { EmptyState, ErrorView, Spinner } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n/t';
import type { Document } from '@/features/documents/types';

const GRID_COLUMNS = 2;

type Props = {
  status: DocumentsStatus;
  documents: Document[];
  viewMode: ViewMode;
  onRefresh: () => void;
};

export function DocumentsContent({ status, documents, viewMode, onRefresh }: Props) {
  const gridItemWidth = useGridItemWidth();

  if (status === 'loading' && documents.length === 0) {
    return <Spinner testID="documents-screen-loading" />;
  }

  if (status === 'error' && documents.length === 0) {
    return (
      <ErrorView
        testID="documents-screen-error"
        message={t('documents.loadError')}
        onRetry={onRefresh}
      />
    );
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
      columnWrapperStyle={isGrid && documents.length > 0 ? styles.columnWrapper : undefined}
      numColumns={isGrid ? GRID_COLUMNS : 1}
      data={documents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) =>
        isGrid ? (
          <DocumentGridItem document={item} width={gridItemWidth} />
        ) : (
          <DocumentListItem document={item} />
        )
      }
      // Rendering the empty state inside the list (rather than returning early) keeps
      // pull-to-refresh available when there's nothing to show — otherwise an empty result
      // would leave no way to recover except restarting the app.
      ListEmptyComponent={
        <EmptyState
          testID="documents-screen-empty"
          title={t('documents.empty')}
          description={t('documents.emptyDescription')}
        />
      }
      refreshControl={
        <RefreshControl
          testID="documents-screen-refresh-control"
          refreshing={status === 'loading'}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
}

function useGridItemWidth() {
  const { width } = useWindowDimensions();
  const horizontalPadding = spacing.lg * 2;
  const gaps = spacing.md * (GRID_COLUMNS - 1);
  return (width - horizontalPadding - gaps) / GRID_COLUMNS;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    // Lets ListEmptyComponent's flex:1 center itself vertically in the available space.
    flexGrow: 1,
  },
  columnWrapper: {
    gap: spacing.md,
  },
});
