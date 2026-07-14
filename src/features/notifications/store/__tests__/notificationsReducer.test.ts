import {
  initialNotificationsState,
  notificationsReducer,
  type NotificationsState,
} from '@/features/notifications/store/notificationsReducer';
import type { NotificationMessage } from '@/features/notifications/types';

const message = (documentTitle: string): NotificationMessage => ({
  timestamp: '2026-07-12T10:00:00.000Z',
  userId: 'user-1',
  userName: 'Ada Lovelace',
  documentId: 'doc-1',
  documentTitle,
});

describe('notificationsReducer', () => {
  it('has a sane initial state', () => {
    expect(initialNotificationsState).toEqual({
      status: 'connecting',
      unreadCount: 0,
      latestMessage: null,
    });
  });

  it('STATUS_CHANGED updates the connection status without touching unread state', () => {
    const state: NotificationsState = {
      status: 'connecting',
      unreadCount: 2,
      latestMessage: message('Doc'),
    };

    const next = notificationsReducer(state, { type: 'STATUS_CHANGED', status: 'open' });

    expect(next).toEqual({ ...state, status: 'open' });
  });

  it('MESSAGE_RECEIVED increments unreadCount and replaces latestMessage', () => {
    const state: NotificationsState = { status: 'open', unreadCount: 1, latestMessage: null };

    const next = notificationsReducer(state, {
      type: 'MESSAGE_RECEIVED',
      message: message('New Doc'),
    });

    expect(next).toEqual({ status: 'open', unreadCount: 2, latestMessage: message('New Doc') });
  });

  it('MARK_ALL_READ resets unreadCount and dismisses the banner', () => {
    const state: NotificationsState = {
      status: 'open',
      unreadCount: 3,
      latestMessage: message('Doc'),
    };

    const next = notificationsReducer(state, { type: 'MARK_ALL_READ' });

    expect(next).toEqual({ ...state, unreadCount: 0, latestMessage: null });
  });
});
