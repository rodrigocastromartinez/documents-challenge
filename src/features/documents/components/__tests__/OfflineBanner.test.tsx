import { render, screen } from '@testing-library/react-native';

import { OfflineBanner } from '@/features/documents/components/OfflineBanner';
import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';

describe('OfflineBanner', () => {
  it('leads with the offline message when reason is offline, appending the cache timestamp', async () => {
    const cachedAt = '2026-07-01T10:00:00.000Z';
    await render(<OfflineBanner reason="offline" cachedAt={cachedAt} />);

    expect(screen.getByTestId('offline-banner')).toHaveTextContent(
      `You are offline - Showing cached data from ${formatRelativeDate(new Date(cachedAt))}`,
    );
  });

  it('shows just the offline message when there is no cache timestamp', async () => {
    await render(<OfflineBanner reason="offline" cachedAt={null} />);

    expect(screen.getByTestId('offline-banner')).toHaveTextContent('You are offline');
  });

  it("leads with a server-unreachable message when reason is serverError, not 'offline'", async () => {
    await render(<OfflineBanner reason="serverError" cachedAt={null} />);

    const banner = screen.getByTestId('offline-banner');
    expect(banner).toHaveTextContent("Can't reach the server");
    expect(banner).not.toHaveTextContent('You are offline');
  });
});
