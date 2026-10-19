import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import App from './App';
import * as plotApi from './services/plotApi';

// Mock OpenLayers MapContainer to avoid canvas / webgl issues in JSDOM
vi.mock('./components/Map/MapContainer', () => ({
  MapContainer: ({ plots, mode, onPolygonCompleted, onRadiusSearchCompleted }) => (
    <div data-testid="mock-map-container">
      <div data-testid="plots-count">{plots.length}</div>
      <div data-testid="current-mode">{mode}</div>
      <button
        data-testid="simulate-draw-polygon"
        onClick={() =>
          onPolygonCompleted({
            coordinates3857: [
              [
                [-5191200, -2700000],
                [-5191000, -2700000],
                [-5191000, -2699800],
                [-5191200, -2700000],
              ],
            ],
            geoJsonCoordinates4326: [
              [
                [-46.633, -23.55],
                [-46.632, -23.55],
                [-46.632, -23.549],
                [-46.633, -23.55],
              ],
            ],
            areaM2: 1500,
          })
        }
      >
        Simulate Polygon
      </button>
      <button
        data-testid="simulate-draw-circle"
        onClick={() =>
          onRadiusSearchCompleted({
            latitude: -23.55,
            longitude: -46.63,
            radiusMeters: 500,
          })
        }
      >
        Simulate Circle
      </button>
    </div>
  ),
}));

describe('App Component Integration', () => {
  const mockPlots = [
    {
      id: 'uuid-1',
      totalPrice: 150000,
      description: 'Central Plot 1',
      contactInfo: 'agent@landmark.com',
      geometry: { type: 'Polygon', coordinates: [] },
      createdAt: '2026-10-17T10:00:00Z',
    },
    {
      id: 'uuid-2',
      totalPrice: 280000,
      description: 'Central Plot 2',
      contactInfo: 'owner@landmark.com',
      geometry: { type: 'Polygon', coordinates: [] },
      createdAt: '2026-10-17T11:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and displays initial registered plots', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);

    render(<App />);

    expect(screen.getByText('LandMark')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });
  });

  it('handles backend connection failure gracefully with toast', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockRejectedValue(new Error('Network Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Could not connect to backend service/i)).toBeInTheDocument();
    });
  });

  it('handles polygon drawing, opens modal, and registers new plot', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);
    const createdPlot = {
      id: 'uuid-3',
      totalPrice: 120000,
      description: 'New Simulated Plot',
      contactInfo: 'simulated@landmark.com',
      geometry: { type: 'Polygon', coordinates: [] },
    };
    vi.spyOn(plotApi, 'registerPlot').mockResolvedValue(createdPlot);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });

    // Simulate user completing polygon drawing
    fireEvent.click(screen.getByTestId('simulate-draw-polygon'));

    // Modal should now be open
    expect(screen.getByText('Register New Land Plot')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Total Price/i), { target: { value: '120000' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New Simulated Plot' } });
    fireEvent.change(screen.getByLabelText(/Contact Information/i), { target: { value: 'simulated@landmark.com' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Register Plot/i }));

    await waitFor(() => {
      expect(plotApi.registerPlot).toHaveBeenCalled();
      expect(screen.getByText(/Plot registered for/i)).toBeInTheDocument();
    });
  });

  it('handles radius search and filter clearing', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);
    const searchResults = [mockPlots[0]];
    vi.spyOn(plotApi, 'searchPlotsByRadius').mockResolvedValue(searchResults);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });

    // Simulate user drawing search circle
    fireEvent.click(screen.getByTestId('simulate-draw-circle'));

    await waitFor(() => {
      expect(plotApi.searchPlotsByRadius).toHaveBeenCalledWith(-23.55, -46.63, 500);
      expect(screen.getByTestId('plots-count')).toHaveTextContent('1');
      expect(screen.getByText(/Found 1 plot\(s\) within 500m radius/i)).toBeInTheDocument();
    });

    // Clear filter
    const clearBtn = screen.getByTitle('Clear radius filter and show all plots');
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
      expect(screen.getByText(/Filter cleared. Showing all registered plots/i)).toBeInTheDocument();
    });
  });

  it('handles modal cancel and dismisses modal', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });

    fireEvent.click(screen.getByTestId('simulate-draw-polygon'));
    expect(screen.getByText('Register New Land Plot')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Register New Land Plot')).not.toBeInTheDocument();
  });

  it('handles conflict error (409) when registering plot', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);
    const conflictErr = new plotApi.ApiError(409, 'Overlap detected with plot X');
    vi.spyOn(plotApi, 'registerPlot').mockRejectedValue(conflictErr);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });

    fireEvent.click(screen.getByTestId('simulate-draw-polygon'));
    fireEvent.change(screen.getByLabelText(/Total Price/i), { target: { value: '120000' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Overlap plot' } });
    fireEvent.change(screen.getByLabelText(/Contact Information/i), { target: { value: 'agent@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Register Plot/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Spatial Overlap Rejected/i).length).toBeGreaterThan(0);
    });
  });

  it('handles generic error when registering plot', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);
    vi.spyOn(plotApi, 'registerPlot').mockRejectedValue(new Error('Server Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });

    fireEvent.click(screen.getByTestId('simulate-draw-polygon'));
    fireEvent.change(screen.getByLabelText(/Total Price/i), { target: { value: '120000' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Error plot' } });
    fireEvent.change(screen.getByLabelText(/Contact Information/i), { target: { value: 'agent@test.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Register Plot/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Server Error/i).length).toBeGreaterThan(0);
    });
  });

  it('handles radius search failure gracefully', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);
    vi.spyOn(plotApi, 'searchPlotsByRadius').mockRejectedValue(new Error('Radius Search Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });

    fireEvent.click(screen.getByTestId('simulate-draw-circle'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to perform radius search/i)).toBeInTheDocument();
    });
  });

  it('triggers reset map view and opens sidebar', async () => {
    vi.spyOn(plotApi, 'fetchAllPlots').mockResolvedValue(mockPlots);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plots-count')).toHaveTextContent('2');
    });

    // Reset view
    fireEvent.click(screen.getByTitle('Reset Map View'));

    // Open sidebar
    fireEvent.click(screen.getByTitle('Open plots panel'));
    expect(screen.getByText('Land Plots')).toBeInTheDocument();

    // Select plot from sidebar
    fireEvent.click(screen.getByText('Central Plot 1'));

    // Close sidebar using close button
    const closeSidebarBtn = screen.getByTitle('Close panel');
    fireEvent.click(closeSidebarBtn);
    expect(screen.queryByText('Land Plots')).not.toBeInTheDocument();

    // Dismiss toast
    const dismissBtns = screen.queryAllByTitle('Dismiss notification');
    if (dismissBtns.length > 0) {
      fireEvent.click(dismissBtns[0]);
    }
  });

  it('auto-dismisses toast notifications after timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(plotApi, 'fetchAllPlots').mockRejectedValue(new Error('Connection failure'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Could not connect to backend service/i)).toBeInTheDocument();
    });

    // Advance timers by 5000ms inside act
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Could not connect to backend service/i)).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
