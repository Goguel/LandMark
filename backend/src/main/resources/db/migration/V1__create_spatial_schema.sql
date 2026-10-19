-- Flyway Migration V1: Initialize PostGIS Extension and Spatial Land Plots Schema
-- Designed for LandMark Real Estate GIS Platform

-- Enable PostGIS extension for spatial geometric types and functions
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create main land_plots table
CREATE TABLE IF NOT EXISTS land_plots (
    id UUID PRIMARY KEY,
    title VARCHAR(150),
    description TEXT NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    contact VARCHAR(100) NOT NULL,
    geometry geometry(Polygon, 4326) NOT NULL,
    area_square_meters DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- Spatial GiST (Generalized Search Tree) index for sub-millisecond bounding box and topological queries
CREATE INDEX IF NOT EXISTS idx_land_plots_geometry ON land_plots USING GIST (geometry);
