import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapToolbar } from './MapToolbar';

describe('MapToolbar Component', () => {
  it('renders mode buttons with active states', () => {
    const setMode = vi.fn();
    render(
      <MapToolbar
        mode="view"
        setMode={setMode}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onResetView={vi.fn()}
      />
    );

    const inspectBtn = screen.getByTitle('Browse & Inspect Plots');
    expect(inspectBtn).toHaveClass('active');
    fireEvent.click(inspectBtn);
    expect(setMode).toHaveBeenCalledWith('view');

    const drawPlotBtn = screen.getByTitle('Draw Polygon to Register Plot');
    fireEvent.click(drawPlotBtn);
    expect(setMode).toHaveBeenCalledWith('draw_polygon');

    const radiusSearchBtn = screen.getByTitle('Draw Circle for Radius Search');
    fireEvent.click(radiusSearchBtn);
    expect(setMode).toHaveBeenCalledWith('draw_circle');
  });

  it('toggles mode back to view when clicking active mode button', () => {
    const setMode = vi.fn();
    const { rerender } = render(
      <MapToolbar
        mode="draw_polygon"
        setMode={setMode}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onResetView={vi.fn()}
      />
    );

    const drawPlotBtn = screen.getByTitle('Draw Polygon to Register Plot');
    fireEvent.click(drawPlotBtn);
    expect(setMode).toHaveBeenCalledWith('view');

    rerender(
      <MapToolbar
        mode="draw_circle"
        setMode={setMode}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onResetView={vi.fn()}
      />
    );

    const radiusSearchBtn = screen.getByTitle('Draw Circle for Radius Search');
    fireEvent.click(radiusSearchBtn);
    expect(setMode).toHaveBeenCalledWith('view');
  });

  it('renders polygon instructions when in draw_polygon mode', () => {
    render(
      <MapToolbar
        mode="draw_polygon"
        setMode={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onResetView={vi.fn()}
      />
    );

    expect(screen.getByText(/Click on the map to place vertices/i)).toBeInTheDocument();
  });

  it('renders circle instructions when in draw_circle mode', () => {
    render(
      <MapToolbar
        mode="draw_circle"
        setMode={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onResetView={vi.fn()}
      />
    );

    expect(screen.getByText(/expand radius/i)).toBeInTheDocument();
  });

  it('renders reset filter button when activeFilter is present', () => {
    const handleClearFilter = vi.fn();
    render(
      <MapToolbar
        mode="view"
        setMode={vi.fn()}
        activeFilter={{ radiusMeters: 500 }}
        onClearFilter={handleClearFilter}
        onResetView={vi.fn()}
      />
    );

    const resetFilterBtn = screen.getByTitle('Clear active radius filter');
    expect(resetFilterBtn).toBeInTheDocument();
    fireEvent.click(resetFilterBtn);
    expect(handleClearFilter).toHaveBeenCalledTimes(1);
  });

  it('triggers reset view on click', () => {
    const handleResetView = vi.fn();
    render(
      <MapToolbar
        mode="view"
        setMode={vi.fn()}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onResetView={handleResetView}
      />
    );

    const resetBtn = screen.getByTitle('Reset Map View');
    fireEvent.click(resetBtn);
    expect(handleResetView).toHaveBeenCalledTimes(1);
  });
});
