import { render, screen } from '@testing-library/react-native';

import { OfflineBanner } from '@/features/documents/components/OfflineBanner';
import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';

describe('OfflineBanner', () => {
  it('always leads with the offline message, appending when the cached data is from', async () => {
    const cachedAt = '2026-07-01T10:00:00.000Z';
    await render(<OfflineBanner cachedAt={cachedAt} />);

    expect(screen.getByTestId('offline-banner')).toHaveTextContent(
      `You are offline - Showing cached data from ${formatRelativeDate(new Date(cachedAt))}`,
    );
  });

  it('shows just the offline message when there is no cache timestamp', async () => {
    await render(<OfflineBanner cachedAt={null} />);

    expect(screen.getByTestId('offline-banner')).toHaveTextContent('You are offline');
  });
});
