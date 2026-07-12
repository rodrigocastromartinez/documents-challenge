// The official AsyncStorage jest mock only exports a mock object — it doesn't register itself.
// jest.mock() has to be called explicitly (here, once, project-wide) for it to take effect.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
