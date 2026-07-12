import { fireEvent, render, screen } from '@testing-library/react-native';

import { DocumentsScreen } from '@/features/documents/components/DocumentsScreen';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import type { Document } from '@/features/documents/types';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useIsOnline } from '@/shared/hooks/useIsOnline';

jest.mock('@/features/documents/hooks/useDocuments');
jest.mock('@/features/notifications/hooks/useNotifications');
jest.mock('@/shared/hooks/useIsOnline');

const mockedUseDocuments = useDocuments as jest.MockedFunction<typeof useDocuments>;
const mockedUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockedUseIsOnline = useIsOnline as jest.MockedFunction<typeof useIsOnline>;

const doc = (id: string, title: string, createdAt = '2026-07-01T10:00:00.000Z'): Document => ({
  id,
  title,
  version: '1.0.0',
  createdAt,
  updatedAt: createdAt,
  attachments: [],
  contributors: [],
  origin: 'remote',
});

const documentsValue = (
  overrides: Partial<ReturnType<typeof useDocuments>> = {},
): ReturnType<typeof useDocuments> =>
  ({
    status: 'success',
    documents: [doc('1', 'Hop Rod Rye')],
    cachedAt: null,
    refetch: jest.fn(),
    addLocalDocument: jest.fn(),
    ...overrides,
  }) as ReturnType<typeof useDocuments>;

describe('DocumentsScreen', () => {
  beforeEach(() => {
    mockedUseNotifications.mockReturnValue({
      status: 'open',
      unreadCount: 0,
      latestMessage: null,
      markAllRead: jest.fn(),
    });
    mockedUseIsOnline.mockReturnValue(true);
  });

  afterEach(() => {
    // clearAllMocks, not resetAllMocks: see AGENTS.md gotchas log — resetAllMocks strips a
    // jest.fn(impl)'s implementation permanently, which would break AsyncStorage's mock for the
    // rest of the run if this file ever renders something touching it.
    jest.clearAllMocks();
  });

  it('renders the title and the documents list in list view by default', async () => {
    mockedUseDocuments.mockReturnValue(documentsValue());

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('documents-screen-title')).toBeOnTheScreen();
    expect(screen.getByTestId('document-list-item-1')).toBeOnTheScreen();
  });

  it('switches to grid items when the grid toggle is pressed', async () => {
    mockedUseDocuments.mockReturnValue(documentsValue());

    await render(<DocumentsScreen />);

    await fireEvent.press(screen.getByTestId('view-toggle-grid'));

    expect(screen.getByTestId('document-grid-item-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('document-list-item-1')).toBeNull();
  });

  it('defaults to sorting by date (most recent first) and reorders when Title is selected', async () => {
    mockedUseDocuments.mockReturnValue(
      documentsValue({
        documents: [
          doc('a', 'Alpha', '2020-01-01T00:00:00.000Z'),
          doc('b', 'Zeta', '2026-01-01T00:00:00.000Z'),
        ],
      }),
    );

    await render(<DocumentsScreen />);

    expect(screen.getAllByTestId(/^document-list-item-[ab]$/)[0]?.props.testID).toBe(
      'document-list-item-b',
    );

    await fireEvent.press(screen.getByTestId('sort-by-select-trigger'));
    await fireEvent.press(screen.getByTestId('sort-by-select-option-title'));

    expect(screen.getAllByTestId(/^document-list-item-[ab]$/)[0]?.props.testID).toBe(
      'document-list-item-a',
    );
  });

  it('calls refetch when retrying after an error', async () => {
    const refetch = jest.fn();
    mockedUseDocuments.mockReturnValue(
      documentsValue({ status: 'error', documents: [], error: 'network down', refetch }),
    );

    await render(<DocumentsScreen />);

    await fireEvent.press(screen.getByTestId('documents-screen-error-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('opens the add-document sheet, submits it, and closes it again', async () => {
    const addLocalDocument = jest.fn();
    mockedUseDocuments.mockReturnValue(documentsValue({ addLocalDocument }));

    await render(<DocumentsScreen />);

    expect(screen.queryByTestId('add-document-sheet-name-input')).toBeNull();

    await fireEvent.press(screen.getByTestId('documents-screen-add-button'));
    expect(screen.getByTestId('add-document-sheet-name-input')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('add-document-sheet-name-input'), 'New doc');
    await fireEvent.changeText(screen.getByTestId('add-document-sheet-version-input'), '1.0.0');
    await fireEvent.press(screen.getByTestId('add-document-sheet-choose-file'));
    await fireEvent.press(screen.getByTestId('add-document-sheet-submit'));

    expect(addLocalDocument).toHaveBeenCalledWith({
      title: 'New doc',
      version: '1.0.0',
      attachments: ['document.pdf'],
    });
    expect(screen.queryByTestId('add-document-sheet-name-input')).toBeNull();
  });

  it('shows the unread badge and banner from notifications, and marks read on bell press', async () => {
    const markAllRead = jest.fn();
    mockedUseDocuments.mockReturnValue(documentsValue());
    mockedUseNotifications.mockReturnValue({
      status: 'open',
      unreadCount: 2,
      latestMessage: {
        timestamp: '2026-07-12T10:00:00.000Z',
        userId: 'user-1',
        userName: 'Ada Lovelace',
        documentId: 'doc-1',
        documentTitle: 'Analytical Engine Notes',
      },
      markAllRead,
    });

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('notification-bell-badge')).toHaveTextContent('2');
    expect(screen.getByTestId('notification-banner')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('notification-bell'));
    expect(markAllRead).toHaveBeenCalledTimes(1);
  });

  it('hides the offline banner when online with a healthy fetch', async () => {
    mockedUseDocuments.mockReturnValue(documentsValue());

    await render(<DocumentsScreen />);

    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });

  it('shows the offline banner when connectivity is lost while showing documents', async () => {
    mockedUseIsOnline.mockReturnValue(false);
    mockedUseDocuments.mockReturnValue(documentsValue({ cachedAt: '2026-07-12T10:00:00.000Z' }));

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('offline-banner')).toBeOnTheScreen();
    expect(screen.getByTestId('document-list-item-1')).toBeOnTheScreen();
  });

  it('shows the offline banner (not the error screen) when a fetch fails with cached documents', async () => {
    mockedUseDocuments.mockReturnValue(
      documentsValue({
        status: 'error',
        error: 'network down',
        cachedAt: '2026-07-12T10:00:00.000Z',
      }),
    );

    await render(<DocumentsScreen />);

    expect(screen.getByTestId('offline-banner')).toBeOnTheScreen();
    expect(screen.getByTestId('document-list-item-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('documents-screen-error')).toBeNull();
  });
});
