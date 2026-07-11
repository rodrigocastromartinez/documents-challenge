import { render, screen } from '@testing-library/react-native';

import { DocumentGridItem } from '@/features/documents/components/DocumentGridItem';
import type { Document } from '@/features/documents/types';

const document: Document = {
  id: 'doc-1',
  title: 'Hop Rod Rye',
  version: '2.6.16',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: ['Light Lager'],
  contributors: [{ id: 'user-1', name: 'Carlie Abott' }],
};

describe('DocumentGridItem', () => {
  it('renders the title and version under testIDs derived from the document id', async () => {
    await render(<DocumentGridItem document={document} />);

    expect(screen.getByTestId('document-grid-item-doc-1')).toBeOnTheScreen();
    expect(screen.getByTestId('document-grid-item-doc-1-title').props.children).toBe('Hop Rod Rye');
    expect(screen.getByTestId('document-grid-item-doc-1-version').props.children).toBe(
      'Version 2.6.16',
    );
  });

  it('exposes a combined accessibility label', async () => {
    await render(<DocumentGridItem document={document} />);

    expect(screen.getByLabelText('Hop Rod Rye, Version 2.6.16')).toBeOnTheScreen();
  });
});
