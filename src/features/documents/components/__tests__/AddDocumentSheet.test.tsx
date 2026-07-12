import { fireEvent, render, screen } from '@testing-library/react-native';

import { AddDocumentSheet } from '@/features/documents/components/AddDocumentSheet';

describe('AddDocumentSheet', () => {
  it('does not show its fields when not visible', async () => {
    await render(<AddDocumentSheet visible={false} onClose={jest.fn()} onSubmit={jest.fn()} />);

    expect(screen.queryByTestId('add-document-sheet-name-input')).toBeNull();
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await render(<AddDocumentSheet visible onClose={onClose} onSubmit={jest.fn()} />);

    await fireEvent.press(screen.getByTestId('add-document-sheet-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const onClose = jest.fn();
    await render(<AddDocumentSheet visible onClose={onClose} onSubmit={jest.fn()} />);

    await fireEvent.press(screen.getByTestId('add-document-sheet-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onSubmit when Name is empty', async () => {
    const onSubmit = jest.fn();
    await render(<AddDocumentSheet visible onClose={jest.fn()} onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('add-document-sheet-version-input'), '1.0.0');
    await fireEvent.press(screen.getByTestId('add-document-sheet-choose-file'));
    await fireEvent.press(screen.getByTestId('add-document-sheet-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when Version is empty', async () => {
    const onSubmit = jest.fn();
    await render(<AddDocumentSheet visible onClose={jest.fn()} onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('add-document-sheet-name-input'), 'My Doc');
    await fireEvent.press(screen.getByTestId('add-document-sheet-choose-file'));
    await fireEvent.press(screen.getByTestId('add-document-sheet-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when no file has been chosen', async () => {
    const onSubmit = jest.fn();
    await render(<AddDocumentSheet visible onClose={jest.fn()} onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('add-document-sheet-name-input'), 'My Doc');
    await fireEvent.changeText(screen.getByTestId('add-document-sheet-version-input'), '1.0.0');
    await fireEvent.press(screen.getByTestId('add-document-sheet-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed name, entered version, and the chosen file once the form is complete', async () => {
    const onSubmit = jest.fn();
    await render(<AddDocumentSheet visible onClose={jest.fn()} onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('add-document-sheet-name-input'), '  My Doc  ');
    await fireEvent.changeText(screen.getByTestId('add-document-sheet-version-input'), '2.3.0');
    await fireEvent.press(screen.getByTestId('add-document-sheet-choose-file'));
    await fireEvent.press(screen.getByTestId('add-document-sheet-submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'My Doc',
      version: '2.3.0',
      attachments: ['document.pdf'],
    });
  });
});
