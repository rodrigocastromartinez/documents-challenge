import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DocumentsProvider, DocumentsScreen } from '@/features/documents';
import { NotificationsProvider } from '@/features/notifications';

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsProvider>
        <NotificationsProvider>
          <DocumentsScreen />
        </NotificationsProvider>
      </DocumentsProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
