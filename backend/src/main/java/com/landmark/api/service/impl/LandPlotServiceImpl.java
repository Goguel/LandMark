package com.landmark.api.service.impl;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.dto.RadiusSearchRequestDTO;
import com.landmark.api.entity.LandPlot;
import com.landmark.api.exception.ResourceNotFoundException;
import com.landmark.api.exception.SpatialOverlapException;
import com.landmark.api.repository.LandPlotRepository;
import com.landmark.api.service.LandPlotService;
import com.landmark.api.util.GeometryUtils;
import com.landmark.api.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class LandPlotServiceImpl implements LandPlotService {

    private final LandPlotRepository repository;
    private final AuthService authService;

    public LandPlotServiceImpl(LandPlotRepository repository, AuthService authService) {
        this.repository = repository;
        this.authService = authService;
    }

    @Override
    @Transactional
    public LandPlotResponseDTO createPlot(LandPlotRequestDTO request) {
        log.info("Processing plot creation request: contact={}", request.contact());

        Polygon polygon = GeometryUtils.toJtsPolygon(request.geometry());

        boolean hasOverlap = repository.hasSpatialOverlap(polygon);
        if (hasOverlap) {
            log.warn("Spatial overlap detected for proposed polygon. Creation rejected.");
            throw new SpatialOverlapException(
                    "The proposed land plot overlaps with an existing registered area. Registration blocked."
            );
        }

        double areaInM2 = GeometryUtils.calculateGeodesicAreaSquareMeters(polygon);

        String title = request.title();
        if (title == null || title.isBlank()) {
            title = String.format("Land Plot (%.0f m²)", areaInM2);
        } else {
            title = title.trim();
        }

        com.landmark.api.entity.User currentUser = authService.getCurrentAuthenticatedUser();

        LandPlot entity = LandPlot.builder()
                .title(title)
                .description(request.description().trim())
                .totalPrice(request.totalPrice())
                .contact(request.contact().trim())
                .geometry(polygon)
                .areaSquareMeters(areaInM2)
                .owner(currentUser)
                .build();

        LandPlot savedEntity = repository.save(entity);
        log.info("Successfully created land plot with id={}", savedEntity.getId());
        return mapToResponseDTO(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LandPlotResponseDTO> findAll() {
        return repository.findAll().stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public LandPlotResponseDTO findById(UUID id) {
        return repository.findById(id)
                .map(this::mapToResponseDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Land plot not found with ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LandPlotResponseDTO> findWithinRadius(RadiusSearchRequestDTO searchRequest) {
        log.info("Searching plots within radius: lon={}, lat={}, radiusMeters={}",
                searchRequest.longitude(), searchRequest.latitude(), searchRequest.radiusInMeters());

        return repository.findWithinRadius(
                        searchRequest.longitude(),
                        searchRequest.latitude(),
                        searchRequest.radiusInMeters()
                ).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LandPlotResponseDTO> findIntersectingGeometry(GeoJsonPolygonDTO searchPolygonDTO) {
        Polygon searchPolygon = GeometryUtils.toJtsPolygon(searchPolygonDTO);
        return repository.findIntersectingGeometry(searchPolygon).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LandPlotResponseDTO> findPlotsByCurrentUser() {
        com.landmark.api.entity.User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You must be authenticated to view your registered plots."
            );
        }

        return repository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Override
    @Transactional
    public void deletePlot(UUID id) {
        LandPlot plot = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cannot delete: Land plot not found with ID: " + id));

        com.landmark.api.entity.User currentUser = authService.getCurrentAuthenticatedUser();
        if (currentUser != null) {
            boolean isOwner = plot.getOwner() != null && plot.getOwner().getId().equals(currentUser.getId());
            boolean isAdmin = currentUser.getRole() == com.landmark.api.entity.Role.ROLE_ADMIN;
            if (!isOwner && !isAdmin) {
                log.warn("User {} attempted to delete plot {} owned by {}",
                        currentUser.getEmail(), id, plot.getOwner() != null ? plot.getOwner().getEmail() : "none");
                throw new org.springframework.security.access.AccessDeniedException(
                        "You do not have permission to delete this plot. Only the owner or an administrator can delete it."
                );
            }
        }

        repository.delete(plot);
        log.info("Deleted land plot with id={}", id);
    }

    private LandPlotResponseDTO mapToResponseDTO(LandPlot entity) {
        UUID ownerId = entity.getOwner() != null ? entity.getOwner().getId() : null;
        String ownerName = entity.getOwner() != null ? entity.getOwner().getName() : null;

        return new LandPlotResponseDTO(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getTotalPrice(),
                entity.getContact(),
                GeometryUtils.toGeoJsonDTO(entity.getGeometry()),
                entity.getAreaSquareMeters(),
                ownerId,
                ownerName,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
