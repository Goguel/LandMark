import { describe, it, expect } from 'vitest';
import {
  toWgs84,
  toWebMercator,
  polygon3857ToGeoJson4326,
  geoJson4326ToPolygon3857,
  calculateGeodesicAreaM2,
  calculateGeodesicRadiusMeters,
  formatCurrency,
  formatArea,
  formatDistance,
  formatDate,
} from './geoUtils';

describe('geoUtils', () => {
  it('converts between EPSG:4326 and EPSG:3857', () => {
    const lonLat = [-46.6333, -23.5505];
    const mercator = toWebMercator(lonLat);
    expect(mercator).toBeDefined();
    expect(mercator.length).toBe(2);

    const backToLonLat = toWgs84(mercator);
    expect(backToLonLat[0]).toBeCloseTo(lonLat[0], 3);
    expect(backToLonLat[1]).toBeCloseTo(lonLat[1], 3);
  });

  it('converts polygon coordinate rings between 3857 and 4326', () => {
    const geoJson4326 = [
      [
        [-46.633, -23.550],
        [-46.632, -23.550],
        [-46.632, -23.549],
        [-46.633, -23.550],
      ],
    ];

    const mercatorRings = geoJson4326ToPolygon3857(geoJson4326);
    expect(mercatorRings.length).toBe(1);
    expect(mercatorRings[0].length).toBe(4);

    const convertedBack = polygon3857ToGeoJson4326(mercatorRings);
    expect(convertedBack[0][0][0]).toBeCloseTo(-46.633, 3);
    expect(convertedBack[0][0][1]).toBeCloseTo(-23.550, 3);
  });

  it('calculates geodesic area and radius', () => {
    const coords3857 = geoJson4326ToPolygon3857([
      [
        [-46.633, -23.550],
        [-46.632, -23.550],
        [-46.632, -23.549],
        [-46.633, -23.549],
        [-46.633, -23.550],
      ],
    ]);

    const area = calculateGeodesicAreaM2(coords3857);
    expect(area).toBeGreaterThan(1000);

    const center3857 = coords3857[0][0];
    const edge3857 = coords3857[0][1];
    const distance = calculateGeodesicRadiusMeters(center3857, edge3857);
    expect(distance).toBeGreaterThan(50);
  });

  describe('formatCurrency', () => {
    it('formats numbers to BRL currency string', () => {
      expect(formatCurrency(150000)).toBe('R$ 150.000,00');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(null)).toBe('R$ 0,00');
      expect(formatCurrency(undefined)).toBe('R$ 0,00');
      expect(formatCurrency(NaN)).toBe('R$ 0,00');
    });
  });

  describe('formatArea', () => {
    it('formats small areas in m²', () => {
      expect(formatArea(500)).toContain('500 m²');
    });

    it('formats large areas in hectares and m²', () => {
      const formatted = formatArea(25000);
      expect(formatted).toContain('2.50 ha');
      expect(formatted).toContain('25,000 m²');
    });

    it('handles null, undefined and negative values', () => {
      expect(formatArea(null)).toBe('0 m²');
      expect(formatArea(undefined)).toBe('0 m²');
      expect(formatArea(-10)).toBe('0 m²');
    });
  });

  describe('formatDistance', () => {
    it('formats meters when < 1000', () => {
      expect(formatDistance(450)).toBe('450 m');
    });

    it('formats km when >= 1000', () => {
      expect(formatDistance(1500)).toBe('1.50 km');
    });

    it('handles empty distance', () => {
      expect(formatDistance(null)).toBe('0 m');
      expect(formatDistance(NaN)).toBe('0 m');
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO date strings', () => {
      const formatted = formatDate('2026-10-17T20:00:00Z');
      expect(formatted).toBeDefined();
      expect(formatted).toContain('2026');
    });

    it('handles empty date', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate('')).toBe('N/A');
    });

    it('handles invalid date', () => {
      expect(formatDate('invalid-date-string')).toBeDefined();
    });
  });
});
