package com.landmark.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenApiConfigTest {

    @Test
    @DisplayName("Should create OpenAPI configuration bean with title and description")
    void shouldCreateOpenApiBean() {
        OpenApiConfig config = new OpenApiConfig();
        OpenAPI openAPI = config.landmarkOpenAPI();

        assertNotNull(openAPI);
        assertNotNull(openAPI.getInfo());
        assertNotNull(openAPI.getInfo().getTitle());
        assertTrue(openAPI.getInfo().getTitle().contains("LandMark"));
        assertNotNull(openAPI.getInfo().getVersion());
        assertNotNull(openAPI.getServers());
    }
}
