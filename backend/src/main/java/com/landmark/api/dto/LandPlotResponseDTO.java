package com.landmark.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record LandPlotResponseDTO(
        UUID id,
        String title,
        String description,
        BigDecimal totalPrice,
        String contact,
        GeoJsonPolygonDTO geometry,
        Double areaSquareMeters,
        UUID ownerId,
        String ownerName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
