import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchAllPlots,
  searchPlotsByRadius,
  registerPlot,
  fetchPlotById,
  ApiError,
} from './plotApi';

describe('plotApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchAllPlots returns parsed plot list on 200 OK', async () => {
    const mockPlots = [
      { id: '1', totalPrice: 100000, description: 'Plot 1' },
      { id: '2', totalPrice: 200000, description: 'Plot 2' },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlots,
    });

    const result = await fetchAllPlots();
    expect(result).toEqual(mockPlots);
    expect(fetch).toHaveBeenCalledWith('/api/plots', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  it('searchPlotsByRadius appends query parameters properly', async () => {
    const mockResults = [{ id: '1', totalPrice: 100000 }];
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResults,
    });

    const result = await searchPlotsByRadius(-23.55, -46.63, 500);
    expect(result).toEqual(mockResults);
    expect(fetch).toHaveBeenCalledWith(
      '/api/plots/search/radius?latitude=-23.55&longitude=-46.63&radiusInMeters=500',
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );
  });

  it('registerPlot posts JSON payload and returns created plot', async () => {
    const newPlot = {
      totalPrice: 150000,
      description: 'New plot',
      contactInfo: 'john@example.com',
      geometry: { type: 'Polygon', coordinates: [] },
    };
    const created = { id: 'uuid-123', ...newPlot };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => created,
    });

    const result = await registerPlot(newPlot);
    expect(result).toEqual(created);
    expect(fetch).toHaveBeenCalledWith('/api/plots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(newPlot),
    });
  });

  it('fetchPlotById fetches a single plot', async () => {
    const mockPlot = { id: 'uuid-123', totalPrice: 150000 };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlot,
    });

    const result = await fetchPlotById('uuid-123');
    expect(result).toEqual(mockPlot);
    expect(fetch).toHaveBeenCalledWith('/api/plots/uuid-123', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  it('throws ApiError with isConflict=true on HTTP 409', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        status: 409,
        message: 'Spatial overlap detected with existing plot',
        details: 'Polygon overlaps with plot uuid-999',
      }),
    });

    try {
      await registerPlot({});
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(409);
      expect(err.isConflict).toBe(true);
      expect(err.message).toBe('Spatial overlap detected with existing plot');
      expect(err.details).toBe('Polygon overlaps with plot uuid-999');
    }
  });

  it('throws ApiError on HTTP 400 Bad Request', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 400,
        message: 'Validation failed',
      }),
    });

    try {
      await registerPlot({});
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(400);
      expect(err.isValidation).toBe(true);
      expect(err.isConflict).toBe(false);
    }
  });

  it('handles non-JSON error response gracefully', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    try {
      await fetchAllPlots();
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(500);
      expect(err.message).toContain('Request failed with status 500');
    }
  });

  it('handles 204 No Content response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
    });

    const result = await fetchAllPlots();
    expect(result).toBeNull();
  });
});
