import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AddDocumentSheet,
  DocumentsContent,
  OfflineBanner,
  SortBySelect,
  ViewToggle,
  type OfflineBannerReason,
  type SortKey,
  type ViewMode,
} from '@/features/documents/components';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { sortDocuments } from '@/features/documents/sortDocuments';
import { NotificationBanner, NotificationBell } from '@/features/notifications';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { Button, Text } from '@/shared/components';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n/t';

// Android needs to opt into LayoutAnimation on the legacy bridge; on iOS and on the New
// Architecture (Fabric) this is already enabled and the call is a no-op.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function DocumentsScreen() {
  const { status, documents, cachedAt, refetch, addLocalDocument } = useDocuments();
  const { unreadCount, latestMessage, markAllRead } = useNotifications();
  const isOnline = useIsOnline();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const sortedDocuments = useMemo(() => sortDocuments(documents, sortKey), [documents, sortKey]);

  // NetInfo catches connectivity loss proactively; a failed fetch with data still on screen
  // covers the server being unreachable while the network itself is fine — a distinct reason
  // from actually being offline, so the banner doesn't claim "offline" when it isn't.
  const staleDataReason: OfflineBannerReason | null =
    documents.length === 0
      ? null
      : !isOnline
        ? 'offline'
        : status === 'error'
          ? 'serverError'
          : null;

  function handleViewModeChange(mode: ViewMode) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(mode);
  }

  function handleSortKeyChange(key: SortKey) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSortKey(key);
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
      testID="documents-screen"
    >
      <View style={styles.header}>
        <Text variant="title" testID="documents-screen-title" accessibilityRole="header">
          {t('documents.title')}
        </Text>
        <NotificationBell
          unreadCount={unreadCount}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            markAllRead();
          }}
        />
      </View>
      <View style={styles.content}>
        {staleDataReason ? <OfflineBanner reason={staleDataReason} cachedAt={cachedAt} /> : null}
        <NotificationBanner message={latestMessage} />
        <View style={styles.controls}>
          <SortBySelect value={sortKey} onChange={handleSortKeyChange} />
          <ViewToggle value={viewMode} onChange={handleViewModeChange} />
        </View>
        <DocumentsContent
          status={status}
          documents={sortedDocuments}
          viewMode={viewMode}
          onRefresh={refetch}
        />
      </View>
      <View style={styles.footer}>
        <Button
          testID="documents-screen-add-button"
          label={t('documents.addDocument')}
          onPress={() => setIsAddSheetOpen(true)}
        />
      </View>
      <AddDocumentSheet
        visible={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSubmit={(input) => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          addLocalDocument(input);
          setIsAddSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    // Sits above DocumentsContent's FlatList so SortBySelect's absolutely-positioned dropdown
    // isn't painted over by list content rendered after it in the tree.
    zIndex: 1,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
