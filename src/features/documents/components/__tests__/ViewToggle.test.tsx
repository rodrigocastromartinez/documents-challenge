import { fireEvent, render, screen } from '@testing-library/react-native';

import { ViewToggle } from '@/features/documents/components/ViewToggle';

describe('ViewToggle', () => {
  it('marks the current value as selected', async () => {
    await render(<ViewToggle value="list" onChange={jest.fn()} />);

    expect(screen.getByTestId('view-toggle-list').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('view-toggle-grid').props.accessibilityState.selected).toBe(false);
  });

  it('calls onChange with "grid" when the grid button is pressed', async () => {
    const onChange = jest.fn();
    await render(<ViewToggle value="list" onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('view-toggle-grid'));

    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('calls onChange with "list" when the list button is pressed', async () => {
    const onChange = jest.fn();
    await render(<ViewToggle value="grid" onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('view-toggle-list'));

    expect(onChange).toHaveBeenCalledWith('list');
  });
});
