import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useIsOnline(): boolean {
  // Starts as online: NetInfo reports null until the first real reading arrives, and briefly
  // flashing an offline banner on every cold start would be worse than a short delay in
  // detecting a genuinely offline launch (the failed fetch covers that case anyway).
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netInfoState) => {
      setIsOnline(netInfoState.isConnected !== false);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}
