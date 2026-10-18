package com.landmark.api.service;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.dto.RadiusSearchRequestDTO;

import java.util.List;
import java.util.UUID;

public interface LandPlotService {

    LandPlotResponseDTO createPlot(LandPlotRequestDTO request);

    List<LandPlotResponseDTO> findAll();

    LandPlotResponseDTO findById(UUID id);

    List<LandPlotResponseDTO> findWithinRadius(RadiusSearchRequestDTO searchRequest);

    List<LandPlotResponseDTO> findIntersectingGeometry(GeoJsonPolygonDTO searchPolygonDTO);

    void deletePlot(UUID id);
}
