import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Share } from 'react-native';

import { DocumentListItem } from '@/features/documents/components/DocumentListItem';
import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';
import type { Document } from '@/features/documents/types';

const document: Document = {
  id: 'doc-1',
  title: 'Hop Rod Rye',
  version: '2.6.16',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: ['Light Lager', 'Porter'],
  contributors: [
    { id: 'user-1', name: 'Carlie Abott' },
    { id: 'user-2', name: 'Zoe Buckridge' },
  ],
  origin: 'remote',
};

// Computed rather than hardcoded, so this stays correct no matter what "now" is when the test
// suite runs (formatRelativeDate's output for a fixed createdAt shifts over time).
const expectedCreatedAtLabel = `Created ${formatRelativeDate(new Date(document.createdAt))}`;

describe('DocumentListItem', () => {
  it('renders the title and version under testIDs derived from the document id', async () => {
    await render(<DocumentListItem document={document} />);

    expect(screen.getByTestId('document-list-item-doc-1')).toBeOnTheScreen();
    expect(screen.getByTestId('document-list-item-doc-1-title').props.children).toBe('Hop Rod Rye');
    expect(screen.getByTestId('document-list-item-doc-1-version').props.children).toBe(
      'Version 2.6.16',
    );
  });

  it('renders every contributor and attachment within their respective sections', async () => {
    await render(<DocumentListItem document={document} />);

    const contributors = screen.getByTestId('document-list-item-doc-1-contributors');
    expect(within(contributors).getByText('Carlie Abott')).toBeOnTheScreen();
    expect(within(contributors).getByText('Zoe Buckridge')).toBeOnTheScreen();

    const attachments = screen.getByTestId('document-list-item-doc-1-attachments');
    expect(within(attachments).getByText('Light Lager')).toBeOnTheScreen();
    expect(within(attachments).getByText('Porter')).toBeOnTheScreen();
  });

  it('exposes a combined accessibility label for the title/version header, separate from the created-at text', async () => {
    await render(<DocumentListItem document={document} />);

    // The created-at Text is its own accessible element (asserted below) — including it in the
    // header group's label too would make a screen reader announce the date twice.
    expect(screen.getByLabelText('Hop Rod Rye, Version 2.6.16')).toBeOnTheScreen();
  });

  it('renders the created-at label using the bounded relative formatter', async () => {
    await render(<DocumentListItem document={document} />);

    expect(screen.getByTestId('document-list-item-doc-1-created-at').props.children).toBe(
      expectedCreatedAtLabel,
    );
  });

  it('shares the title and version when the share button is pressed', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await render(<DocumentListItem document={document} />);

    await fireEvent.press(screen.getByTestId('document-list-item-doc-1-share'));

    expect(shareSpy).toHaveBeenCalledWith({ message: 'Hop Rod Rye — Version 2.6.16' });
    shareSpy.mockRestore();
  });
});
