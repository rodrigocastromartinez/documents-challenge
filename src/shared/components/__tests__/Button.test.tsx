import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/shared/components/Button';

describe('Button', () => {
  it('renders the label and calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<Button label="Add document" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Add document' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Add document" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button', { name: 'Add document' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Add document" onPress={onPress} loading />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
