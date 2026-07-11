import type { SortKey } from '@/features/documents/components/SortBySelect';
import type { Document } from '@/features/documents/types';

export function sortDocuments(documents: Document[], sortKey: SortKey): Document[] {
  const sorted = [...documents];

  if (sortKey === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return sorted;
}
