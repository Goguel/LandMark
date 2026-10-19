import { fromLonLat, toLonLat } from 'ol/proj';
import { getArea, getDistance } from 'ol/sphere';
import Polygon from 'ol/geom/Polygon';

/**
 * Transforms an [x, y] coordinate from EPSG:3857 (Web Mercator) to [lon, lat] EPSG:4326 (WGS84).
 */
export function toWgs84(coord3857) {
  return toLonLat(coord3857);
}

/**
 * Transforms an [lon, lat] coordinate from EPSG:4326 (WGS84) to [x, y] EPSG:3857 (Web Mercator).
 */
export function toWebMercator(coord4326) {
  return fromLonLat(coord4326);
}

/**
 * Transforms a linear ring or coordinates array from EPSG:3857 to EPSG:4326.
 * @param {Array<Array<Array<number>>>} polygonCoordinates Coordinates in 3857 format
 * @returns {Array<Array<Array<number>>>} Coordinates in 4326 format ([lon, lat])
 */
export function polygon3857ToGeoJson4326(polygonCoordinates) {
  return polygonCoordinates.map((ring) =>
    ring.map((point) => {
      const [lon, lat] = toLonLat(point);
      // Format to 6 decimal places (~0.1m precision) to keep payload clean
      return [Number(lon.toFixed(6)), Number(lat.toFixed(6))];
    })
  );
}

/**
 * Transforms GeoJSON coordinates in EPSG:4326 to OpenLayers EPSG:3857 coordinates.
 * @param {Array<Array<Array<number>>>} geoJsonCoordinates Coordinates in 4326 format
 * @returns {Array<Array<Array<number>>>} Coordinates in 3857 format
 */
export function geoJson4326ToPolygon3857(geoJsonCoordinates) {
  return geoJsonCoordinates.map((ring) =>
    ring.map((point) => fromLonLat(point))
  );
}

/**
 * Calculates the geodesic surface area of a polygon in square meters.
 * @param {Array<Array<Array<number>>>} coordinates3857 Coordinates in EPSG:3857
 * @returns {number} Area in square meters
 */
export function calculateGeodesicAreaM2(coordinates3857) {
  const geom = new Polygon(coordinates3857);
  return Math.abs(getArea(geom, { projection: 'EPSG:3857' }));
}

/**
 * Calculates geodesic distance between two points in EPSG:3857.
 * @param {Array<number>} center3857 Center point in 3857
 * @param {Array<number>} edge3857 Edge point in 3857
 * @returns {number} Distance in meters
 */
export function calculateGeodesicRadiusMeters(center3857, edge3857) {
  const centerWgs84 = toLonLat(center3857);
  const edgeWgs84 = toLonLat(edge3857);
  return getDistance(centerWgs84, edgeWgs84);
}

/**
 * Formats a numeric price into a currency string.
 * @param {number} price
 * @returns {string} Formatted price (e.g., "$ 150,000.00" or "R$ 150.000,00")
 */
export function formatCurrency(price) {
  if (price == null || isNaN(price)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
    .format(price)
    .replace(/\u00a0/g, ' ');
}

/**
 * Formats an area in square meters into a human-readable string (m² or ha).
 * @param {number} areaM2 Area in square meters
 * @returns {string} Formatted area
 */
export function formatArea(areaM2) {
  if (areaM2 == null || isNaN(areaM2) || areaM2 <= 0) return '0 m²';
  if (areaM2 >= 10000) {
    const hectares = areaM2 / 10000;
    return `${hectares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha (${Math.round(areaM2).toLocaleString('en-US')} m²)`;
  }
  return `${Math.round(areaM2).toLocaleString('en-US')} m²`;
}

/**
 * Formats distance in meters into human-readable string (m or km).
 * @param {number} meters Distance in meters
 * @returns {string} Formatted distance
 */
export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return '0 m';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formats an ISO date string into a localized date format.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
