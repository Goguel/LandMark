package com.landmark.api.controller;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.dto.RadiusSearchRequestDTO;
import com.landmark.api.service.LandPlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/lands", "/api/plots"})
@CrossOrigin(origins = "*")
@Tag(name = "Land Plots", description = "Endpoints for registering, searching, and managing geospatial land plots")
public class LandPlotController {

    private final LandPlotService landPlotService;

    public LandPlotController(LandPlotService landPlotService) {
        this.landPlotService = landPlotService;
    }

    @PostMapping
    @Operation(
            summary = "Register a new land plot",
            description = "Validates spatial boundary polygon against existing plots to prevent 2D area overlap (409 Conflict), calculates geodesic area in m², and registers listing details."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Plot successfully registered"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or malformed polygon geometry"),
            @ApiResponse(responseCode = "409", description = "Spatial conflict: proposed polygon overlaps with an existing plot")
    })
    public ResponseEntity<LandPlotResponseDTO> createPlot(
            @Valid @RequestBody LandPlotRequestDTO request) {
        LandPlotResponseDTO response = landPlotService.createPlot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(
            summary = "List all registered land plots",
            description = "Retrieves all registered plots including their GeoJSON boundaries and property metadata."
    )
    @ApiResponse(responseCode = "200", description = "List of all registered land plots")
    public ResponseEntity<List<LandPlotResponseDTO>> getAllPlots() {
        return ResponseEntity.ok(landPlotService.findAll());
    }

    @GetMapping("/my-plots")
    @Operation(
            summary = "List land plots registered by current authenticated user",
            description = "Retrieves only the plots owned by the logged-in user."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of plots owned by current user"),
            @ApiResponse(responseCode = "401", description = "User is not authenticated")
    })
    public ResponseEntity<List<LandPlotResponseDTO>> getMyPlots() {
        return ResponseEntity.ok(landPlotService.findPlotsByCurrentUser());
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get a land plot by ID",
            description = "Returns detailed spatial and pricing information for a single plot."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plot found"),
            @ApiResponse(responseCode = "404", description = "Plot not found with specified UUID")
    })
    public ResponseEntity<LandPlotResponseDTO> getPlotById(
            @Parameter(description = "Unique identifier of the land plot", example = "44ccd2a6-4e0a-425b-8602-c1042c021ede")
            @PathVariable UUID id) {
        return ResponseEntity.ok(landPlotService.findById(id));
    }

    @GetMapping({"/search", "/search/radius"})
    @Operation(
            summary = "Search plots within a circular radius",
            description = "Performs high-precision geodesic proximity search using PostGIS geography casting (ST_DWithin) on the WGS84 spheroid."
    )
    @ApiResponse(responseCode = "200", description = "Plots intersecting the circular radius search area")
    public ResponseEntity<List<LandPlotResponseDTO>> searchPlotsWithinRadius(
            @Parameter(description = "Center longitude in degrees (-180 to 180)", example = "-46.6642")
            @RequestParam double longitude,
            @Parameter(description = "Center latitude in degrees (-90 to 90)", example = "-23.5613")
            @RequestParam double latitude,
            @Parameter(description = "Search radius in meters", example = "5000")
            @RequestParam double radiusInMeters) {
        RadiusSearchRequestDTO searchRequest = new RadiusSearchRequestDTO(longitude, latitude, radiusInMeters);
        return ResponseEntity.ok(landPlotService.findWithinRadius(searchRequest));
    }

    @PostMapping("/search-by-geometry")
    @Operation(
            summary = "Search plots intersecting an arbitrary polygon",
            description = "Returns all registered plots that topologically intersect with a custom GeoJSON search polygon."
    )
    @ApiResponse(responseCode = "200", description = "List of intersecting plots")
    public ResponseEntity<List<LandPlotResponseDTO>> searchPlotsByGeometry(
            @Valid @RequestBody GeoJsonPolygonDTO searchPolygon) {
        return ResponseEntity.ok(landPlotService.findIntersectingGeometry(searchPolygon));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete a land plot",
            description = "Removes a registered plot from the database by UUID."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Plot deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Plot not found")
    })
    public ResponseEntity<Void> deletePlot(
            @Parameter(description = "Unique identifier of the land plot to delete")
            @PathVariable UUID id) {
        landPlotService.deletePlot(id);
        return ResponseEntity.noContent().build();
    }
}
