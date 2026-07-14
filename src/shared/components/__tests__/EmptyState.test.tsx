import { render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/shared/components/EmptyState';

describe('EmptyState', () => {
  it('renders the title', async () => {
    await render(<EmptyState title="No documents yet" />);

    expect(screen.getByText('No documents yet')).toBeOnTheScreen();
  });

  it('renders the description when provided', async () => {
    await render(<EmptyState title="No documents yet" description="Create one to get started" />);

    expect(screen.getByText('Create one to get started')).toBeOnTheScreen();
  });

  it('omits the description when not provided', async () => {
    await render(<EmptyState title="No documents yet" />);

    expect(screen.queryByText('Create one to get started')).toBeNull();
  });
});
