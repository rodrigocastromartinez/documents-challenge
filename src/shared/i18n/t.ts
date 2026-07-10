import { en } from '@/shared/i18n/strings/en';

const strings = en;

export type TranslationKey = keyof typeof strings;

type TranslationParams = Record<string, string | number>;

export function t(key: TranslationKey, params?: TranslationParams): string {
  const template = strings[key];

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [paramKey, value]) => result.replaceAll(`{{${paramKey}}}`, String(value)),
    template as string,
  );
}
