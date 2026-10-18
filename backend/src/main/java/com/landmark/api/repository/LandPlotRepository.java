package com.landmark.api.repository;

import com.landmark.api.entity.LandPlot;
import org.locationtech.jts.geom.Polygon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LandPlotRepository extends JpaRepository<LandPlot, UUID> {

    /**
     * Checks if a new polygon overlaps in 2D area with any existing land plot.
     * Touching borders (dimension 1) or vertices (dimension 0) are permitted,
     * but true polygon area overlap (dimension 2) is flagged as conflict.
     */
    @Query(value = """
            SELECT CASE WHEN COUNT(l.id) > 0 THEN true ELSE false END
            FROM land_plots l
            WHERE ST_Intersects(l.geometry, :geometry) = true
              AND ST_Dimension(ST_Intersection(l.geometry, :geometry)) = 2
            """, nativeQuery = true)
    boolean hasSpatialOverlap(@Param("geometry") Polygon geometry);

    /**
     * Finds all land plots that intersect within a circular radius from a given center point.
     * Uses PostGIS geography casting to guarantee accurate meter calculations on the WGS84 spheroid.
     */
    @Query(value = """
            SELECT *
            FROM land_plots l
            WHERE ST_DWithin(
                CAST(l.geometry AS geography),
                CAST(ST_SetSRID(ST_Point(:longitude, :latitude), 4326) AS geography),
                :radiusInMeters
            )
            ORDER BY ST_Distance(
                CAST(l.geometry AS geography),
                CAST(ST_SetSRID(ST_Point(:longitude, :latitude), 4326) AS geography)
            ) ASC
            """, nativeQuery = true)
    List<LandPlot> findWithinRadius(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("radiusInMeters") double radiusInMeters
    );

    /**
     * Finds all land plots that intersect with an arbitrary search polygon.
     */
    @Query(value = """
            SELECT *
            FROM land_plots l
            WHERE ST_Intersects(l.geometry, :searchGeometry) = true
            """, nativeQuery = true)
    List<LandPlot> findIntersectingGeometry(@Param("searchGeometry") Polygon searchGeometry);
}
