// The official AsyncStorage/NetInfo jest mocks only export mock objects — they don't register
// themselves. jest.mock() has to be called explicitly (here, once, project-wide) to take effect.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);

// expo-notifications has no official jest mock; requiring the real module also logs a noisy
// (harmless) "push notifications removed from Expo Go" warning on every import, because it
// registers push-token listeners at module load time regardless of whether push is ever used.
// A minimal stub of the functions this app actually calls avoids both problems.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  requestPermissionsAsync: jest.fn().mockResolvedValue({}),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  dismissAllNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { DEFAULT: 3 },
}));
