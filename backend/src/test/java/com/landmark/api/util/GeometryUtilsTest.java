package com.landmark.api.util;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.exception.InvalidGeometryException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GeometryUtilsTest {

    private GeoJsonPolygonDTO createSamplePolygonDTO() {
        List<List<Double>> ring = List.of(
                List.of(-46.63, -23.55),
                List.of(-46.62, -23.55),
                List.of(-46.62, -23.54),
                List.of(-46.63, -23.54),
                List.of(-46.63, -23.55)
        );
        return new GeoJsonPolygonDTO(List.of(ring));
    }

    @Test
    @DisplayName("Should successfully convert valid GeoJsonPolygonDTO to JTS Polygon")
    void shouldConvertValidGeoJsonPolygonToJts() {
        GeoJsonPolygonDTO dto = createSamplePolygonDTO();
        Polygon polygon = GeometryUtils.toJtsPolygon(dto);

        assertNotNull(polygon);
        assertEquals(4326, polygon.getSRID());
        assertTrue(polygon.isValid());
        assertEquals(5, polygon.getExteriorRing().getCoordinates().length);
    }

    @Test
    @DisplayName("Should automatically close unclosed coordinate ring")
    void shouldAutomaticallyCloseUnclosedRing() {
        List<List<Double>> unclosedRing = List.of(
                List.of(-46.63, -23.55),
                List.of(-46.62, -23.55),
                List.of(-46.62, -23.54),
                List.of(-46.63, -23.54)
        );
        GeoJsonPolygonDTO dto = new GeoJsonPolygonDTO(List.of(unclosedRing));

        Polygon polygon = GeometryUtils.toJtsPolygon(dto);
        assertNotNull(polygon);
        assertEquals(5, polygon.getExteriorRing().getCoordinates().length);
        assertEquals(polygon.getExteriorRing().getCoordinates()[0],
                polygon.getExteriorRing().getCoordinates()[4]);
    }

    @Test
    @DisplayName("Should throw InvalidGeometryException for null or empty coordinates")
    void shouldThrowWhenCoordinatesEmpty() {
        assertThrows(InvalidGeometryException.class, () -> GeometryUtils.toJtsPolygon(null));

        GeoJsonPolygonDTO emptyDTO = new GeoJsonPolygonDTO(new ArrayList<>());
        assertThrows(InvalidGeometryException.class, () -> GeometryUtils.toJtsPolygon(emptyDTO));
    }

    @Test
    @DisplayName("Should throw InvalidGeometryException when ring has fewer than 3 points")
    void shouldThrowWhenRingHasFewerThan3Points() {
        List<List<Double>> shortRing = List.of(
                List.of(-46.63, -23.55),
                List.of(-46.62, -23.55)
        );
        GeoJsonPolygonDTO dto = new GeoJsonPolygonDTO(List.of(shortRing));

        assertThrows(InvalidGeometryException.class, () -> GeometryUtils.toJtsPolygon(dto));
    }

    @Test
    @DisplayName("Should throw InvalidGeometryException for invalid coordinate values")
    void shouldThrowForOutOfRangeCoordinates() {
        // Longitude > 180
        List<List<Double>> invalidLng = List.of(
                List.of(190.0, -23.55),
                List.of(-46.62, -23.55),
                List.of(-46.62, -23.54),
                List.of(190.0, -23.55)
        );
        assertThrows(InvalidGeometryException.class, () ->
                GeometryUtils.toJtsPolygon(new GeoJsonPolygonDTO(List.of(invalidLng))));

        // Latitude > 90
        List<List<Double>> invalidLat = List.of(
                List.of(-46.63, 95.0),
                List.of(-46.62, -23.55),
                List.of(-46.62, -23.54),
                List.of(-46.63, 95.0)
        );
        assertThrows(InvalidGeometryException.class, () ->
                GeometryUtils.toJtsPolygon(new GeoJsonPolygonDTO(List.of(invalidLat))));

        // Point with missing latitude
        List<List<Double>> missingLat = List.of(
                List.of(-46.63),
                List.of(-46.62, -23.55),
                List.of(-46.62, -23.54)
        );
        assertThrows(InvalidGeometryException.class, () ->
                GeometryUtils.toJtsPolygon(new GeoJsonPolygonDTO(List.of(missingLat))));
    }

    @Test
    @DisplayName("Should throw InvalidGeometryException for self-intersecting polygon")
    void shouldThrowForSelfIntersectingPolygon() {
        // Bow-tie polygon (figure 8)
        List<List<Double>> bowTie = List.of(
                List.of(0.0, 0.0),
                List.of(2.0, 2.0),
                List.of(0.0, 2.0),
                List.of(2.0, 0.0),
                List.of(0.0, 0.0)
        );
        GeoJsonPolygonDTO dto = new GeoJsonPolygonDTO(List.of(bowTie));

        assertThrows(InvalidGeometryException.class, () -> GeometryUtils.toJtsPolygon(dto));
    }

    @Test
    @DisplayName("Should convert JTS Polygon back to GeoJsonPolygonDTO")
    void shouldConvertJtsPolygonToGeoJsonDTO() {
        GeoJsonPolygonDTO originalDto = createSamplePolygonDTO();
        Polygon polygon = GeometryUtils.toJtsPolygon(originalDto);

        GeoJsonPolygonDTO converted = GeometryUtils.toGeoJsonDTO(polygon);
        assertNotNull(converted);
        assertEquals("Polygon", converted.type());
        assertEquals(1, converted.coordinates().size());
        assertEquals(5, converted.coordinates().get(0).size());

        assertNull(GeometryUtils.toGeoJsonDTO(null));
    }

    @Test
    @DisplayName("Should calculate geodesic area accurately")
    void shouldCalculateGeodesicArea() {
        GeoJsonPolygonDTO dto = createSamplePolygonDTO();
        Polygon polygon = GeometryUtils.toJtsPolygon(dto);

        double area = GeometryUtils.calculateGeodesicAreaSquareMeters(polygon);
        assertTrue(area > 1000000.0, "Expected area in square meters to be > 1 km²");

        assertEquals(0.0, GeometryUtils.calculateGeodesicAreaSquareMeters(null));
    }

    @Test
    @DisplayName("Should create JTS Point with SRID 4326")
    void shouldCreatePointWithSrid() {
        Point point = GeometryUtils.createPoint(-46.63, -23.55);
        assertNotNull(point);
        assertEquals(4326, point.getSRID());
        assertEquals(-46.63, point.getX());
        assertEquals(-23.55, point.getY());
    }
}
