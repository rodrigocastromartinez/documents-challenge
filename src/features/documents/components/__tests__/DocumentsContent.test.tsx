import { fireEvent, render, screen } from '@testing-library/react-native';

import { DocumentsContent } from '@/features/documents/components/DocumentsContent';
import type { Document } from '@/features/documents/types';

const doc = (id: string): Document => ({
  id,
  title: `Document ${id}`,
  version: '1.0.0',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
  origin: 'remote',
});

describe('DocumentsContent', () => {
  it('shows a loading indicator while loading with no documents yet', async () => {
    await render(
      <DocumentsContent status="loading" documents={[]} viewMode="list" onRefresh={jest.fn()} />,
    );

    expect(screen.getByTestId('documents-screen-loading')).toBeOnTheScreen();
  });

  it('shows an error view with retry when loading fails with no documents', async () => {
    const onRetry = jest.fn();
    await render(
      <DocumentsContent status="error" documents={[]} viewMode="list" onRefresh={onRetry} />,
    );

    expect(screen.getByTestId('documents-screen-error')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('documents-screen-error-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there are no documents', async () => {
    await render(
      <DocumentsContent status="success" documents={[]} viewMode="list" onRefresh={jest.fn()} />,
    );

    expect(screen.getByTestId('documents-screen-empty')).toBeOnTheScreen();
  });

  it('renders list items when viewMode is "list"', async () => {
    await render(
      <DocumentsContent
        status="success"
        documents={[doc('1'), doc('2')]}
        viewMode="list"
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByTestId('document-list-item-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('document-grid-item-1')).toBeNull();
  });

  it('renders grid items when viewMode is "grid"', async () => {
    await render(
      <DocumentsContent
        status="success"
        documents={[doc('1'), doc('2')]}
        viewMode="grid"
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByTestId('document-grid-item-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('document-list-item-1')).toBeNull();
  });
});
