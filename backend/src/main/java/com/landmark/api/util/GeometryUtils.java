package com.landmark.api.util;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.exception.InvalidGeometryException;
import org.locationtech.jts.geom.*;
import org.locationtech.jts.operation.valid.IsValidOp;
import org.locationtech.jts.operation.valid.TopologyValidationError;

import java.util.ArrayList;
import java.util.List;

public final class GeometryUtils {

    public static final int SRID_WGS84 = 4326;
    private static final double EARTH_RADIUS_METERS = 6371008.8;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);

    private GeometryUtils() {
    }

    public static GeometryFactory getGeometryFactory() {
        return GEOMETRY_FACTORY;
    }

    public static Polygon toJtsPolygon(GeoJsonPolygonDTO dto) {
        if (dto == null || dto.coordinates() == null || dto.coordinates().isEmpty()) {
            throw new InvalidGeometryException("Polygon coordinates must not be empty");
        }

        List<List<List<Double>>> coordinates = dto.coordinates();
        List<List<Double>> exteriorCoords = coordinates.get(0);

        LinearRing shell = createLinearRing(exteriorCoords, "exterior ring");

        LinearRing[] holes = null;
        if (coordinates.size() > 1) {
            holes = new LinearRing[coordinates.size() - 1];
            for (int i = 1; i < coordinates.size(); i++) {
                holes[i - 1] = createLinearRing(coordinates.get(i), "interior hole " + i);
            }
        }

        Polygon polygon = GEOMETRY_FACTORY.createPolygon(shell, holes);
        polygon.setSRID(SRID_WGS84);

        IsValidOp validOp = new IsValidOp(polygon);
        if (!validOp.isValid()) {
            TopologyValidationError error = validOp.getValidationError();
            throw new InvalidGeometryException("Invalid polygon geometry: " + error.getMessage() + " at " + error.getCoordinate());
        }

        return polygon;
    }

    private static LinearRing createLinearRing(List<List<Double>> rawCoordinates, String ringName) {
        if (rawCoordinates == null || rawCoordinates.size() < 3) {
            throw new InvalidGeometryException("The " + ringName + " must contain at least 3 points");
        }

        List<Coordinate> coords = new ArrayList<>();
        for (List<Double> pt : rawCoordinates) {
            if (pt == null || pt.size() < 2) {
                throw new InvalidGeometryException("Each coordinate point in " + ringName + " must contain at least [longitude, latitude]");
            }
            double lng = pt.get(0);
            double lat = pt.get(1);

            if (lng < -180.0 || lng > 180.0) {
                throw new InvalidGeometryException("Longitude must be between -180 and 180 degrees: " + lng);
            }
            if (lat < -90.0 || lat > 90.0) {
                throw new InvalidGeometryException("Latitude must be between -90 and 90 degrees: " + lat);
            }

            coords.add(new Coordinate(lng, lat));
        }

        // Ensure the linear ring is closed (first coord equals last coord)
        Coordinate first = coords.get(0);
        Coordinate last = coords.get(coords.size() - 1);
        if (!first.equals2D(last)) {
            coords.add(new Coordinate(first.x, first.y));
        }

        if (coords.size() < 4) {
            throw new InvalidGeometryException("Closed " + ringName + " must have at least 4 coordinates (3 distinct + closing point)");
        }

        return GEOMETRY_FACTORY.createLinearRing(coords.toArray(new Coordinate[0]));
    }

    public static GeoJsonPolygonDTO toGeoJsonDTO(Polygon polygon) {
        if (polygon == null) {
            return null;
        }

        List<List<List<Double>>> coordinates = new ArrayList<>();

        // Exterior ring
        coordinates.add(extractRingCoordinates(polygon.getExteriorRing()));

        // Interior rings (holes)
        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            coordinates.add(extractRingCoordinates(polygon.getInteriorRingN(i)));
        }

        return new GeoJsonPolygonDTO("Polygon", coordinates);
    }

    private static List<List<Double>> extractRingCoordinates(LineString ring) {
        List<List<Double>> ringCoords = new ArrayList<>();
        for (Coordinate coord : ring.getCoordinates()) {
            List<Double> pt = new ArrayList<>(2);
            pt.add(coord.x);
            pt.add(coord.y);
            ringCoords.add(pt);
        }
        return ringCoords;
    }

    public static Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }

    /**
     * Calculates the geodesic area in square meters on Earth's WGS84 spheroid using spherical excess.
     */
    public static double calculateGeodesicAreaSquareMeters(Polygon polygon) {
        if (polygon == null) {
            return 0.0;
        }

        double area = calculateRingArea(polygon.getExteriorRing());

        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            area -= calculateRingArea(polygon.getInteriorRingN(i));
        }

        return Math.max(0.0, Math.round(area * 100.0) / 100.0);
    }

    private static double calculateRingArea(LineString ring) {
        Coordinate[] coords = ring.getCoordinates();
        if (coords.length < 3) {
            return 0.0;
        }

        double total = 0.0;
        for (int i = 0; i < coords.length - 1; i++) {
            Coordinate p1 = coords[i];
            Coordinate p2 = coords[i + 1];

            double lat1 = Math.toRadians(p1.y);
            double lat2 = Math.toRadians(p2.y);
            double lonDiff = Math.toRadians(p2.x - p1.x);

            total += lonDiff * (2.0 + Math.sin(lat1) + Math.sin(lat2));
        }

        return Math.abs(total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS / 2.0);
    }
}
