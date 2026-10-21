# LandMark - Interactive Real Estate GIS Platform

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot 3.4](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![PostGIS 3.4](https://img.shields.io/badge/PostGIS-3.4-blue.svg)](https://postgis.net/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![OpenLayers](https://img.shields.io/badge/OpenLayers-latest-blue.svg)](https://openlayers.org/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready-blue.svg)](https://www.docker.com/)
[![CI / CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-brightgreen.svg?logo=githubactions&logoColor=white)](https://github.com/Goguel/LandMark/actions)

**LandMark** is a modern, production-grade geospatial real estate web platform designed for advertising, discovering, and visualizing land plots on a high-precision dynamic map. Built with an uncompromising focus on geospatial precision, modern decoupled architecture, and intuitive user experience, LandMark allows users to draw real-world property boundaries, validate spatial overlaps natively through PostGIS, and perform interactive proximity searches.

---

## Summary

- [1. Core Platform Features](#1-core-platform-features)
- [2. Architecture & Engineering Highlights](#2-architecture--engineering-highlights)
  - [2.1. Spatial Overlap Logic: Why `ST_Dimension = 2`?](#21-spatial-overlap-logic-why-st_dimension--2)
  - [2.2. Geodesic Proximity on the WGS84 Ellipsoid](#22-geodesic-proximity-on-the-wgs84-ellipsoid)
  - [2.3. Flyway Versioning & `ddl-auto: validate`](#23-flyway-versioning--ddl-auto-validate)
  - [2.4. React 18 + OpenLayers Decoupled Overlay Architecture](#24-react-18--openlayers-decoupled-overlay-architecture)
  - [2.5. Stateless JWT Authentication & Land Ownership](#25-stateless-jwt-authentication--land-ownership)
  - [2.6. Preconfigured Demo Credentials](#26-preconfigured-demo-credentials)
- [3. Interactive API Documentation (Swagger / OpenAPI 3)](#3-interactive-api-documentation-swagger--openapi-3)
- [4. Preloaded Brazilian Land Catalog (Seed Data)](#4-preloaded-brazilian-land-catalog-seed-data)
- [5. Quick Start with Docker Compose (Recommended)](#5-quick-start-with-docker-compose-recommended)
- [6. Running Locally (Without Docker)](#6-running-locally-without-docker)
- [7. Testing & Code Coverage (>80%)](#7-testing--code-coverage-80)

---

## 1. Core Platform Features

- **Interactive Polygon Drawing**: Users draw parcel boundaries directly on the map. Vertices and geodesic areas (in m² and hectares) are calculated in real time.
- **Topological Overlap Detection**: The backend prevents double-allocation by validating that proposed plots do not overlap pre-existing lands (returns HTTP `409 Conflict`).
- **Dynamic Radius Proximity Search**: Users define custom circular search zones directly on the map by expanding a radius HUD in real time, filtering all intersecting plots.
- **Interactive Property Inspection**: Clicking any registered plot reveals property details, calculated dimensions, price in Brazilian Reais (`R$`), and seller contact.
- **Secure Authentication & User Accounts (Spring Security + JWT)**: Stateless authentication with BCrypt password hashing. Users register and log in to advertise land parcels, view their account badge, and manage their listings.
- **Personal Portfolio ("My Plots") Filtering**: Authenticated users can toggle their personal portfolio view in the sidebar or map to immediately filter and inspect only the land plots they own.
- **Plot Ownership & Protected Deletion**: Plots are permanently linked to their creator (`user_id`). Deletion is strictly enforced: only the verified plot owner or an administrator (`ROLE_ADMIN`) has authorization to delete a parcel (returns HTTP `403 Forbidden` otherwise).
- **High-Resolution Multi-Basemaps**:
  - 🌙 **Dark Minimal** (Esri Canvas Dark with continuous overzooming)
  - 🌐 **Google Hybrid** (Ultra high-res aerial satellite photography with street names up to zoom 21, perfect for house-level parcels)
  - 🏘️ **Streets & Parcels** (Esri World Street Map with urban blocks and parcel outlines)
  - 🛰️ **Satellite** (Esri World Imagery)
  - ☀️ **Light Minimal** (Esri Canvas Light)
  - 🗺️ **Standard OSM** (OpenStreetMap)
- **Automatic Form Reset & Resilience**: Plot registration forms reset cleanly on every interaction, and an integrated React `ErrorBoundary` ensures display continuity.
- **Preloaded Brazilian Land Catalog**: 8 diverse land plots (residential house, commercial city block, logistics park, beachside plot, and large-scale agricultural farms) seeded automatically on startup.

---

## 2. Architecture & Engineering Highlights

```mermaid
graph TD
    Client["React 18 + OpenLayers (Frontend)"]
    API["Spring Boot 3.4 REST API (Java 21)"]
    Flyway["Flyway Migration Engine"]
    DB[("PostgreSQL 16 + PostGIS 3.4")]
    Swagger["OpenAPI 3 / Swagger UI"]

    Client -->|HTTP REST + Bearer JWT / GeoJSON EPSG:4326| API
    API -->|Hibernate Spatial + JTS| DB
    Flyway -->|Versioned DDL V1 & V2 + GiST Index| DB
    API -->|Generates Docs + JWT Security Scheme| Swagger
```

### 2.1. Spatial Overlap Logic: Why `ST_Dimension = 2`?
A common pitfall in GIS development is calling `ST_Intersects` blindly. If two adjacent property plots share a common boundary line (fence/wall) or a single corner vertex, `ST_Intersects` returns `true`. In the real world, **neighboring plots naturally touch boundaries**!

LandMark implements mathematically sound topological validation in [LandPlotRepository.java](backend/src/main/java/com/landmark/api/repository/LandPlotRepository.java):
```sql
SELECT CASE WHEN COUNT(l.id) > 0 THEN true ELSE false END
FROM land_plots l
WHERE ST_Intersects(l.geometry, :geometry) = true
  AND ST_Dimension(ST_Intersection(l.geometry, :geometry)) = 2
```
- **Dimension 0 (Points)**: Shared corner vertices between lots &rarr; **Permitted**
- **Dimension 1 (Lines)**: Shared property boundary borders &rarr; **Permitted**
- **Dimension 2 (Polygons)**: True spatial area overlap &rarr; **Rejected (HTTP 409 Conflict)**

### 2.2. Geodesic Proximity on the WGS84 Ellipsoid
When searching within a radius, Euclidean degree distances produce severe distortion. LandMark casts geometries to PostGIS `geography` types:
```sql
ST_DWithin(
    CAST(l.geometry AS geography),
    CAST(ST_SetSRID(ST_Point(:longitude, :latitude), 4326) AS geography),
    :radiusInMeters
)
```
This guarantees that a 5,000m radius search covers exactly 5,000 real meters on the curved Earth spheroid.

### 2.3. Flyway Versioning & `ddl-auto: validate`
Instead of brittle runtime DDL manipulation (`ddl-auto: update`), the database schema is strictly managed via **Flyway migrations**:
- `V1__create_spatial_schema.sql`: Explicit PostGIS extension activation (`CREATE EXTENSION IF NOT EXISTS postgis`) and spatial GiST index creation (`CREATE INDEX idx_land_plots_geometry ON land_plots USING GIST (geometry)`).
- `V2__create_users_and_ownership.sql`: Creates `users` table with unique email indexing, BCrypt password hashing, and binds `land_plots` to owner user accounts (`user_id UUID REFERENCES users(id)`).
- Hibernate runs in `validate` mode to ensure strict schema adherence without unexpected schema drift.

### 2.4. React 18 + OpenLayers Decoupled Overlay Architecture
OpenLayers overlays reparent DOM elements into its internal viewport container. In React 18, inserting conditional JSX siblings (such as the live radius HUD) next to reparented elements causes DOM reconciliation exceptions (`NotFoundError: insertBefore`). 

LandMark decouples the overlay container from the React JSX reconciliation tree using `createPortal(content, overlayDomNode)`, eliminating reconciliation crashes permanently.

### 2.5. Stateless JWT Authentication & Land Ownership
To ensure production scalability and secure ownership of geospatial assets, LandMark incorporates a stateless authentication architecture powered by **Spring Security 6** and **JSON Web Tokens (JWT)**:
- **Stateless Session Management**: `SessionCreationPolicy.STATELESS` ensures zero server-side session overhead. Every authenticated request is validated via `JwtAuthenticationFilter` reading the `Authorization: Bearer <token>` header.
- **Cryptographic Security**: Tokens are signed using HMAC-SHA256 with a 256-bit secret key managed securely via `.env`. Passwords are protected using salted `BCryptPasswordEncoder`.
- **Ownership Binding & Authorization**: When an authenticated user creates a land plot, the system automatically associates the parcel with their user ID. In [LandPlotService.java](backend/src/main/java/com/landmark/api/service/LandPlotService.java), deletion requests check that the requester matches `plot.getUser().getId()` or holds `ROLE_ADMIN`, otherwise throwing a `ForbiddenException` (`403 Forbidden`).

### 2.6. Preconfigured Demo Credentials

To streamline evaluation and manual walkthroughs without requiring manual user creation, the system automatically seeds a default administrator account upon database initialization:

| Field | Demo Administrator Value | Notes |
|---|---|---|
| **Email** | `admin@landmark.com` | Preloaded with `ROLE_ADMIN` privileges |
| **Password** | `Landmark@123` | Salted BCrypt hash |
| **UI Autofill** | One-Click Button | In the Sign-In modal, click **"Autofill admin@landmark.com"** |

> **Self-Registration**: Evaluators may also register brand-new personal accounts dynamically via the frontend's **"Create Account"** tab or `POST /api/auth/register`.

---

## 3. Interactive API Documentation (Swagger / OpenAPI 3)

The backend provides complete **Swagger UI** documentation with interactive testing capabilities, preconfigured with the **Bearer JWT** authorization scheme:

- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

> **Testing Protected Routes in Swagger**: Click the **Authorize** 🔓 button at the top right of Swagger UI and paste your JWT token (`Bearer <token>`) to test authenticated endpoints interactively.

### API Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account (returns JWT token and profile) |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password (returns JWT token) |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current authenticated user profile |
| `POST` | `/api/plots` | Authenticated | Register a new land plot (validates 2D overlap, links creator) |
| `GET` | `/api/plots` | Public | List all registered land plots with GeoJSON geometries |
| `GET` | `/api/plots/my-plots` | Authenticated | Retrieve land plots belonging exclusively to the authenticated user |
| `GET` | `/api/plots/{id}` | Public | Retrieve single land plot details by UUID |
| `GET` | `/api/plots/search/radius` | Public | Proximity search by radius (`longitude`, `latitude`, `radiusInMeters`) |
| `POST` | `/api/plots/search-by-geometry` | Public | Search plots intersecting an arbitrary GeoJSON polygon |
| `DELETE` | `/api/plots/{id}` | Authenticated | Delete a land plot (restricted to plot owner or `ROLE_ADMIN`) |

> **Note**: Both `/api/plots` and `/api/lands` routing prefixes are supported interchangeably.

---

## 4. Preloaded Brazilian Land Catalog (Seed Data)

Upon startup, `LandPlotDataLoader` automatically populates the database with 8 representative properties:

| # | Location | Title | Type / Scope | Calculated Area | Price (R$) |
|---|---|---|---|---|---|
| 1 | **São Paulo (Jardins)** | Jardins Residential Lot - Lorena Avenue | Residential House Lot | **623 m²** | R$ 3.850.000,00 |
| 2 | **São Paulo (Faria Lima)** | Faria Lima Corporate Block - Itaim Bibi | Commercial City Block | **10.198 m²** (~1 ha) | R$ 95.000.000,00 |
| 3 | **São Paulo (Rodoanel)** | Rodoanel West Logistics Park | Industrial Logistics Park | **68.030 m²** (6.8 ha) | R$ 28.500.000,00 |
| 4 | **Natal (RN - Ponta Negra)** | Ponta Negra Oceanfront Parcel | Beachfront / Hospitality | **36.898 m²** (3.6 ha) | R$ 4.200.000,00 |
| 5 | **Goiás (Rio Verde)** | Santa Fe Agricultural Estate - Soy & Corn | Grain Farm | **12.364.538 m²** (1.236 ha) | R$ 78.000.000,00 |
| 6 | **Pantanal / MS (Miranda)** | Pantanal South Mega Ranch | Mega Cattle & Crop Farm | **93.008.373 m²** (9.300 ha) | R$ 165.000.000,00 |
| 7 | **Curitiba (PR - Batel)** | Ecoville / Batel Corner Lot | High-Rise Residential Lot | **55.828 m²** (5.5 ha) | R$ 14.800.000,00 |
| 8 | **Mantiqueira (Campos do Jordão)**| High Mantiqueira Mountain Retreat | Ecotourism / Mountain Farm | **1.139.990 m²** (114 ha) | R$ 3.200.000,00 |

---

## 5. Quick Start with Docker Compose (Recommended)

The entire fullstack ecosystem (PostgreSQL/PostGIS, Spring Boot API, and React Frontend) starts with a single command.

### Prerequisites
- [Docker Desktop](https://www.docker.com/) (version 24+)

### 1. Environment Configuration (`.env`)
The platform follows the **Twelve-Factor App (Config)** standard. Infrastructure settings, database credentials, ports, and the 256-bit JWT cryptographic key are managed via environment variables.

To customize settings, copy the provided template to create your `.env` file:
```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

> **Note**: Sensible fallback defaults are preconfigured for local development, so Docker Compose runs out of the box even without creating `.env`.

### 2. Build and Launch
```bash
# 1. Clone the repository
git clone https://github.com/Goguel/LandMark.git
cd LandMark

# 2. Build and launch all services
docker compose up --build
```

### Access URLs
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Backend API**: [http://localhost:8080/api/plots](http://localhost:8080/api/plots)
- **PostgreSQL PostGIS**: `localhost:5432` (`landmark_db`, user: `landmark_user`, pass: `landmark_pass`)

---

## 6. Running Locally (Without Docker)

### Prerequisites
- **Java JDK 21+**
- **Node.js 20+** & **npm**
- **PostgreSQL 16+** with **PostGIS** extension

### 1. Environment Configuration (`.env`)
Generate your local `.env` configuration file from the template:
```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```
The backend automatically detects and loads properties from `.env` on startup via `springboot-dotenv`.

### 2. Database Setup
```sql
CREATE DATABASE landmark_db;
\c landmark_db;
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Backend
```bash
cd backend
./mvnw spring-boot:run
```
The API starts on port `8080`.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```
The client starts on [http://localhost:3000](http://localhost:3000).

---

## 7. Testing & Code Coverage (>80%)

Both frontend and backend include automated test suites exceeding the 80% coverage requirement.

### Backend Tests (JaCoCo)
```bash
cd backend
./mvnw clean test jacoco:report
```
- **71 Automated Tests** covering Controllers, Services, JWT Authentication Filter, Token Provider, Ownership Authorization, Spatial Repositories, DataLoader, and OpenAPI configurations.
- **JaCoCo Coverage**: **91% instruction and line coverage** (well above the 80% threshold).
- Report location: `backend/target/site/jacoco/index.html`

### Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npm run test:coverage
```
- **100 Automated Tests** across 13 test suites covering Auth Context, Login/Register forms, "My Plots" portfolio filtering, Polygon Drawing HUD, Error Boundary recovery, Popup inspection, Role-based Delete buttons, Sidebar, and API integration.
- **Vitest v8 Coverage**:
  - **86.6% Lines**
  - **85.5% Statements**
  - **81.5% Branches**
  - **83.7% Functions**
- Report location: `frontend/coverage/index.html`
