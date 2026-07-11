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

  it('renders the title and the documents list in list view by default', async () => {
    mockedUseDocuments.mockReturnValue({
      status: 'success',
      documents: [doc('1', 'Hop Rod Rye')],
      refetch: jest.fn(),
    });

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('documents-screen-title')).toBeOnTheScreen();
    expect(screen.getByTestId('document-list-item-1')).toBeOnTheScreen();
  });

  it('switches to grid items when the grid toggle is pressed', async () => {
    mockedUseDocuments.mockReturnValue({
      status: 'success',
      documents: [doc('1', 'Hop Rod Rye')],
      refetch: jest.fn(),
    });

    await render(<DocumentsScreen />);

    await fireEvent.press(screen.getByTestId('view-toggle-grid'));

    expect(screen.getByTestId('document-grid-item-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('document-list-item-1')).toBeNull();
  });

  it('calls refetch when retrying after an error', async () => {
    const refetch = jest.fn();
    mockedUseDocuments.mockReturnValue({
      status: 'error',
      documents: [],
      error: 'network down',
      refetch,
    });

    await render(<DocumentsScreen />);

    await fireEvent.press(screen.getByTestId('documents-screen-error-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
