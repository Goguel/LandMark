package com.landmark.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record LandPlotRequestDTO(
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(max = 5000, message = "Description cannot exceed 5000 characters")
        String description,

        @NotNull(message = "Total price is required")
        @Positive(message = "Total price must be greater than zero")
        BigDecimal totalPrice,

        @NotBlank(message = "Contact information is required")
        @Size(max = 100, message = "Contact cannot exceed 100 characters")
        String contact,

        @NotNull(message = "Geometry is required")
        @Valid
        GeoJsonPolygonDTO geometry
) {}
