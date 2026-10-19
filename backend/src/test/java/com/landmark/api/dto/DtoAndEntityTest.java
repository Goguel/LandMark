package com.landmark.api.dto;

import com.landmark.api.entity.LandPlot;
import com.landmark.api.entity.Role;
import com.landmark.api.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class DtoAndEntityTest {

    @Test
    @DisplayName("Should verify GeoJsonPolygonDTO records")
    void testGeoJsonPolygonDTO() {
        List<List<Double>> ring = List.of(
                List.of(1.0, 2.0),
                List.of(3.0, 4.0),
                List.of(1.0, 2.0)
        );
        GeoJsonPolygonDTO dto = new GeoJsonPolygonDTO("Polygon", List.of(ring));

        assertEquals("Polygon", dto.type());
        assertEquals(1, dto.coordinates().size());
        assertEquals(3, dto.coordinates().getFirst().size());

        GeoJsonPolygonDTO defaultTypeDto = new GeoJsonPolygonDTO(List.of(ring));
        assertEquals("Polygon", defaultTypeDto.type());
    }

    @Test
    @DisplayName("Should verify LandPlotRequestDTO and ResponseDTO records")
    void testPlotDTOs() {
        GeoJsonPolygonDTO poly = new GeoJsonPolygonDTO(List.of(List.of(List.of(1.0, 2.0))));
        LandPlotRequestDTO req = new LandPlotRequestDTO("T", "D", BigDecimal.TEN, "C", poly);

        assertEquals("T", req.title());
        assertEquals("D", req.description());
        assertEquals(BigDecimal.TEN, req.totalPrice());
        assertEquals("C", req.contact());
        assertEquals(poly, req.geometry());

        UUID id = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        LandPlotResponseDTO res = new LandPlotResponseDTO(id, "T", "D", BigDecimal.TEN, "C", poly, 100.0, ownerId, "Owner", now, now);

        assertEquals(id, res.id());
        assertEquals("T", res.title());
        assertEquals("D", res.description());
        assertEquals(BigDecimal.TEN, res.totalPrice());
        assertEquals("C", res.contact());
        assertEquals(poly, res.geometry());
        assertEquals(100.0, res.areaSquareMeters());
        assertEquals(ownerId, res.ownerId());
        assertEquals("Owner", res.ownerName());
        assertEquals(now, res.createdAt());
        assertEquals(now, res.updatedAt());
    }

    @Test
    @DisplayName("Should verify RadiusSearchRequestDTO record")
    void testRadiusSearchRequestDTO() {
        RadiusSearchRequestDTO dto = new RadiusSearchRequestDTO(-46.0, -23.0, 1000.0);

        assertEquals(-46.0, dto.longitude());
        assertEquals(-23.0, dto.latitude());
        assertEquals(1000.0, dto.radiusInMeters());
    }

    @Test
    @DisplayName("Should verify Auth DTOs")
    void testAuthDTOs() {
        LoginRequestDTO loginReq = new LoginRequestDTO("test@landmark.com", "Secret123");
        assertEquals("test@landmark.com", loginReq.email());
        assertEquals("Secret123", loginReq.password());

        RegisterRequestDTO regReq = new RegisterRequestDTO("User Name", "user@landmark.com", "Password123");
        assertEquals("User Name", regReq.name());
        assertEquals("user@landmark.com", regReq.email());
        assertEquals("Password123", regReq.password());

        UUID userId = UUID.randomUUID();
        AuthResponseDTO authRes = new AuthResponseDTO("jwt-token", userId, "User Name", "user@landmark.com", "ROLE_USER");
        assertEquals("jwt-token", authRes.token());
        assertEquals("Bearer", authRes.type());
        assertEquals(userId, authRes.id());
        assertEquals("User Name", authRes.name());
        assertEquals("user@landmark.com", authRes.email());
        assertEquals("ROLE_USER", authRes.role());
    }

    @Test
    @DisplayName("Should verify LandPlot entity getters and setters")
    void testLandPlotEntity() {
        LandPlot plot = new LandPlot();
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        User owner = User.builder().id(UUID.randomUUID()).name("Owner").email("o@l.com").role(Role.ROLE_USER).build();

        plot.setId(id);
        plot.setTitle("Title");
        plot.setDescription("Desc");
        plot.setTotalPrice(BigDecimal.valueOf(5000));
        plot.setContact("Contact");
        plot.setAreaSquareMeters(500.0);
        plot.setOwner(owner);
        plot.setCreatedAt(now);
        plot.setUpdatedAt(now);

        assertEquals(id, plot.getId());
        assertEquals("Title", plot.getTitle());
        assertEquals("Desc", plot.getDescription());
        assertEquals(BigDecimal.valueOf(5000), plot.getTotalPrice());
        assertEquals("Contact", plot.getContact());
        assertEquals(500.0, plot.getAreaSquareMeters());
        assertEquals(owner, plot.getOwner());
        assertEquals(now, plot.getCreatedAt());
        assertEquals(now, plot.getUpdatedAt());
    }

    @Test
    @DisplayName("Should verify User entity and UserDetails methods")
    void testUserEntity() {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        User user = new User();
        user.setId(id);
        user.setName("John Doe");
        user.setEmail("john@landmark.com");
        user.setPassword("hashed");
        user.setRole(Role.ROLE_USER);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        assertEquals(id, user.getId());
        assertEquals("John Doe", user.getName());
        assertEquals("john@landmark.com", user.getEmail());
        assertEquals("hashed", user.getPassword());
        assertEquals(Role.ROLE_USER, user.getRole());
        assertEquals("john@landmark.com", user.getUsername());
        assertEquals(now, user.getCreatedAt());
        assertEquals(now, user.getUpdatedAt());

        assertTrue(user.isAccountNonExpired());
        assertTrue(user.isAccountNonLocked());
        assertTrue(user.isCredentialsNonExpired());
        assertTrue(user.isEnabled());
        assertEquals(1, user.getAuthorities().size());
        assertEquals("ROLE_USER", user.getAuthorities().iterator().next().getAuthority());
    }
}
