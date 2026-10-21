import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Draw from 'ol/interaction/Draw';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { MapContainer } from './MapContainer';

let lastDrawInstance = null;
vi.mock('ol/interaction/Draw', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: class MockDraw extends actual.default {
      constructor(...args) {
        super(...args);
        lastDrawInstance = this;
      }
    },
  };
});

describe('MapContainer Component', () => {
  const mockPlots = [
    {
      id: 'uuid-1',
      totalPrice: 150000,
      description: 'Plot 1',
      contactInfo: 'agent@landmark.com',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.633, -23.55],
            [-46.632, -23.55],
            [-46.632, -23.549],
            [-46.633, -23.55],
          ],
        ],
      },
    },
  ];

  it('renders map viewport and popup overlay container', () => {
    const { container } = render(
      <MapContainer
        plots={mockPlots}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );

    const mapViewport = container.querySelector('#landmark-map');
    expect(mapViewport).toBeInTheDocument();
  });

  it('renders selected plot popup when selectedPlot is provided', () => {
    render(
      <MapContainer
        plots={mockPlots}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={mockPlots[0]}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );

    expect(screen.getByText('Plot 1')).toBeInTheDocument();
    expect(screen.getByText('R$ 150.000,00')).toBeInTheDocument();
  });

  it('toggles basemap switcher and changes basemap option', () => {
    render(
      <MapContainer
        plots={mockPlots}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );

    const toggleBtn = screen.getByTitle('Change Basemap Style');
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText('Dark Minimal')).toBeInTheDocument();

    // Open menu
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Satellite')).toBeInTheDocument();

    // Select satellite
    fireEvent.click(screen.getByText('Satellite'));
    expect(screen.getByText('Satellite')).toBeInTheDocument();
  });

  it('switches between modes without crashing', () => {
    const { rerender } = render(
      <MapContainer
        plots={mockPlots}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );

    rerender(
      <MapContainer
        plots={mockPlots}
        mode="draw_polygon"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );

    rerender(
      <MapContainer
        plots={mockPlots}
        mode="draw_circle"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );
  });

  it('handles popup close and resetViewTrigger', () => {
    const setSelectedPlot = vi.fn();
    const { rerender } = render(
      <MapContainer
        plots={mockPlots}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={mockPlots[0]}
        setSelectedPlot={setSelectedPlot}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );

    // Close popup
    const closeBtn = screen.getByTitle('Close details');
    closeBtn.click();
    expect(setSelectedPlot).toHaveBeenCalledWith(null);

    // Rerender with resetViewTrigger = 1
    rerender(
      <MapContainer
        plots={[]}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={setSelectedPlot}
        activeFilter={{ radiusMeters: 500 }}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={1}
      />
    );

    // Clear active filter
    rerender(
      <MapContainer
        plots={[]}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={setSelectedPlot}
        activeFilter={null}
        onPolygonCompleted={vi.fn()}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={1}
      />
    );
  });

  it('simulates polygon draw completion', () => {
    const onPolygonCompleted = vi.fn();
    const { rerender } = render(
      <MapContainer
        plots={mockPlots}
        mode="draw_polygon"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={onPolygonCompleted}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );

    // Switch to view mode to trigger draft feature cleanup
    rerender(
      <MapContainer
        plots={mockPlots}
        mode="view"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={onPolygonCompleted}
        onRadiusSearchCompleted={vi.fn()}
        resetViewTrigger={0}
      />
    );
  });

  it('triggers drawstart, drawend, and live radius change for polygon and circle', () => {
    const onPolygonCompleted = vi.fn();
    const onRadiusSearchCompleted = vi.fn();

    const { rerender } = render(
      <MapContainer
        plots={mockPlots}
        mode="draw_polygon"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={onPolygonCompleted}
        onRadiusSearchCompleted={onRadiusSearchCompleted}
        resetViewTrigger={0}
      />
    );

    // Simulate polygon drawstart and drawend
    if (lastDrawInstance) {
      const polygonFeature = new Feature({
        geometry: new Polygon([
          [
            [-5191200, -2700000],
            [-5191000, -2700000],
            [-5191000, -2699800],
            [-5191200, -2700000],
          ],
        ]),
      });
      act(() => {
        lastDrawInstance.dispatchEvent({ type: 'drawstart', feature: polygonFeature });
        // Call drawstart again to cover clearing previous draft
        lastDrawInstance.dispatchEvent({ type: 'drawstart', feature: polygonFeature });
        lastDrawInstance.dispatchEvent({ type: 'drawend', feature: polygonFeature });
      });
      expect(onPolygonCompleted).toHaveBeenCalled();
    }

    // Now switch to draw_circle
    rerender(
      <MapContainer
        plots={mockPlots}
        mode="draw_circle"
        setMode={vi.fn()}
        selectedPlot={null}
        setSelectedPlot={vi.fn()}
        activeFilter={null}
        onPolygonCompleted={onPolygonCompleted}
        onRadiusSearchCompleted={onRadiusSearchCompleted}
        resetViewTrigger={0}
      />
    );

    if (lastDrawInstance) {
      let changeCallback = null;
      const circleGeom = {
        getCenter: () => [-5191200, -2700000],
        getRadius: () => 500,
        on: (evtType, handler) => {
          changeCallback = handler;
        },
      };
      const circleFeature = {
        getGeometry: () => circleGeom,
        set: vi.fn(),
      };

      act(() => {
        lastDrawInstance.dispatchEvent({ type: 'drawstart', feature: circleFeature });
        if (changeCallback) {
          changeCallback();
        }
        lastDrawInstance.dispatchEvent({ type: 'drawend', feature: circleFeature });
      });
      expect(onRadiusSearchCompleted).toHaveBeenCalled();
    }
  });
});
