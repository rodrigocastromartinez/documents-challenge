import type { NotificationMessage, NotificationsStatus } from '@/features/notifications/types';

export type NotificationsState = {
  status: NotificationsStatus;
  unreadCount: number;
  latestMessage: NotificationMessage | null;
};

export type NotificationsAction =
  | { type: 'STATUS_CHANGED'; status: NotificationsStatus }
  | { type: 'MESSAGE_RECEIVED'; message: NotificationMessage }
  | { type: 'MARK_ALL_READ' };

export const initialNotificationsState: NotificationsState = {
  status: 'connecting',
  unreadCount: 0,
  latestMessage: null,
};

export function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case 'STATUS_CHANGED':
      return { ...state, status: action.status };
    case 'MESSAGE_RECEIVED':
      return { ...state, unreadCount: state.unreadCount + 1, latestMessage: action.message };
    case 'MARK_ALL_READ':
      return { ...state, unreadCount: 0, latestMessage: null };
    default:
      return state;
  }
}
