import { createContext, useCallback, useEffect, useReducer, type ReactNode } from 'react';
import { AppState, LayoutAnimation } from 'react-native';

import {
  dismissLocalNotifications,
  presentLocalNotification,
  requestLocalNotificationPermissions,
} from '@/features/notifications/localNotifications';
import { NotificationsClient } from '@/features/notifications/socket/NotificationsClient';
import {
  initialNotificationsState,
  notificationsReducer,
  type NotificationsState,
} from '@/features/notifications/store/notificationsReducer';

export type NotificationsContextValue = NotificationsState & {
  markAllRead: () => void;
};

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function NotificationsProvider({ children }: Props) {
  const [state, dispatch] = useReducer(notificationsReducer, initialNotificationsState);

  useEffect(() => {
    requestLocalNotificationPermissions();
  }, []);

  useEffect(() => {
    // Once the user is back in the app, the bell/banner already tell the story — a system
    // notification lingering in the notification center on top of that is just noise.
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        dismissLocalNotifications();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const client = new NotificationsClient({
      onStatusChange: (status) => dispatch({ type: 'STATUS_CHANGED', status }),
      onMessage: (message) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dispatch({ type: 'MESSAGE_RECEIVED', message });
        // AppState.currentState is kept in sync natively — reading it at fire time avoids both
        // re-rendering this provider on every foreground/background transition and the stale
        // window a state-plus-ref bridge would have.
        if (AppState.currentState !== 'active') {
          presentLocalNotification(message);
        }
      },
    });
    client.connect();
    return () => client.disconnect();
  }, []);

  const markAllRead = useCallback(() => dispatch({ type: 'MARK_ALL_READ' }), []);

  return (
    <NotificationsContext.Provider value={{ ...state, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}
