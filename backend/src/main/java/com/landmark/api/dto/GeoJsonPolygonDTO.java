package com.landmark.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record GeoJsonPolygonDTO(
        @NotNull(message = "Geometry type cannot be null")
        String type,

        @NotEmpty(message = "Coordinates array cannot be empty")
        List<List<List<Double>>> coordinates
) {
    public GeoJsonPolygonDTO(List<List<List<Double>>> coordinates) {
        this("Polygon", coordinates);
    }
}
