import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentsContent } from '@/features/documents/components/DocumentsContent';
import { ViewToggle, type ViewMode } from '@/features/documents/components/ViewToggle';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { Text } from '@/shared/components/Text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';

export function DocumentsScreen() {
  const { status, documents, refetch } = useDocuments();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
      testID="documents-screen"
    >
      <View style={styles.header}>
        <Text variant="title" testID="documents-screen-title">
          {t('documents.title')}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.controls}>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </View>
        <DocumentsContent
          status={status}
          documents={documents}
          viewMode={viewMode}
          onRetry={refetch}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
