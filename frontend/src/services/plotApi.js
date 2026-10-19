/**
 * API service for LandMark spatial real estate backend.
 */

import { getStoredToken } from './authApi';

const API_BASE_URL = '/api/plots';

/**
 * Custom error class for API errors including spatial conflicts.
 */
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.isConflict = status === 409;
    this.isValidation = status === 400;
    this.isForbidden = status === 403;
    this.isUnauthorized = status === 401;
  }
}

/**
 * Handles HTTP response parsing and error propagation.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON error payload
    }

    const message = errorData?.message || `Request failed with status ${response.status}`;
    const details = errorData?.details || null;
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Helper to build common headers including JWT Bearer token when available.
 */
function buildHeaders(extraHeaders = {}) {
  const headers = {
    'Accept': 'application/json',
    ...extraHeaders,
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetches all registered land plots.
 * @returns {Promise<Array>} Array of LandPlotResponseDTO objects
 */
export async function fetchAllPlots() {
  const response = await fetch(API_BASE_URL, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(response);
}

/**
 * Searches land plots within a circular radius from a center point.
 * @param {number} latitude Center latitude (WGS84)
 * @param {number} longitude Center longitude (WGS84)
 * @param {number} radiusInMeters Search radius in meters
 * @returns {Promise<Array>} Array of intersecting LandPlotResponseDTO objects
 */
export async function searchPlotsByRadius(latitude, longitude, radiusInMeters) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radiusInMeters: radiusInMeters.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/search/radius?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(response);
}

/**
 * Registers a new land plot (requires authenticated user).
 * @param {Object} plotData { title, totalPrice, description, contactInfo, geometry: { type: 'Polygon', coordinates: [...] } }
 * @returns {Promise<Object>} Created LandPlotResponseDTO
 */
export async function registerPlot(plotData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(plotData),
  });
  return handleResponse(response);
}

/**
 * Fetches a single land plot by its UUID.
 * @param {string} id UUID of the plot
 * @returns {Promise<Object>} LandPlotResponseDTO
 */
export async function fetchPlotById(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(response);
}

/**
 * Deletes a land plot by its UUID (requires authenticated owner or admin).
 * @param {string} id UUID of the plot
 * @returns {Promise<void>}
 */
export async function deletePlot(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse(response);
}
