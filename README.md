# LandMark - Interactive Real Estate GIS Platform

LandMark is an interactive, spatial real estate platform designed for advertising, discovering, and visualizing land plots on a dynamic map interface. Built with an emphasis on geospatial accuracy, modern software architecture, and seamless user experience, LandMark allows users to draw exact plot boundaries, validate spatial overlaps natively, and perform interactive radius-based proximity searches.

---

## 1. What is LandMark?

LandMark addresses key challenges in digital land transactions by placing the map at the center of the experience:
- **Plot Registration**: Users freely navigate an interactive map, draw the exact polygon boundaries of their land plot, and provide essential listing details (total price, description, contact). The backend strictly validates and prevents plot overlaps with pre-existing lands.
- **Dynamic Radius Search**: Prospective buyers or investors define search areas directly on the map by dragging an interactive circle with real-time radius indicators, filtering plots that intersect the selected zone.
- **Plot Inspection & Visualization**: Clicking any registered plot reveals detailed property information through interactive map popups.

---

## 2. Architecture & How It Works

The platform adopts a decoupled multi-tier architecture adhering to **SOLID** principles and geospatial best practices:

- **Frontend (Web Client)**:
  - Built with **React** and **OpenLayers** (`ol`).
  - Handles vector layers, real-time spatial drawing interactions (Polygon, Circle), styling, and coordinate projection transformations (between EPSG:3857 for web tiles and EPSG:4326 WGS 84 for data exchange).
- **Backend (REST API)**:
  - Built with **Java 21** and **Spring Boot 3**.
  - Layered architecture: Controllers, DTOs, Services, Repositories, Domain Entities, and Exception Handlers.
  - Leverages **Hibernate Spatial** and **JTS (Java Topology Suite)** to process geometry payloads in standard GeoJSON format.
- **Database (Spatial Engine)**:
  - **PostgreSQL 16** with the **PostGIS 3** extension.
  - Utilizes native PostGIS functions (e.g., `ST_Intersects`, `ST_Overlaps`) backed by spatial GiST indexes for sub-millisecond topological queries.

---

## 3. Running with Docker (Recommended)

The easiest way to run the complete environment (Database, Backend API, and Frontend) is via Docker Compose:

### Prerequisites
- [Docker Desktop](https://www.docker.com/) (version 24+ recommended)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Goguel/LandMark
cd LandMark

# Build and start all services simultaneously
docker compose up --build
```

### Services Access
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **PostgreSQL / PostGIS**: `localhost:5432` (Database: `landmark_db`, User: `landmark_user`)

---

## 4. Running Without Docker (Local Development)

### Prerequisites
- **Java JDK 21+**
- **Node.js 20+** & **npm**
- **PostgreSQL 16+** with **PostGIS** extension installed

### 1. Database Setup
```sql
CREATE DATABASE landmark_db;
\c landmark_db;
CREATE EXTENSION postgis;
```

### 2. Backend API
```bash
cd backend
mvn spring-boot:run
```
The API starts on `http://localhost:8080`.

### 3. Frontend App
```bash
cd frontend
npm install
npm run dev
```
The client starts on `http://localhost:5173`.

---

## 5. Running Tests & Code Coverage (>80%)

LandMark enforces a strict **> 80% code coverage threshold** verified automatically in the build pipeline.

### Backend Tests (JaCoCo)
```bash
cd backend
mvn clean test
```
The JaCoCo coverage verification runs during the test lifecycle. You can view the HTML report at:
`backend/target/site/jacoco/index.html`

### Frontend Tests
```bash
cd frontend
npm run test:coverage
```
The frontend coverage report is generated at:
`frontend/coverage/index.html`
