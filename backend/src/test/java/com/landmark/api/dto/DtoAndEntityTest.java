package com.landmark.api.dto;

import com.landmark.api.entity.LandPlot;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class DtoAndEntityTest {

    @Test
    @DisplayName("Should verify GeoJsonPolygonDTO record methods")
    void testGeoJsonPolygonDTO() {
        List<List<List<Double>>> coords = List.of(List.of(List.of(1.0, 2.0)));
        GeoJsonPolygonDTO dto = new GeoJsonPolygonDTO("Polygon", coords);

        assertEquals("Polygon", dto.type());
        assertEquals(coords, dto.coordinates());

        GeoJsonPolygonDTO dto2 = new GeoJsonPolygonDTO(coords);
        assertEquals(dto, dto2);
        assertEquals(dto.hashCode(), dto2.hashCode());
        assertTrue(dto.toString().contains("Polygon"));
    }

    @Test
    @DisplayName("Should verify LandPlotRequestDTO and ResponseDTO records")
    void testPlotDTOs() {
        GeoJsonPolygonDTO poly = new GeoJsonPolygonDTO(List.of(List.of(List.of(1.0, 2.0))));
        LandPlotRequestDTO req = new LandPlotRequestDTO("T", "D", BigDecimal.TEN, "C", poly);

        assertEquals("T", req.title());
        assertEquals("D", req.description());
        assertEquals(BigDecimal.TEN, req.totalPrice());
        assertEquals("C", req.contact());
        assertEquals(poly, req.geometry());

        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        LandPlotResponseDTO res = new LandPlotResponseDTO(id, "T", "D", BigDecimal.TEN, "C", poly, 100.0, now, now);

        assertEquals(id, res.id());
        assertEquals("T", res.title());
        assertEquals("D", res.description());
        assertEquals(BigDecimal.TEN, res.totalPrice());
        assertEquals("C", res.contact());
        assertEquals(poly, res.geometry());
        assertEquals(100.0, res.areaSquareMeters());
        assertEquals(now, res.createdAt());
        assertEquals(now, res.updatedAt());
    }

    @Test
    @DisplayName("Should verify RadiusSearchRequestDTO record")
    void testRadiusSearchRequestDTO() {
        RadiusSearchRequestDTO dto = new RadiusSearchRequestDTO(-46.0, -23.0, 1000.0);

        assertEquals(-46.0, dto.longitude());
        assertEquals(-23.0, dto.latitude());
        assertEquals(1000.0, dto.radiusInMeters());
    }

    @Test
    @DisplayName("Should verify LandPlot entity getters and setters")
    void testLandPlotEntity() {
        LandPlot plot = new LandPlot();
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        plot.setId(id);
        plot.setTitle("Title");
        plot.setDescription("Desc");
        plot.setTotalPrice(BigDecimal.valueOf(5000));
        plot.setContact("Contact");
        plot.setAreaSquareMeters(500.0);
        plot.setCreatedAt(now);
        plot.setUpdatedAt(now);

        assertEquals(id, plot.getId());
        assertEquals("Title", plot.getTitle());
        assertEquals("Desc", plot.getDescription());
        assertEquals(BigDecimal.valueOf(5000), plot.getTotalPrice());
        assertEquals("Contact", plot.getContact());
        assertEquals(500.0, plot.getAreaSquareMeters());
        assertEquals(now, plot.getCreatedAt());
        assertEquals(now, plot.getUpdatedAt());
    }
}
