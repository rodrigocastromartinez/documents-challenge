import { resolveApiBaseUrl } from '@/shared/network/resolveApiBaseUrl';

describe('resolveApiBaseUrl', () => {
  const originalHost = process.env.EXPO_PUBLIC_API_HOST;
  const originalPort = process.env.EXPO_PUBLIC_API_PORT;

  afterEach(() => {
    setOrDelete('EXPO_PUBLIC_API_HOST', originalHost);
    setOrDelete('EXPO_PUBLIC_API_PORT', originalPort);
  });

  it('builds a URL from host and port', () => {
    process.env.EXPO_PUBLIC_API_HOST = '10.0.2.2';
    process.env.EXPO_PUBLIC_API_PORT = '9090';

    expect(resolveApiBaseUrl()).toBe('http://10.0.2.2:9090');
  });

  it('defaults the port to 8080 when not set', () => {
    process.env.EXPO_PUBLIC_API_HOST = 'localhost';
    delete process.env.EXPO_PUBLIC_API_PORT;

    expect(resolveApiBaseUrl()).toBe('http://localhost:8080');
  });

  it('throws a descriptive error when the host is missing', () => {
    delete process.env.EXPO_PUBLIC_API_HOST;

    expect(() => resolveApiBaseUrl()).toThrow(/EXPO_PUBLIC_API_HOST/);
  });
});

function setOrDelete(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
