import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DocumentsScreen } from '@/features/documents/components/DocumentsScreen';
import { DocumentsProvider } from '@/features/documents/store/DocumentsProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsProvider>
        <DocumentsScreen />
      </DocumentsProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
