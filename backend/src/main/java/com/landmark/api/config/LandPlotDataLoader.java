package com.landmark.api.config;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.repository.LandPlotRepository;
import com.landmark.api.service.LandPlotService;
import com.landmark.api.entity.User;
import com.landmark.api.entity.Role;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;


import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Profile("!test")
public class LandPlotDataLoader implements CommandLineRunner {

    private final LandPlotRepository repository;
    private final LandPlotService landPlotService;
    private final com.landmark.api.repository.UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LandPlotDataLoader(
            LandPlotRepository repository,
            LandPlotService landPlotService,
            com.landmark.api.repository.UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.landPlotService = landPlotService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Ensure default administrator account exists
        User admin = userRepository.findByEmail("admin@landmark.com")
                .orElseGet(() -> {
                    User newAdmin = User.builder()
                            .id(java.util.UUID.fromString("a0000000-0000-0000-0000-000000000001"))
                            .name("LandMark Administrator")
                            .email("admin@landmark.com")
                            .password(passwordEncoder.encode("Landmark@123"))
                            .role(Role.ROLE_ADMIN)
                            .build();
                    return userRepository.save(newAdmin);
                });

        long currentCount = repository.count();
        if (currentCount > 0) {
            log.info("LandPlotDataLoader: Database already populated with {} plots. Skipping seed.", currentCount);
            return;
        }

        log.info("LandPlotDataLoader: Seeding database with 8 initial landmark plots across Brazil...");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        admin.getEmail(), null, admin.getAuthorities()
                )
        );

        try {

        // 1. São Paulo - Residential Lot (Jardins / Cerqueira César) ~520 m²
        createPlot(
                "Jardins Residential Lot - Lorena Avenue",
                "Prime 520 m² flat residential parcel in the heart of Jardins, São Paulo. Ideal for high-end single-family luxury residence or boutique architectural firm.",
                new BigDecimal("3850000.00"),
                "jardins.imoveis@landmark.com.br | (11) 98123-4567",
                List.of(
                        List.of(-46.66420, -23.56130),
                        List.of(-46.66395, -23.56130),
                        List.of(-46.66395, -23.56152),
                        List.of(-46.66420, -23.56152),
                        List.of(-46.66420, -23.56130)
                )
        );

        // 2. São Paulo - Corporate Commercial Block (Faria Lima / Itaim Bibi) ~9,800 m²
        createPlot(
                "Faria Lima Corporate Block - Itaim Bibi",
                "Prime corporate city block plot of nearly 1 hectare in one of Latin America's most prestigious financial districts. High FAR approved for Triple-A corporate skyscraper.",
                new BigDecimal("95000000.00"),
                "corporate.sp@landmark.com.br | (11) 99876-5432",
                List.of(
                        List.of(-46.68580, -23.58440),
                        List.of(-46.68480, -23.58440),
                        List.of(-46.68480, -23.58530),
                        List.of(-46.68580, -23.58530),
                        List.of(-46.68580, -23.58440)
                )
        );

        // 3. São Paulo - Logistics & Distribution Center (Rodoanel / Barueri) ~48,000 m² (4.8 ha)
        createPlot(
                "Rodoanel West Logistics Park",
                "Strategic 48,000 m² industrial and logistics development site with immediate access to Mario Covas Ring Road. Graded and permitted for distribution center or cross-docking.",
                new BigDecimal("28500000.00"),
                "logistica.sp@landmark.com.br | (11) 97321-9876",
                List.of(
                        List.of(-46.83700, -23.50350),
                        List.of(-46.83400, -23.50350),
                        List.of(-46.83400, -23.50550),
                        List.of(-46.83700, -23.50550),
                        List.of(-46.83700, -23.50350)
                )
        );

        // 4. Natal (RN) - Oceanfront Beach Parcel (Ponta Negra / Via Costeira) ~1,850 m²
        createPlot(
                "Ponta Negra Oceanfront Parcel",
                "Prime 1,850 m² beachfront parcel along the Ponta Negra coastline with panoramic views of Morro do Careca. Favorable zoning for boutique resort, hotel or beach club.",
                new BigDecimal("4200000.00"),
                "litoral.rn@landmark.com.br | (84) 98877-6655",
                List.of(
                        List.of(-35.17900, -5.87400),
                        List.of(-35.17700, -5.87400),
                        List.of(-35.17700, -5.87550),
                        List.of(-35.17900, -5.87550),
                        List.of(-35.17900, -5.87400)
                )
        );

        // 5. Goiás (Rio Verde) - Large Grain Agriculture Estate ~1,250 hectares (12,500,000 m²)
        createPlot(
                "Santa Fe Agricultural Estate - 1,250 ha Soy & Corn",
                "Highly productive agricultural estate in Rio Verde (GO), 100% flat arable land equipped with center pivot irrigation systems, water usage concession, and grain storage silos.",
                new BigDecimal("78000000.00"),
                "agro.goias@landmark.com.br | (64) 99234-5678",
                List.of(
                        List.of(-50.96500, -17.73500),
                        List.of(-50.93000, -17.73500),
                        List.of(-50.93000, -17.76500),
                        List.of(-50.96500, -17.76500),
                        List.of(-50.96500, -17.73500)
                )
        );

        // 6. Mato Grosso do Sul / Pantanal (Miranda) - Mega Livestock & Crop Ranch ~8,200 hectares (82,000,000 m²)
        createPlot(
                "Pantanal South Mega Ranch - 8,200 Hectares",
                "Expansive dual-purpose ranch (livestock and mechanized farming) in Miranda (MS). Includes licensed private airstrip, colonial main house, cattle feeding facilities, and fenced pastures.",
                new BigDecimal("165000000.00"),
                "mega.agro@landmark.com.br | (67) 98111-2233",
                List.of(
                        List.of(-56.85000, -19.86000),
                        List.of(-56.75000, -19.86000),
                        List.of(-56.75000, -19.94000),
                        List.of(-56.85000, -19.94000),
                        List.of(-56.85000, -19.86000)
                )
        );

        // 7. Curitiba (PR) - Batel / Ecoville - High-Rise Residential Lot ~2,400 m²
        createPlot(
                "Ecoville / Batel Corner Lot",
                "Prime 2,400 m² residential corner lot on tree-lined street in Curitiba's elite Batel / Ecoville district. Optimal building coefficient for luxury residential tower.",
                new BigDecimal("14800000.00"),
                "curitiba.prime@landmark.com.br | (41) 98456-7890",
                List.of(
                        List.of(-49.31600, -25.43700),
                        List.of(-49.31350, -25.43700),
                        List.of(-49.31350, -25.43900),
                        List.of(-49.31600, -25.43900),
                        List.of(-49.31600, -25.43700)
                )
        );

        // 8. Mantiqueira Mountain Range (Campos do Jordão / Santo Antônio do Pinhal) ~95,000 m² (9.5 ha)
        createPlot(
                "High Mantiqueira Mountain Retreat - Natural Springs & Pines",
                "Scenic 9.5-hectare mountain property featuring panoramic views, 3 crystalline natural water springs, preserved Araucaria pine forest, and a rustic lodge.",
                new BigDecimal("3200000.00"),
                "mantiqueira.sitios@landmark.com.br | (12) 99122-3344",
                List.of(
                        List.of(-45.62500, -22.77500),
                        List.of(-45.61500, -22.77500),
                        List.of(-45.61500, -22.78500),
                        List.of(-45.62500, -22.78500),
                        List.of(-45.62500, -22.77500)
                )
        );

        log.info("LandPlotDataLoader: Successfully seeded {} plots into database.", repository.count());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void createPlot(String title, String description, BigDecimal price, String contact, List<List<Double>> ringCoordinates) {
        try {
            GeoJsonPolygonDTO geometry = new GeoJsonPolygonDTO("Polygon", List.of(ringCoordinates));
            LandPlotRequestDTO request = new LandPlotRequestDTO(
                    title,
                    description,
                    price,
                    contact,
                    geometry
            );
            landPlotService.createPlot(request);
        } catch (Exception e) {
            log.error("Failed to seed plot '{}': {}", title, e.getMessage(), e);
        }
    }
}
