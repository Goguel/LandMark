package com.landmark.api.service;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.dto.RadiusSearchRequestDTO;
import com.landmark.api.entity.LandPlot;
import com.landmark.api.exception.ResourceNotFoundException;
import com.landmark.api.exception.SpatialOverlapException;
import com.landmark.api.repository.LandPlotRepository;
import com.landmark.api.service.impl.LandPlotServiceImpl;
import com.landmark.api.util.GeometryUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Polygon;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LandPlotServiceTest {

    @Mock
    private LandPlotRepository repository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private LandPlotServiceImpl service;

    private GeoJsonPolygonDTO validPolygonDTO;
    private LandPlot sampleEntity;

    @BeforeEach
    void setUp() {
        List<List<Double>> ring = List.of(
                List.of(-46.63, -23.55),
                List.of(-46.62, -23.55),
                List.of(-46.62, -23.54),
                List.of(-46.63, -23.54),
                List.of(-46.63, -23.55)
        );
        validPolygonDTO = new GeoJsonPolygonDTO(List.of(ring));

        Polygon polygon = GeometryUtils.toJtsPolygon(validPolygonDTO);
        sampleEntity = LandPlot.builder()
                .id(UUID.randomUUID())
                .title("Prime Farmland")
                .description("Fertile land suitable for crops")
                .totalPrice(new BigDecimal("250000.00"))
                .contact("owner@landmark.com")
                .geometry(polygon)
                .areaSquareMeters(120000.0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should successfully register a plot when no spatial overlap exists")
    void shouldCreatePlotSuccessfully() {
        LandPlotRequestDTO request = new LandPlotRequestDTO(
                "Prime Farmland",
                "Fertile land suitable for crops",
                new BigDecimal("250000.00"),
                "owner@landmark.com",
                validPolygonDTO
        );

        when(repository.hasSpatialOverlap(any(Polygon.class))).thenReturn(false);
        when(repository.save(any(LandPlot.class))).thenReturn(sampleEntity);

        LandPlotResponseDTO response = service.createPlot(request);

        assertNotNull(response);
        assertEquals(sampleEntity.getId(), response.id());
        assertEquals("Prime Farmland", response.title());
        assertEquals(new BigDecimal("250000.00"), response.totalPrice());
        verify(repository, times(1)).hasSpatialOverlap(any(Polygon.class));
        verify(repository, times(1)).save(any(LandPlot.class));
    }

    @Test
    @DisplayName("Should throw SpatialOverlapException when proposed plot overlaps with an existing plot")
    void shouldThrowWhenSpatialOverlapOccurs() {
        LandPlotRequestDTO request = new LandPlotRequestDTO(
                "Overlapping Plot",
                "Description",
                new BigDecimal("100000.00"),
                "test@landmark.com",
                validPolygonDTO
        );

        when(repository.hasSpatialOverlap(any(Polygon.class))).thenReturn(true);

        assertThrows(SpatialOverlapException.class, () -> service.createPlot(request));
        verify(repository, never()).save(any(LandPlot.class));
    }

    @Test
    @DisplayName("Should generate default title based on calculated area when title is omitted")
    void shouldGenerateDefaultTitleWhenOmitted() {
        LandPlotRequestDTO request = new LandPlotRequestDTO(
                "",
                "Description",
                new BigDecimal("100000.00"),
                "test@landmark.com",
                validPolygonDTO
        );

        when(repository.hasSpatialOverlap(any(Polygon.class))).thenReturn(false);
        when(repository.save(any(LandPlot.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LandPlotResponseDTO response = service.createPlot(request);

        assertNotNull(response);
        assertTrue(response.title().startsWith("Land Plot ("), "Title should be auto-generated with area");
    }

    @Test
    @DisplayName("Should return all registered plots")
    void shouldFindAllPlots() {
        when(repository.findAll()).thenReturn(List.of(sampleEntity));

        List<LandPlotResponseDTO> results = service.findAll();

        assertEquals(1, results.size());
        assertEquals(sampleEntity.getId(), results.get(0).id());
    }

    @Test
    @DisplayName("Should find a plot by its UUID")
    void shouldFindPlotById() {
        UUID id = sampleEntity.getId();
        when(repository.findById(id)).thenReturn(Optional.of(sampleEntity));

        LandPlotResponseDTO result = service.findById(id);

        assertNotNull(result);
        assertEquals(id, result.id());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when plot does not exist")
    void shouldThrowWhenPlotNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(id));
    }

    @Test
    @DisplayName("Should find plots within a given radius")
    void shouldFindPlotsWithinRadius() {
        RadiusSearchRequestDTO search = new RadiusSearchRequestDTO(-46.625, -23.545, 5000.0);

        when(repository.findWithinRadius(-46.625, -23.545, 5000.0))
                .thenReturn(List.of(sampleEntity));

        List<LandPlotResponseDTO> results = service.findWithinRadius(search);

        assertEquals(1, results.size());
        verify(repository, times(1)).findWithinRadius(-46.625, -23.545, 5000.0);
    }

    @Test
    @DisplayName("Should find plots intersecting a search polygon")
    void shouldFindPlotsIntersectingGeometry() {
        when(repository.findIntersectingGeometry(any(Polygon.class)))
                .thenReturn(List.of(sampleEntity));

        List<LandPlotResponseDTO> results = service.findIntersectingGeometry(validPolygonDTO);

        assertEquals(1, results.size());
        verify(repository, times(1)).findIntersectingGeometry(any(Polygon.class));
    }

    @Test
    @DisplayName("Should delete plot when it exists and user is owner")
    void shouldDeletePlotWhenExistsAndUserIsOwner() {
        UUID id = sampleEntity.getId();
        com.landmark.api.entity.User owner = com.landmark.api.entity.User.builder()
                .id(UUID.randomUUID())
                .name("Owner User")
                .email("owner@landmark.com")
                .role(com.landmark.api.entity.Role.ROLE_USER)
                .build();
        sampleEntity.setOwner(owner);

        when(repository.findById(id)).thenReturn(Optional.of(sampleEntity));
        when(authService.getCurrentAuthenticatedUser()).thenReturn(owner);
        doNothing().when(repository).delete(sampleEntity);

        assertDoesNotThrow(() -> service.deletePlot(id));
        verify(repository, times(1)).delete(sampleEntity);
    }

    @Test
    @DisplayName("Should delete plot when user is admin even if not owner")
    void shouldDeletePlotWhenUserIsAdmin() {
        UUID id = sampleEntity.getId();
        com.landmark.api.entity.User owner = com.landmark.api.entity.User.builder()
                .id(UUID.randomUUID())
                .name("Owner User")
                .email("owner@landmark.com")
                .role(com.landmark.api.entity.Role.ROLE_USER)
                .build();
        sampleEntity.setOwner(owner);

        com.landmark.api.entity.User admin = com.landmark.api.entity.User.builder()
                .id(UUID.randomUUID())
                .name("Admin User")
                .email("admin@landmark.com")
                .role(com.landmark.api.entity.Role.ROLE_ADMIN)
                .build();

        when(repository.findById(id)).thenReturn(Optional.of(sampleEntity));
        when(authService.getCurrentAuthenticatedUser()).thenReturn(admin);
        doNothing().when(repository).delete(sampleEntity);

        assertDoesNotThrow(() -> service.deletePlot(id));
        verify(repository, times(1)).delete(sampleEntity);
    }

    @Test
    @DisplayName("Should throw AccessDeniedException when non-owner user attempts deletion")
    void shouldThrowAccessDeniedWhenNonOwnerAttemptsDeletion() {
        UUID id = sampleEntity.getId();
        com.landmark.api.entity.User owner = com.landmark.api.entity.User.builder()
                .id(UUID.randomUUID())
                .name("Owner User")
                .email("owner@landmark.com")
                .role(com.landmark.api.entity.Role.ROLE_USER)
                .build();
        sampleEntity.setOwner(owner);

        com.landmark.api.entity.User otherUser = com.landmark.api.entity.User.builder()
                .id(UUID.randomUUID())
                .name("Stranger User")
                .email("stranger@landmark.com")
                .role(com.landmark.api.entity.Role.ROLE_USER)
                .build();

        when(repository.findById(id)).thenReturn(Optional.of(sampleEntity));
        when(authService.getCurrentAuthenticatedUser()).thenReturn(otherUser);

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> service.deletePlot(id));
        verify(repository, never()).delete(any());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when trying to delete non-existent plot")
    void shouldThrowWhenDeletingNonExistentPlot() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deletePlot(id));
        verify(repository, never()).delete(any());
    }
}
