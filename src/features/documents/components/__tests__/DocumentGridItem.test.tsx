import { render, screen } from '@testing-library/react-native';

import { DocumentGridItem } from '@/features/documents/components/DocumentGridItem';
import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';
import type { Document } from '@/features/documents/types';

const document: Document = {
  id: 'doc-1',
  title: 'Hop Rod Rye',
  version: '2.6.16',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: ['Light Lager'],
  contributors: [{ id: 'user-1', name: 'Carlie Abott' }],
  origin: 'remote',
};

// Computed rather than hardcoded, so this stays correct no matter what "now" is when the test
// suite runs (formatRelativeDate's output for a fixed createdAt shifts over time).
const expectedCreatedAtLabel = `Created ${formatRelativeDate(new Date(document.createdAt))}`;

describe('DocumentGridItem', () => {
  it('renders the title and version under testIDs derived from the document id', async () => {
    await render(<DocumentGridItem document={document} width={160} />);

    expect(screen.getByTestId('document-grid-item-doc-1')).toBeOnTheScreen();
    expect(screen.getByTestId('document-grid-item-doc-1-title').props.children).toBe('Hop Rod Rye');
    expect(screen.getByTestId('document-grid-item-doc-1-version').props.children).toBe(
      'Version 2.6.16',
    );
  });

  it('renders the created-at label using the bounded relative formatter', async () => {
    await render(<DocumentGridItem document={document} width={160} />);

    expect(screen.getByTestId('document-grid-item-doc-1-created-at').props.children).toBe(
      expectedCreatedAtLabel,
    );
  });

  it('exposes a combined accessibility label', async () => {
    await render(<DocumentGridItem document={document} width={160} />);

    expect(
      screen.getByLabelText(`Hop Rod Rye, Version 2.6.16, ${expectedCreatedAtLabel}`),
    ).toBeOnTheScreen();
  });
});
