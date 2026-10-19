import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlotListPanel } from './PlotListPanel';

describe('PlotListPanel Component', () => {
  const mockPlots = [
    {
      id: '1',
      totalPrice: 100000,
      areaM2: 800,
      description: 'Downtown plot',
      contactInfo: 'agent1@landmark.com',
      createdAt: '2026-10-17T10:00:00Z',
    },
    {
      id: '2',
      totalPrice: 250000,
      areaM2: 2500,
      description: 'Suburban acreage',
      contactInfo: 'agent2@landmark.com',
      createdAt: '2026-10-17T11:00:00Z',
    },
  ];

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PlotListPanel
        isOpen={false}
        onClose={vi.fn()}
        plots={mockPlots}
        selectedPlot={null}
        onSelectPlot={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders plot cards when open', () => {
    render(
      <PlotListPanel
        isOpen={true}
        onClose={vi.fn()}
        plots={mockPlots}
        selectedPlot={null}
        onSelectPlot={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
      />
    );

    expect(screen.getByText('Land Plots')).toBeInTheDocument();
    expect(screen.getByText(/Total: 2 registered/i)).toBeInTheDocument();
    expect(screen.getByText('Downtown plot')).toBeInTheDocument();
    expect(screen.getByText('Suburban acreage')).toBeInTheDocument();
  });

  it('filters plots based on search term', () => {
    render(
      <PlotListPanel
        isOpen={true}
        onClose={vi.fn()}
        plots={mockPlots}
        selectedPlot={null}
        onSelectPlot={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by description/i);
    fireEvent.change(searchInput, { target: { value: 'Downtown' } });

    expect(screen.getByText('Downtown plot')).toBeInTheDocument();
    expect(screen.queryByText('Suburban acreage')).not.toBeInTheDocument();
  });

  it('displays empty state when no plots match search', () => {
    render(
      <PlotListPanel
        isOpen={true}
        onClose={vi.fn()}
        plots={mockPlots}
        selectedPlot={null}
        onSelectPlot={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by description/i);
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });

    expect(screen.getByText('No Plots Found')).toBeInTheDocument();
  });

  it('clears search input when clear button clicked', () => {
    render(
      <PlotListPanel
        isOpen={true}
        onClose={vi.fn()}
        plots={mockPlots}
        selectedPlot={null}
        onSelectPlot={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by description/i);
    fireEvent.change(searchInput, { target: { value: 'Downtown' } });
    expect(screen.getByText('Downtown plot')).toBeInTheDocument();

    const clearSearchBtn = screen.getByTitle('Clear search');
    fireEvent.click(clearSearchBtn);
    expect(searchInput.value).toBe('');
    expect(screen.getByText('Suburban acreage')).toBeInTheDocument();
  });

  it('renders filter bar and triggers onClearFilter', () => {
    const onClearFilter = vi.fn();
    render(
      <PlotListPanel
        isOpen={true}
        onClose={vi.fn()}
        plots={mockPlots}
        selectedPlot={null}
        onSelectPlot={vi.fn()}
        activeFilter={{ radiusMeters: 300 }}
        onClearFilter={onClearFilter}
      />
    );

    expect(screen.getByText('⭕ Filter Active')).toBeInTheDocument();
    expect(screen.getByText('Within 300m')).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /Clear Filter/i });
    fireEvent.click(clearBtn);
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });

  it('triggers onSelectPlot on card click', () => {
    const onSelectPlot = vi.fn();
    render(
      <PlotListPanel
        isOpen={true}
        onClose={vi.fn()}
        plots={mockPlots}
        selectedPlot={null}
        onSelectPlot={onSelectPlot}
        activeFilter={null}
        onClearFilter={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Downtown plot'));
    expect(onSelectPlot).toHaveBeenCalledWith(mockPlots[0]);
  });
});
