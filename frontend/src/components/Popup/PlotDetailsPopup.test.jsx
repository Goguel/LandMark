import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlotDetailsPopup } from './PlotDetailsPopup';

describe('PlotDetailsPopup Component', () => {
  const mockPlot = {
    id: 'uuid-123',
    totalPrice: 220000,
    areaM2: 1200,
    description: 'Corner plot with panoramic view',
    contactInfo: '+1 555 1234',
    createdAt: '2026-10-17T20:00:00Z',
  };

  it('does not render when plot is null', () => {
    const { container } = render(<PlotDetailsPopup plot={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders plot details properly', () => {
    render(<PlotDetailsPopup plot={mockPlot} onClose={vi.fn()} />);

    expect(screen.getByText('Land Plot')).toBeInTheDocument();
    expect(screen.getByText('R$ 220.000,00')).toBeInTheDocument();
    expect(screen.getByText(/1,200 m²/i)).toBeInTheDocument();
    expect(screen.getByText('Corner plot with panoramic view')).toBeInTheDocument();
    expect(screen.getByText('+1 555 1234')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<PlotDetailsPopup plot={mockPlot} onClose={onClose} />);

    fireEvent.click(screen.getByTitle('Close details'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
