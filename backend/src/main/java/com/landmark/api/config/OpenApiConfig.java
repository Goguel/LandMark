package com.landmark.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI landmarkOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LandMark - Real Estate GIS Platform API")
                        .description("""
                                Modern Geospatial REST API for managing, advertising, and discovering land plots.
                                
                                Key Architectural Highlights:
                                - **Topological Overlap Detection**: Uses native PostGIS `ST_Intersects` and `ST_Dimension(ST_Intersection) = 2` to strictly prevent area overlaps while allowing shared borders/vertices.
                                - **Geodesic Proximity Search**: Uses PostGIS `geography` casting with `ST_DWithin` on the WGS84 spheroid for true meter-distance calculations.
                                - **GeoJSON Integration**: Standard RFC 7946 Polygon structures in EPSG:4326.
                                - **Stateless JWT Security**: Role-based access control (RBAC) and property ownership enforcement.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("LandMark Engineering Team")
                                .email("engineering@landmark.com.br"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token obtained from POST /api/auth/login or POST /api/auth/register")))
                .servers(List.of(
                        new Server().url("/").description("Current Server Environment")
                ));
    }
}
