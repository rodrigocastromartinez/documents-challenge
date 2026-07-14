import { fireEvent, render, screen } from '@testing-library/react-native';

import { SortBySelect } from '@/features/documents/components/SortBySelect';

describe('SortBySelect', () => {
  it('does not show the menu until the trigger is pressed', async () => {
    await render(<SortBySelect value="date" onChange={jest.fn()} />);

    expect(screen.queryByTestId('sort-by-select-menu')).toBeNull();
  });

  it('opens the menu when the trigger is pressed', async () => {
    await render(<SortBySelect value="date" onChange={jest.fn()} />);

    await fireEvent.press(screen.getByTestId('sort-by-select-trigger'));

    expect(screen.getByTestId('sort-by-select-menu')).toBeOnTheScreen();
  });

  it('marks the current value as selected', async () => {
    await render(<SortBySelect value="title" onChange={jest.fn()} />);

    await fireEvent.press(screen.getByTestId('sort-by-select-trigger'));

    expect(
      screen.getByTestId('sort-by-select-option-title').props.accessibilityState.selected,
    ).toBe(true);
    expect(screen.getByTestId('sort-by-select-option-date').props.accessibilityState.selected).toBe(
      false,
    );
  });

  it('calls onChange and closes the menu when an option is pressed', async () => {
    const onChange = jest.fn();
    await render(<SortBySelect value="date" onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('sort-by-select-trigger'));
    await fireEvent.press(screen.getByTestId('sort-by-select-option-title'));

    expect(onChange).toHaveBeenCalledWith('title');
    expect(screen.queryByTestId('sort-by-select-menu')).toBeNull();
  });

  it('closes the menu when the backdrop is pressed, without calling onChange', async () => {
    const onChange = jest.fn();
    await render(<SortBySelect value="date" onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('sort-by-select-trigger'));
    await fireEvent.press(screen.getByTestId('sort-by-select-backdrop'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('sort-by-select-menu')).toBeNull();
  });
});
