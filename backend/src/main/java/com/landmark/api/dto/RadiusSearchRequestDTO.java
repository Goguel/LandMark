package com.landmark.api.dto;

import jakarta.validation.constraints.*;

public record RadiusSearchRequestDTO(
        @NotNull(message = "Center longitude is required")
        @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
        @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
        Double longitude,

        @NotNull(message = "Center latitude is required")
        @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
        @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
        Double latitude,

        @NotNull(message = "Radius in meters is required")
        @Positive(message = "Radius must be strictly greater than 0")
        @Max(value = 5000000, message = "Radius cannot exceed 5000km")
        Double radiusInMeters
) {}
