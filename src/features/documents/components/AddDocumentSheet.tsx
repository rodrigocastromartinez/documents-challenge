import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { AddLocalDocumentInput } from '@/features/documents/store';
import { Button, Text } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n/t';

// Placeholder filename dropped into the form when "Choose file" is pressed. The reference
// server has no upload endpoint (see TECH-PLAN.md §1), so wiring up a real native file picker
// wouldn't buy any real behavior — expo-document-picker is the right library to reach for if
// this field becomes functional later (see TECH-PLAN.md §3.7).
const PLACEHOLDER_FILE_NAME = 'document.pdf';

const isIOS = Platform.OS === 'ios';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: AddLocalDocumentInput) => void;
};

export function AddDocumentSheet({ visible, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  function reset() {
    setName('');
    setVersion('');
    setFileName(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  const trimmedName = name.trim();
  const trimmedVersion = version.trim();
  const isFormComplete = trimmedName.length > 0 && trimmedVersion.length > 0 && fileName !== null;

  function handleSubmit() {
    if (!isFormComplete) {
      return;
    }
    onSubmit({
      title: trimmedName,
      version: trimmedVersion,
      attachments: fileName ? [fileName] : [],
    });
    reset();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      testID="add-document-sheet"
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleClose}
        testID="add-document-sheet-backdrop"
      />
      <KeyboardAvoidingView behavior={isIOS ? 'padding' : undefined} style={styles.sheetWrapper}>
        <View style={[styles.sheet, { paddingBottom: isIOS ? spacing.xxl : spacing.sm }]}>
          <View style={styles.header}>
            <Text variant="subtitle">{t('documents.addDocumentSheet.title')}</Text>
            <Pressable
              onPress={handleClose}
              testID="add-document-sheet-close"
              accessibilityRole="button"
              accessibilityLabel={t('documents.addDocumentSheet.close')}
              hitSlop={8}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <Text variant="body" color={colors.text} style={styles.subtitle}>
            {t('documents.addDocumentSheet.subtitle')}
          </Text>

          <Text variant="caption" style={styles.fieldLabel}>
            {t('documents.addDocumentSheet.nameLabel')}
          </Text>
          <TextInput
            testID="add-document-sheet-name-input"
            value={name}
            onChangeText={setName}
            placeholder={t('documents.addDocumentSheet.namePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel={t('documents.addDocumentSheet.nameLabel')}
            autoCapitalize="sentences"
            returnKeyType="next"
            maxLength={120}
            style={styles.input}
          />

          <Text variant="caption" style={styles.fieldLabel}>
            {t('documents.addDocumentSheet.versionLabel')}
          </Text>
          <TextInput
            testID="add-document-sheet-version-input"
            value={version}
            onChangeText={setVersion}
            placeholder={t('documents.addDocumentSheet.versionPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel={t('documents.addDocumentSheet.versionLabel')}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={30}
            style={styles.input}
          />

          <Text variant="caption" style={styles.fieldLabel}>
            {t('documents.addDocumentSheet.fileLabel')}
          </Text>
          <View style={styles.chooseFileContainer}>
            <Button
              testID="add-document-sheet-choose-file"
              label={fileName ?? t('documents.addDocumentSheet.chooseFile')}
              variant="secondary"
              onPress={() => setFileName(PLACEHOLDER_FILE_NAME)}
            />
          </View>

          <View style={styles.submitContainer}>
            <Button
              testID="add-document-sheet-submit"
              label={t('documents.addDocumentSheet.submit')}
              onPress={handleSubmit}
              disabled={!isFormComplete}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeIcon: {
    fontSize: 20,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  subtitle: {
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  chooseFileContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    color: colors.text,
  },
  submitContainer: {
    marginTop: spacing.xs,
  },
});
