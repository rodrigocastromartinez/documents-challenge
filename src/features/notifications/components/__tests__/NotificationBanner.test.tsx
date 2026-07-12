import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { NotificationBanner } from '@/features/notifications/components/NotificationBanner';
import type { NotificationMessage } from '@/features/notifications/types';

const message = (timestamp: string): NotificationMessage => ({
  timestamp,
  userId: 'user-1',
  userName: 'Ada Lovelace',
  documentId: 'doc-1',
  documentTitle: 'Analytical Engine Notes',
});

describe('NotificationBanner', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when there is no message', async () => {
    await render(<NotificationBanner message={null} />);

    expect(screen.queryByTestId('notification-banner')).toBeNull();
  });

  it('shows the message text', async () => {
    await render(<NotificationBanner message={message('2026-07-12T10:00:00.000Z')} />);

    expect(screen.getByTestId('notification-banner')).toHaveTextContent(
      /Ada Lovelace created Analytical Engine Notes/,
    );
  });

  it('dismisses when the dismiss button is pressed', async () => {
    await render(<NotificationBanner message={message('2026-07-12T10:00:00.000Z')} />);

    await fireEvent.press(screen.getByTestId('notification-banner-dismiss'));

    expect(screen.queryByTestId('notification-banner')).toBeNull();
  });

  it('auto-dismisses certain time', async () => {
    jest.useFakeTimers();
    await render(<NotificationBanner message={message('2026-07-12T10:00:00.000Z')} />);

    expect(screen.getByTestId('notification-banner')).toBeOnTheScreen();

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(screen.queryByTestId('notification-banner')).toBeNull();
  });

  it('reappears for a new message even if the previous one was dismissed', async () => {
    const { rerender } = await render(
      <NotificationBanner message={message('2026-07-12T10:00:00.000Z')} />,
    );

    await fireEvent.press(screen.getByTestId('notification-banner-dismiss'));
    expect(screen.queryByTestId('notification-banner')).toBeNull();

    await rerender(<NotificationBanner message={message('2026-07-12T10:05:00.000Z')} />);

    expect(screen.getByTestId('notification-banner')).toBeOnTheScreen();
  });
});
