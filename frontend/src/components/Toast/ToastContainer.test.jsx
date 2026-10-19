import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from './ToastContainer';

describe('ToastContainer Component', () => {
  it('does not render when toasts is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders list of toasts with correct styles and triggers dismiss', () => {
    const onDismiss = vi.fn();
    const toasts = [
      { id: '1', type: 'success', title: 'Plot Saved', message: 'Plot was successfully created.' },
      { id: '2', type: 'error', title: 'Overlap', message: 'Plot overlaps with existing.' },
      { id: '3', type: 'warning', title: 'Warning', message: 'Plot near border.' },
      { id: '4', message: 'General info message.' },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    expect(screen.getByText('Plot Saved')).toBeInTheDocument();
    expect(screen.getByText('Plot was successfully created.')).toBeInTheDocument();
    expect(screen.getByText('Overlap')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('General info message.')).toBeInTheDocument();

    const closeButtons = screen.getAllByTitle('Dismiss notification');
    expect(closeButtons.length).toBe(4);

    fireEvent.click(closeButtons[0]);
    expect(onDismiss).toHaveBeenCalledWith('1');
  });
});
