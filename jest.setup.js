// The official AsyncStorage/NetInfo jest mocks only export mock objects — they don't register
// themselves. jest.mock() has to be called explicitly (here, once, project-wide) to take effect.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);
