import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentsContent } from '@/features/documents/components/DocumentsContent';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { Text } from '@/shared/components/Text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';

export function DocumentsScreen() {
  const { status, documents, refetch } = useDocuments();

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
        <DocumentsContent status={status} documents={documents} onRetry={refetch} />
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
});
