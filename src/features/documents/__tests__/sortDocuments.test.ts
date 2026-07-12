import { sortDocuments } from '@/features/documents/sortDocuments';
import type { Document } from '@/features/documents/types';

const doc = (id: string, title: string, createdAt: string): Document => ({
  id,
  title,
  version: '1.0.0',
  createdAt,
  updatedAt: createdAt,
  attachments: [],
  contributors: [],
  origin: 'remote',
});

// Deliberately diverging title/date order, so a test asserting the wrong sort key would fail
// instead of accidentally passing.
const older = doc('a', 'Alpha', '2020-01-01T00:00:00.000Z');
const newer = doc('b', 'Zeta', '2026-01-01T00:00:00.000Z');

describe('sortDocuments', () => {
  it('sorts by date descending (most recent first)', () => {
    expect(sortDocuments([older, newer], 'date')).toEqual([newer, older]);
  });

  it('sorts by title ascending', () => {
    expect(sortDocuments([newer, older], 'title')).toEqual([older, newer]);
  });

  it('does not mutate the input array', () => {
    // Input order deliberately differs from the sorted-by-title result (older, newer) below —
    // otherwise an in-place sort would coincidentally leave `input` looking "unmutated".
    const input = [newer, older];
    sortDocuments(input, 'title');
    expect(input).toEqual([newer, older]);
  });
});
