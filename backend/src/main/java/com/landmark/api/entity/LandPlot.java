package com.landmark.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "land_plots", indexes = {
        @Index(name = "idx_land_plots_geometry", columnList = "geometry")
})
@Getter
@Setter
@Builder
@AllArgsConstructor
public class LandPlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "title", length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "total_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "contact", length = 100, nullable = false)
    private String contact;

    @Column(name = "geometry", columnDefinition = "geometry(Polygon, 4326)", nullable = false)
    private Polygon geometry;

    @Column(name = "area_square_meters")
    private Double areaSquareMeters;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User owner;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LandPlot() {
    }

    public LandPlot(UUID id, String title, String description, BigDecimal totalPrice,
                    String contact, Polygon geometry, Double areaSquareMeters,
                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.totalPrice = totalPrice;
        this.contact = contact;
        this.geometry = geometry;
        this.areaSquareMeters = areaSquareMeters;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
