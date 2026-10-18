package com.landmark.api.controller;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.dto.RadiusSearchRequestDTO;
import com.landmark.api.service.LandPlotService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lands")
@CrossOrigin(origins = "*")
public class LandPlotController {

    private final LandPlotService landPlotService;

    public LandPlotController(LandPlotService landPlotService) {
        this.landPlotService = landPlotService;
    }

    @PostMapping
    public ResponseEntity<LandPlotResponseDTO> createPlot(
            @Valid @RequestBody LandPlotRequestDTO request) {
        LandPlotResponseDTO response = landPlotService.createPlot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<LandPlotResponseDTO>> getAllPlots() {
        return ResponseEntity.ok(landPlotService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LandPlotResponseDTO> getPlotById(@PathVariable UUID id) {
        return ResponseEntity.ok(landPlotService.findById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<LandPlotResponseDTO>> searchPlotsWithinRadius(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam double radiusInMeters) {
        RadiusSearchRequestDTO searchRequest = new RadiusSearchRequestDTO(longitude, latitude, radiusInMeters);
        return ResponseEntity.ok(landPlotService.findWithinRadius(searchRequest));
    }

    @PostMapping("/search-by-geometry")
    public ResponseEntity<List<LandPlotResponseDTO>> searchPlotsByGeometry(
            @Valid @RequestBody GeoJsonPolygonDTO searchPolygon) {
        return ResponseEntity.ok(landPlotService.findIntersectingGeometry(searchPolygon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlot(@PathVariable UUID id) {
        landPlotService.deletePlot(id);
        return ResponseEntity.noContent().build();
    }
}
