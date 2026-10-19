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

  it('renders advertiser name if present', () => {
    const plotWithOwner = { ...mockPlot, ownerName: 'Alice Broker' };
    render(<PlotDetailsPopup plot={plotWithOwner} onClose={vi.fn()} />);

    expect(screen.getByText(/Alice Broker/i)).toBeInTheDocument();
  });

  it('does not render delete button when user is not logged in or not the owner', () => {
    render(<PlotDetailsPopup plot={mockPlot} onClose={vi.fn()} currentUser={null} />);
    expect(screen.queryByText(/Delete Plot/i)).not.toBeInTheDocument();

    const strangerUser = { id: 'other-user', name: 'Bob', role: 'ROLE_USER' };
    render(<PlotDetailsPopup plot={{ ...mockPlot, ownerId: 'owner-id' }} onClose={vi.fn()} currentUser={strangerUser} />);
    expect(screen.queryByText(/Delete Plot/i)).not.toBeInTheDocument();
  });

  it('renders delete button and handles confirmation flow for plot owner', async () => {
    const ownerUser = { id: 'owner-id', name: 'Alice', role: 'ROLE_USER' };
    const plot = { ...mockPlot, ownerId: 'owner-id' };
    const onDelete = vi.fn().mockResolvedValue(true);

    render(<PlotDetailsPopup plot={plot} onClose={vi.fn()} currentUser={ownerUser} onDeletePlot={onDelete} />);

    const deleteBtn = screen.getByRole('button', { name: /Delete Plot/i });
    expect(deleteBtn).toBeInTheDocument();

    // Click delete -> shows confirmation prompt
    fireEvent.click(deleteBtn);
    expect(screen.getByText('Confirm deletion?')).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // Click cancel -> confirmation is dismissed
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Confirm deletion?')).not.toBeInTheDocument();

    // Click delete again and confirm
    fireEvent.click(screen.getByRole('button', { name: /Delete Plot/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }));

    expect(onDelete).toHaveBeenCalledWith('uuid-123');
  });

  it('renders delete button for admin user even if not the plot owner', () => {
    const adminUser = { id: 'admin-1', name: 'Admin', role: 'ROLE_ADMIN' };
    const plot = { ...mockPlot, ownerId: 'some-other-owner' };

    render(<PlotDetailsPopup plot={plot} onClose={vi.fn()} currentUser={adminUser} onDeletePlot={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Delete Plot/i })).toBeInTheDocument();
  });
});
