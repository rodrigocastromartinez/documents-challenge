import { Share } from 'react-native';

import type { Document } from '@/features/documents/types';
import { t } from '@/shared/i18n/t';

export async function shareDocument(document: Document): Promise<void> {
  try {
    await Share.share({
      message: t('documents.shareMessage', { title: document.title, version: document.version }),
    });
  } catch {
    // Share sheet dismissal/failure isn't actionable here — nothing to recover or report.
  }
}
