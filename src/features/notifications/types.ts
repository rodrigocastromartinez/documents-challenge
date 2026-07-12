export type NotificationMessage = {
  timestamp: string;
  userId: string;
  userName: string;
  documentId: string;
  documentTitle: string;
};

export type NotificationsStatus = 'connecting' | 'open' | 'closed';
