package com.landmark.api.config;

import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.dto.LandPlotResponseDTO;
import com.landmark.api.entity.Role;
import com.landmark.api.entity.User;
import com.landmark.api.repository.LandPlotRepository;
import com.landmark.api.repository.UserRepository;
import com.landmark.api.service.LandPlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LandPlotDataLoaderTest {

    @Mock
    private LandPlotRepository repository;

    @Mock
    private LandPlotService landPlotService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private LandPlotDataLoader dataLoader;

    private User sampleAdmin;

    @BeforeEach
    void setUp() {
        sampleAdmin = User.builder()
                .id(UUID.fromString("a0000000-0000-0000-0000-000000000001"))
                .name("LandMark Administrator")
                .email("admin@landmark.com")
                .password("hashed_password")
                .role(Role.ROLE_ADMIN)
                .build();
    }

    private LandPlotResponseDTO createSampleResponse() {
        return new LandPlotResponseDTO(
                UUID.randomUUID(),
                "Sample Plot",
                "Description",
                new BigDecimal("100000.00"),
                "contact@landmark.com",
                null,
                500.0,
                sampleAdmin.getId(),
                sampleAdmin.getName(),
                LocalDateTime.now(),
                null
        );
    }

    @Test
    @DisplayName("Should skip seeding when database already has plots")
    void shouldSkipSeedingWhenDatabaseNotEmpty() {
        when(userRepository.findByEmail("admin@landmark.com")).thenReturn(Optional.of(sampleAdmin));
        when(repository.count()).thenReturn(5L);

        dataLoader.run();

        verify(repository, times(1)).count();
        verify(landPlotService, never()).createPlot(any());
    }

    @Test
    @DisplayName("Should create default admin and seed 8 plots when database is empty")
    void shouldSeedPlotsWhenDatabaseIsEmpty() {
        when(userRepository.findByEmail("admin@landmark.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Landmark@123")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(sampleAdmin);

        when(repository.count()).thenReturn(0L, 8L);
        when(landPlotService.createPlot(any(LandPlotRequestDTO.class))).thenReturn(createSampleResponse());

        dataLoader.run();

        verify(userRepository, times(1)).save(any(User.class));
        verify(repository, atLeastOnce()).count();
        verify(landPlotService, times(8)).createPlot(any(LandPlotRequestDTO.class));
    }

    @Test
    @DisplayName("Should handle exception during single plot seed gracefully")
    void shouldHandleExceptionDuringPlotSeedGracefully() {
        when(userRepository.findByEmail("admin@landmark.com")).thenReturn(Optional.of(sampleAdmin));
        when(repository.count()).thenReturn(0L, 0L);
        when(landPlotService.createPlot(any(LandPlotRequestDTO.class)))
                .thenThrow(new RuntimeException("Simulated seed error"))
                .thenReturn(createSampleResponse());

        dataLoader.run();

        verify(landPlotService, times(8)).createPlot(any(LandPlotRequestDTO.class));
    }
}
