import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DocumentsScreen } from '@/features/documents/components/DocumentsScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
