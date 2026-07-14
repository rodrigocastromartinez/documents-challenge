import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorView } from '@/shared/components/ErrorView';

describe('ErrorView', () => {
  it('renders the message', async () => {
    await render(<ErrorView message="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
  });

  it('does not render a retry button when onRetry is not provided', async () => {
    await render(<ErrorView message="Something went wrong" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onRetry when the retry button is tapped', async () => {
    const onRetry = jest.fn();
    await render(<ErrorView message="Something went wrong" onRetry={onRetry} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
