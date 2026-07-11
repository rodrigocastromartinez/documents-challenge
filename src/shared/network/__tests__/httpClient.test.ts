import { HttpError, httpClient } from '@/shared/network/httpClient';

function mockFetchOnce(response: Partial<Response>) {
  globalThis.fetch = jest.fn().mockResolvedValueOnce(response as Response);
}

function mockAbortableFetch() {
  globalThis.fetch = jest.fn((_url: string, init?: RequestInit) => {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
  }) as typeof fetch;
}

describe('httpClient.get', () => {
  const originalHost = process.env.EXPO_PUBLIC_API_HOST;
  const originalPort = process.env.EXPO_PUBLIC_API_PORT;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_HOST = 'localhost';
    process.env.EXPO_PUBLIC_API_PORT = '8080';
  });

  afterEach(() => {
    setOrDelete('EXPO_PUBLIC_API_HOST', originalHost);
    setOrDelete('EXPO_PUBLIC_API_PORT', originalPort);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('resolves with the parsed JSON body on success', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ hello: 'world' }) });

    await expect(httpClient.get('/documents')).resolves.toEqual({ hello: 'world' });
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/documents', expect.any(Object));
  });

  it('throws an HttpError with the status when the response is not ok', async () => {
    mockFetchOnce({ ok: false, status: 500, json: async () => ({}) });

    await expect(httpClient.get('/documents')).rejects.toMatchObject({
      name: 'HttpError',
      status: 500,
    });
  });

  it('throws an HttpError when the request times out', async () => {
    jest.useFakeTimers();
    mockAbortableFetch();

    const promise = httpClient.get('/documents', { timeoutMs: 1000 });
    const assertion = expect(promise).rejects.toThrow(HttpError);

    await jest.advanceTimersByTimeAsync(1000);
    await assertion;
  });
});

function setOrDelete(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
