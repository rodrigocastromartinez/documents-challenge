import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-native';

import { useIsOnline } from '@/shared/hooks/useIsOnline';

const mockedAddEventListener = NetInfo.addEventListener as jest.MockedFunction<
  typeof NetInfo.addEventListener
>;

const netInfoState = (isConnected: boolean | null) => ({ isConnected }) as NetInfoState;

describe('useIsOnline', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to online before NetInfo reports anything', async () => {
    const { result } = await renderHook(() => useIsOnline());

    expect(result.current).toBe(true);
  });

  it('flips to offline when NetInfo reports no connection, and back when it returns', async () => {
    const { result } = await renderHook(() => useIsOnline());
    const listener = mockedAddEventListener.mock.calls[0]?.[0];

    await act(async () => listener?.(netInfoState(false)));
    expect(result.current).toBe(false);

    await act(async () => listener?.(netInfoState(true)));
    expect(result.current).toBe(true);
  });

  it('treats an unknown (null) connectivity reading as online', async () => {
    const { result } = await renderHook(() => useIsOnline());
    const listener = mockedAddEventListener.mock.calls[0]?.[0];

    await act(async () => listener?.(netInfoState(null)));

    expect(result.current).toBe(true);
  });

  it('unsubscribes from NetInfo on unmount', async () => {
    const unsubscribe = jest.fn();
    mockedAddEventListener.mockReturnValueOnce(unsubscribe);

    const { unmount } = await renderHook(() => useIsOnline());
    await act(async () => unmount());

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
