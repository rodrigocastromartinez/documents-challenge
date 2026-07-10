import { t } from '@/shared/i18n/t';

describe('t', () => {
  it('looks up a string by key', () => {
    expect(t('documents.title')).toBe('Documents');
    expect(t('common.retry')).toBe('Retry');
  });
});
