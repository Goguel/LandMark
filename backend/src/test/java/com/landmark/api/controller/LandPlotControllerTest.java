package com.landmark.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.dto.RadiusSearchRequestDTO;
import com.landmark.api.exception.GlobalExceptionHandler;
import com.landmark.api.exception.ResourceNotFoundException;
import com.landmark.api.exception.SpatialOverlapException;
import com.landmark.api.service.LandPlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class LandPlotControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private LandPlotService landPlotService;

    @InjectMocks
    private LandPlotController landPlotController;

    private GeoJsonPolygonDTO validPolygonDTO;
    private LandPlotResponseDTO sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(landPlotController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        List<List<Double>> ring = List.of(
                List.of(-46.63, -23.55),
                List.of(-46.62, -23.55),
                List.of(-46.62, -23.54),
                List.of(-46.63, -23.54),
                List.of(-46.63, -23.55)
        );
        validPolygonDTO = new GeoJsonPolygonDTO(List.of(ring));

        sampleResponse = new LandPlotResponseDTO(
                UUID.randomUUID(),
                "Sunny Meadow",
                "Flat land with great sunlight",
                new BigDecimal("180000.00"),
                "owner@landmark.com",
                validPolygonDTO,
                50000.0,
                LocalDateTime.now(),
                null
        );
    }

    @Test
    @DisplayName("POST /api/lands should return 201 Created when plot is successfully created")
    void shouldReturn201WhenCreated() throws Exception {
        LandPlotRequestDTO request = new LandPlotRequestDTO(
                "Sunny Meadow",
                "Flat land with great sunlight",
                new BigDecimal("180000.00"),
                "owner@landmark.com",
                validPolygonDTO
        );

        when(landPlotService.createPlot(any(LandPlotRequestDTO.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/lands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(sampleResponse.id().toString()))
                .andExpect(jsonPath("$.title").value("Sunny Meadow"))
                .andExpect(jsonPath("$.totalPrice").value(180000.00));
    }

    @Test
    @DisplayName("POST /api/lands should return 409 Conflict when spatial overlap occurs")
    void shouldReturn409WhenOverlapOccurs() throws Exception {
        LandPlotRequestDTO request = new LandPlotRequestDTO(
                "Sunny Meadow",
                "Flat land with great sunlight",
                new BigDecimal("180000.00"),
                "owner@landmark.com",
                validPolygonDTO
        );

        when(landPlotService.createPlot(any(LandPlotRequestDTO.class)))
                .thenThrow(new SpatialOverlapException("Spatial overlap detected"));

        mockMvc.perform(post("/api/lands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Spatial overlap detected"));
    }

    @Test
    @DisplayName("POST /api/lands should return 400 Bad Request when validation fails")
    void shouldReturn400WhenValidationFails() throws Exception {
        LandPlotRequestDTO invalidRequest = new LandPlotRequestDTO(
                "Invalid",
                "", // Empty description
                new BigDecimal("-100.00"), // Negative price
                "",
                null
        );

        mockMvc.perform(post("/api/lands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors").exists());
    }

    @Test
    @DisplayName("GET /api/lands should return 200 OK with list of plots")
    void shouldReturnAllPlots() throws Exception {
        when(landPlotService.findAll()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/lands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Sunny Meadow"));
    }

    @Test
    @DisplayName("GET /api/lands/{id} should return 200 OK when found")
    void shouldReturnPlotById() throws Exception {
        UUID id = sampleResponse.id();
        when(landPlotService.findById(id)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/lands/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    @DisplayName("GET /api/lands/{id} should return 404 Not Found when ID does not exist")
    void shouldReturn404WhenPlotNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(landPlotService.findById(id))
                .thenThrow(new ResourceNotFoundException("Land plot not found with ID: " + id));

        mockMvc.perform(get("/api/lands/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("GET /api/lands/search should return 200 OK with results within radius")
    void shouldSearchWithinRadius() throws Exception {
        when(landPlotService.findWithinRadius(any(RadiusSearchRequestDTO.class)))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/lands/search")
                        .param("longitude", "-46.62")
                        .param("latitude", "-23.55")
                        .param("radiusInMeters", "3000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("POST /api/lands/search-by-geometry should return 200 OK with intersecting plots")
    void shouldSearchByGeometry() throws Exception {
        when(landPlotService.findIntersectingGeometry(any(GeoJsonPolygonDTO.class)))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(post("/api/lands/search-by-geometry")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validPolygonDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("DELETE /api/lands/{id} should return 204 No Content")
    void shouldDeletePlot() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(landPlotService).deletePlot(id);

        mockMvc.perform(delete("/api/lands/{id}", id))
                .andExpect(status().isNoContent());

        verify(landPlotService, times(1)).deletePlot(id);
    }
}
