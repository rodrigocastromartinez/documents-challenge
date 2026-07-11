import { FlatList, StyleSheet } from 'react-native';

import { DocumentListItem } from '@/features/documents/components/DocumentListItem';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorView } from '@/shared/components/ErrorView';
import { Spinner } from '@/shared/components/Spinner';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';
import type { Document } from '@/features/documents/types';

type Props = {
  status: 'loading' | 'success' | 'error';
  documents: Document[];
  onRetry: () => void;
};

export function DocumentsContent({ status, documents, onRetry }: Props) {
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

  return (
    <FlatList
      testID="documents-screen-list"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={documents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <DocumentListItem document={item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
