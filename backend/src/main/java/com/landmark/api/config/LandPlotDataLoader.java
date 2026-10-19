package com.landmark.api.config;

import com.landmark.api.dto.GeoJsonPolygonDTO;
import com.landmark.api.dto.LandPlotRequestDTO;
import com.landmark.api.repository.LandPlotRepository;
import com.landmark.api.service.LandPlotService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Profile("!test")
public class LandPlotDataLoader implements CommandLineRunner {

    private final LandPlotRepository repository;
    private final LandPlotService landPlotService;

    public LandPlotDataLoader(LandPlotRepository repository, LandPlotService landPlotService) {
        this.repository = repository;
        this.landPlotService = landPlotService;
    }

    @Override
    public void run(String... args) {
        long currentCount = repository.count();
        if (currentCount > 0) {
            log.info("LandPlotDataLoader: Database already populated with {} plots. Skipping seed.", currentCount);
            return;
        }

        log.info("LandPlotDataLoader: Seeding database with 8 initial landmark plots across Brazil...");

        // 1. São Paulo - Lote Residencial (Jardins / Cerqueira César) ~520 m² (Casa de Alto Padrão)
        createPlot(
                "Lote Residencial Jardins - Al. Lorena",
                "Excelente lote residencial plano de aproximadamente 520 m² no coração dos Jardins. Ideal para residência unifamiliar de alto padrão ou escritório boutique.",
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

        // 2. São Paulo - Quarteirão Comercial / Corporativo (Faria Lima / Itaim Bibi) ~9.800 m²
        createPlot(
                "Quadra Corporativa Faria Lima - Itaim Bibi",
                "Terreno de quarteirão com quase 1 hectare em um dos eixos comerciais mais valorizados da América Latina. Potencial construtivo para torre corporativa Triple A.",
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

        // 3. São Paulo - Centro Logístico / Galpão Industrial (Rodoanel / Barueri) ~48.000 m² (4.8 ha)
        createPlot(
                "Parque Logístico Rodoanel Oeste",
                "Área industrial e logística estratégica de 48.000 m² com acesso imediato ao Rodoanel Mário Covas. Terraplenagem pronta para centro de distribuição ou cross-docking.",
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

        // 4. Natal (RN) - Lote Beira-Mar (Ponta Negra / Via Costeira) ~1.850 m²
        createPlot(
                "Terreno Frente-Mar Ponta Negra",
                "Terreno beira-mar de 1.850 m² na orla de Ponta Negra, com vista panorâmica para o Morro do Careca. Zoneamento favorável para hotel boutique, pousada ou beach club.",
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

        // 5. Goiás (Rio Verde) - Grande Fazenda de Grãos ~1.250 hectares (12.500.000 m²)
        createPlot(
                "Fazenda Santa Fé - 1.250 ha de Soja e Milho",
                "Propriedade agrícola altamente produtiva em Rio Verde (GO), 100% plana com pivôs de irrigação instalados, outorga de água e silos graneleiros próprios.",
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

        // 6. Mato Grosso do Sul / Pantanal (Miranda) - Mega Fazenda Agropecuária ~8.200 hectares (82.000.000 m²)
        createPlot(
                "Mega Fazenda Pantanal Sul - 8.200 Hectares",
                "Mega propriedade com dupla aptidão (pecuária de corte e agricultura tecnificada). Pista de pouso homologada, sede colonial, confinamento e pastagens formadas.",
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

        // 7. Curitiba (PR) - Batel / Ecoville - Terreno para Edifício Residencial ~2.400 m²
        createPlot(
                "Terreno de Esquina Ecoville / Batel",
                "Terreno nobre de 2.400 m² na arborizada 'rua do outono' em Curitiba. Coeficiente de aproveitamento ideal para empreendimento residencial de alto padrão.",
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

        // 8. Serra da Mantiqueira (Campos do Jordão / Santo Antônio do Pinhal) - Sítio de Ecoturismo ~95.000 m² (9.5 ha)
        createPlot(
                "Sítio Alto da Mantiqueira - Nascentes e Araucárias",
                "Propriedade rural de 9.5 hectares com vista cinematográfica para as montanhas, 3 nascentes de água cristalina, bosque de araucárias preservadas e chalé rústico.",
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
