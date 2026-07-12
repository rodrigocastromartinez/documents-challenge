import { createContext, useCallback, useEffect, useReducer, type ReactNode } from 'react';
import { LayoutAnimation } from 'react-native';

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
    const client = new NotificationsClient({
      onStatusChange: (status) => dispatch({ type: 'STATUS_CHANGED', status }),
      onMessage: (message) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dispatch({ type: 'MESSAGE_RECEIVED', message });
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
