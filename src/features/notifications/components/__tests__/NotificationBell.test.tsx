import { fireEvent, render, screen } from '@testing-library/react-native';

import { NotificationBell } from '@/features/notifications/components/NotificationBell';

describe('NotificationBell', () => {
  it('does not render a badge when there are no unread notifications', async () => {
    await render(<NotificationBell unreadCount={0} onPress={jest.fn()} />);

    expect(screen.queryByTestId('notification-bell-badge')).toBeNull();
  });

  it('shows the unread count in the badge', async () => {
    await render(<NotificationBell unreadCount={3} onPress={jest.fn()} />);

    expect(screen.getByTestId('notification-bell-badge')).toHaveTextContent('3');
  });

  it('caps the displayed badge at "9+"', async () => {
    await render(<NotificationBell unreadCount={42} onPress={jest.fn()} />);

    expect(screen.getByTestId('notification-bell-badge')).toHaveTextContent('9+');
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<NotificationBell unreadCount={1} onPress={onPress} />);

    await fireEvent.press(screen.getByTestId('notification-bell'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
