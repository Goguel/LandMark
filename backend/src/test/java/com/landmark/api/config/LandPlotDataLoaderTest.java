package com.landmark.api.config;

import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.repository.LandPlotRepository;
import com.landmark.api.service.LandPlotService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LandPlotDataLoaderTest {

    @Mock
    private LandPlotRepository repository;

    @Mock
    private LandPlotService landPlotService;

    @InjectMocks
    private LandPlotDataLoader dataLoader;

    private LandPlotResponseDTO createSampleResponse() {
        return new LandPlotResponseDTO(
                java.util.UUID.randomUUID(),
                "Sample Plot",
                "Description",
                new java.math.BigDecimal("100000.00"),
                "contact@landmark.com",
                null,
                500.0,
                java.time.LocalDateTime.now(),
                null
        );
    }

    @Test
    @DisplayName("Should skip seeding when database already has plots")
    void shouldSkipSeedingWhenDatabaseNotEmpty() {
        when(repository.count()).thenReturn(5L);

        dataLoader.run();

        verify(repository, times(1)).count();
        verify(landPlotService, never()).createPlot(any());
    }

    @Test
    @DisplayName("Should seed 8 initial plots when database is empty")
    void shouldSeedPlotsWhenDatabaseIsEmpty() {
        when(repository.count()).thenReturn(0L, 8L);
        when(landPlotService.createPlot(any(LandPlotRequestDTO.class))).thenReturn(createSampleResponse());

        dataLoader.run();

        verify(repository, atLeastOnce()).count();
        verify(landPlotService, times(8)).createPlot(any(LandPlotRequestDTO.class));
    }

    @Test
    @DisplayName("Should handle exception during single plot seed gracefully")
    void shouldHandleExceptionDuringPlotSeedGracefully() {
        when(repository.count()).thenReturn(0L, 0L);
        when(landPlotService.createPlot(any(LandPlotRequestDTO.class)))
                .thenThrow(new RuntimeException("Simulated seed error"))
                .thenReturn(createSampleResponse());

        dataLoader.run();

        verify(landPlotService, times(8)).createPlot(any(LandPlotRequestDTO.class));
    }
}
