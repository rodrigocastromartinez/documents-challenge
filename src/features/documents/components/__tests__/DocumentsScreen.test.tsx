import { fireEvent, render, screen } from '@testing-library/react-native';

import { DocumentsScreen } from '@/features/documents/components/DocumentsScreen';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import type { Document } from '@/features/documents/types';

jest.mock('@/features/documents/hooks/useDocuments');

const mockedUseDocuments = useDocuments as jest.MockedFunction<typeof useDocuments>;

const doc = (id: string, title: string): Document => ({
  id,
  title,
  version: '1.0.0',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  attachments: [],
  contributors: [],
});

describe('DocumentsScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading indicator while loading with no documents yet', async () => {
    mockedUseDocuments.mockReturnValue({
      status: 'loading',
      documents: [],
      refetch: jest.fn(),
    });

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('documents-screen-loading')).toBeOnTheScreen();
  });

  it('shows an error view with retry when loading fails with no documents', async () => {
    const refetch = jest.fn();
    mockedUseDocuments.mockReturnValue({
      status: 'error',
      documents: [],
      error: 'network down',
      refetch,
    });

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('documents-screen-error')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('documents-screen-error-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there are no documents', async () => {
    mockedUseDocuments.mockReturnValue({
      status: 'success',
      documents: [],
      refetch: jest.fn(),
    });

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('documents-screen-empty')).toBeOnTheScreen();
  });

  it('renders the documents list on success', async () => {
    mockedUseDocuments.mockReturnValue({
      status: 'success',
      documents: [doc('1', 'Hop Rod Rye'), doc('2', 'Stone IPA')],
      refetch: jest.fn(),
    });

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('documents-screen-list')).toBeOnTheScreen();
    expect(screen.getByTestId('document-item-1')).toBeOnTheScreen();
    expect(screen.getByTestId('document-item-2')).toBeOnTheScreen();
  });

  it('keeps showing the existing list while a refetch is in flight', async () => {
    mockedUseDocuments.mockReturnValue({
      status: 'loading',
      documents: [doc('1', 'Hop Rod Rye')],
      refetch: jest.fn(),
    });

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('documents-screen-list')).toBeOnTheScreen();
    expect(screen.queryByTestId('documents-screen-loading')).toBeNull();
  });
});
