import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DocumentsScreen } from '@/features/documents/components/DocumentsScreen';
import { DocumentsProvider } from '@/features/documents/store/DocumentsProvider';
import { NotificationsProvider } from '@/features/notifications/store/NotificationsProvider';

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
