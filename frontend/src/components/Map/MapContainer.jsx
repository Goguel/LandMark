import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import CircleGeom from 'ol/geom/Circle';
import Draw from 'ol/interaction/Draw';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import {
  geoJson4326ToPolygon3857,
  calculateGeodesicAreaM2,
  polygon3857ToGeoJson4326,
  calculateGeodesicRadiusMeters,
  formatDistance,
} from '../../utils/geoUtils';
import { PlotDetailsPopup } from '../Popup/PlotDetailsPopup';
import './MapContainer.css';

// Basemap configurations:
// - Esri Dark Minimal (maxZoom: 16, overzooms cleanly past 16 without error)
// - Esri Satellite (maxZoom: 19, aerial photography showing house parcels)
// - Google Hybrid (maxZoom: 21, high-detail satellite with street/parcel labels)
// - Esri Streets & Parcels (maxZoom: 19, detailed urban streets, buildings & parcels)
// - Esri Light Minimal (maxZoom: 16)
// - Standard OSM (maxZoom: 19)
export const BASEMAP_OPTIONS = [
  {
    id: 'dark',
    name: 'Dark Minimal',
    icon: '🌙',
    createSource: () =>
      new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attributions:
          'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }),
  },
  {
    id: 'satellite',
    name: 'Satellite',
    icon: '🛰️',
    createSource: () =>
      new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }),
  },
  {
    id: 'google_hybrid',
    name: 'Google Hybrid',
    icon: '🌐',
    createSource: () =>
      new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attributions: '&copy; Google Maps',
        maxZoom: 21,
      }),
  },
  {
    id: 'streets',
    name: 'Streets & Parcels',
    icon: '🏘️',
    createSource: () =>
      new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attributions:
          'Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
        maxZoom: 19,
      }),
  },
  {
    id: 'light',
    name: 'Light Minimal',
    icon: '☀️',
    createSource: () =>
      new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attributions:
          'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }),
  },
  {
    id: 'osm',
    name: 'Standard OSM',
    icon: '🗺️',
    createSource: () => new OSM(),
  },
];

// Styles for registered land plots
const plotNormalStyle = new Style({
  stroke: new Stroke({
    color: '#10b981', // vibrant emerald
    width: 2.5,
  }),
  fill: new Fill({
    color: 'rgba(16, 185, 129, 0.22)',
  }),
});

const plotSelectedStyle = new Style({
  stroke: new Stroke({
    color: '#06b6d4', // bright cyan
    width: 3.5,
  }),
  fill: new Fill({
    color: 'rgba(6, 182, 212, 0.38)',
  }),
});

// Style for drawing polygon
const drawPolygonStyle = new Style({
  stroke: new Stroke({
    color: '#10b981',
    width: 2.5,
    lineDash: [6, 6],
  }),
  fill: new Fill({
    color: 'rgba(16, 185, 129, 0.25)',
  }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#10b981' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

// Style for drawing search radius circle
const drawCircleStyle = new Style({
  stroke: new Stroke({
    color: '#f59e0b', // amber
    width: 2.5,
    lineDash: [6, 6],
  }),
  fill: new Fill({
    color: 'rgba(245, 158, 11, 0.18)',
  }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#f59e0b' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

// Style for persistent search radius visualization
const searchRadiusAreaStyle = new Style({
  stroke: new Stroke({
    color: '#f59e0b',
    width: 2,
    lineDash: [4, 4],
  }),
  fill: new Fill({
    color: 'rgba(245, 158, 11, 0.12)',
  }),
});

export function MapContainer({
  plots,
  mode,
  setMode,
  selectedPlot,
  setSelectedPlot,
  activeFilter,
  onPolygonCompleted,
  onRadiusSearchCompleted,
  onRadiusTooSmall,
  resetViewTrigger,
}) {
  const mapElementRef = useRef(null);
  const popupContainerRef = useRef(null);
  if (!popupContainerRef.current) {
    popupContainerRef.current = document.createElement('div');
    popupContainerRef.current.className = 'map-popup-overlay';
  }
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const plotsSourceRef = useRef(new VectorSource());
  const drawSourceRef = useRef(new VectorSource());
  const popupOverlayRef = useRef(null);
  const currentDrawRef = useRef(null);
  const draftFeatureRef = useRef(null);

  // Keep a ref of mode for map event listeners without recreating map instance
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Basemap switcher state (default: CartoDB Dark Minimal)
  const [activeBasemap, setActiveBasemap] = useState('dark');
  const [isBasemapMenuOpen, setIsBasemapMenuOpen] = useState(false);

  // Live radius display HUD while dragging the search circle
  const [liveRadius, setLiveRadius] = useState(null);

  // Default coordinate center (São Paulo - center of real estate activity)
  const defaultCenter = fromLonLat([-46.633308, -23.550520]);
  const defaultZoom = 14;

  // Initialize Map
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    // Basemap Layer
    const initialBasemap = BASEMAP_OPTIONS.find((b) => b.id === activeBasemap) || BASEMAP_OPTIONS[0];
    const baseTileLayer = new TileLayer({
      source: initialBasemap.createSource(),
    });
    baseTileLayerRef.current = baseTileLayer;

    // Plots Layer
    const plotsLayer = new VectorLayer({
      source: plotsSourceRef.current,
      style: (feature) => {
        const plotData = feature.get('plotData');
        if (selectedPlot && plotData && selectedPlot.id === plotData.id) {
          return plotSelectedStyle;
        }
        return plotNormalStyle;
      },
      zIndex: 10,
    });

    // Draw / Search Layer
    const drawLayer = new VectorLayer({
      source: drawSourceRef.current,
      style: (feature) => {
        if (feature.get('isSearchCircle')) {
          return searchRadiusAreaStyle;
        }
        return null;
      },
      zIndex: 20,
    });

    // Popup Overlay
    const popupOverlay = new Overlay({
      element: popupContainerRef.current,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -10],
    });
    popupOverlayRef.current = popupOverlay;

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        baseTileLayer,
        plotsLayer,
        drawLayer,
      ],
      overlays: [popupOverlay],
      view: new View({
        center: defaultCenter,
        zoom: defaultZoom,
        minZoom: 3,
        maxZoom: 21,
      }),
    });

    // Click handler for inspecting plots
    map.on('singleclick', (evt) => {
      // Only inspect plots when in 'view' mode, never during drawing
      if (modeRef.current !== 'view') {
        return;
      }

      const feature = map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
        if (layer === plotsLayer) return feat;
        return null;
      });

      if (feature) {
        const plotData = feature.get('plotData');
        setSelectedPlot(plotData);
        popupOverlay.setPosition(evt.coordinate);
      } else {
        setSelectedPlot(null);
        popupOverlay.setPosition(undefined);
      }
    });

    // Hover cursor handler
    map.on('pointermove', (evt) => {
      if (evt.dragging) return;
      if (modeRef.current !== 'view') {
        mapElementRef.current.style.cursor = 'crosshair';
        return;
      }
      const hit = map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => layer === plotsLayer);
      mapElementRef.current.style.cursor = hit ? 'pointer' : '';
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(null);
      mapInstanceRef.current = null;
    };
  }, []);

  // Update features whenever `plots` changes
  useEffect(() => {
    const source = plotsSourceRef.current;
    source.clear();

    if (!plots || plots.length === 0) return;

    plots.forEach((plot) => {
      try {
        if (plot.geometry && plot.geometry.coordinates) {
          const coords3857 = geoJson4326ToPolygon3857(plot.geometry.coordinates);
          const polygonGeom = new Polygon(coords3857);
          const areaM2 = calculateGeodesicAreaM2(coords3857);

          const feature = new Feature({
            geometry: polygonGeom,
            plotData: {
              ...plot,
              areaM2,
            },
          });
          feature.setId(plot.id);
          source.addFeature(feature);
        }
      } catch (err) {
        console.error('Error loading plot feature:', plot, err);
      }
    });
  }, [plots]);

  // Selected plot position update / highlight
  useEffect(() => {
    if (!selectedPlot) {
      if (popupOverlayRef.current) {
        popupOverlayRef.current.setPosition(undefined);
      }
      return;
    }

    // Find feature to position popup and center if clicked from sidebar
    const feature = plotsSourceRef.current.getFeatureById(selectedPlot.id);
    if (feature && mapInstanceRef.current) {
      const geom = feature.getGeometry();
      const interiorPoint = geom.getInteriorPoint().getCoordinates();
      if (popupOverlayRef.current) {
        popupOverlayRef.current.setPosition(interiorPoint);
      }
      mapInstanceRef.current.getView().animate({
        center: interiorPoint,
        duration: 400,
      });
    }
  }, [selectedPlot]);

  // Reset view handler
  useEffect(() => {
    if (resetViewTrigger && mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: defaultCenter,
        zoom: defaultZoom,
        duration: 500,
      });
    }
  }, [resetViewTrigger]);

  // Synchronize activeFilter search circle on map
  useEffect(() => {
    if (!activeFilter || !mapInstanceRef.current) {
      drawSourceRef.current.clear();
      setLiveRadius(null);
      return;
    }

    drawSourceRef.current.clear();
    setLiveRadius(null);

    try {
      const center3857 = fromLonLat([activeFilter.longitude, activeFilter.latitude]);
      const latRad = (activeFilter.latitude * Math.PI) / 180;
      const radius3857 = activeFilter.radiusMeters / Math.cos(latRad);
      const circleGeom = new CircleGeom(center3857, radius3857);
      const feature = new Feature({
        geometry: circleGeom,
      });
      feature.set('isSearchCircle', true);
      drawSourceRef.current.addFeature(feature);
    } catch (err) {
      console.error('Error drawing activeFilter search circle:', err);
    }
  }, [activeFilter]);

  // Handle Mode changes (view, draw_polygon, draw_circle)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing draw interaction
    if (currentDrawRef.current) {
      map.removeInteraction(currentDrawRef.current);
      currentDrawRef.current = null;
    }

    // Dismiss popup when switching to draw mode
    if (mode !== 'view') {
      setSelectedPlot(null);
      if (popupOverlayRef.current) {
        popupOverlayRef.current.setPosition(undefined);
      }
    }

    // If switching out of polygon draw mode, clear any unsaved draft
    if (mode !== 'draw_polygon' && draftFeatureRef.current) {
      drawSourceRef.current.removeFeature(draftFeatureRef.current);
      draftFeatureRef.current = null;
    }

    if (mode === 'draw_polygon') {
      const draw = new Draw({
        source: drawSourceRef.current,
        type: 'Polygon',
        style: drawPolygonStyle,
      });

      draw.on('drawstart', (evt) => {
        // Clear previous drafts
        if (draftFeatureRef.current) {
          drawSourceRef.current.removeFeature(draftFeatureRef.current);
        }
        draftFeatureRef.current = evt.feature;
      });

      draw.on('drawend', (evt) => {
        const feature = evt.feature;
        const geom = feature.getGeometry();
        const coords3857 = geom.getCoordinates();
        const geoJsonCoords4326 = polygon3857ToGeoJson4326(coords3857);
        const areaM2 = calculateGeodesicAreaM2(coords3857);

        onPolygonCompleted({
          coordinates3857: coords3857,
          geoJsonCoordinates4326: geoJsonCoords4326,
          areaM2,
          feature,
        });
      });

      map.addInteraction(draw);
      currentDrawRef.current = draw;
    } else if (mode === 'draw_circle') {
      // Clear previous search circle
      drawSourceRef.current.clear();

      const draw = new Draw({
        source: drawSourceRef.current,
        type: 'Circle',
        style: drawCircleStyle,
      });

      draw.on('drawstart', (evt) => {
        const geom = evt.feature.getGeometry();

        // Listen for geometry changes during drag to display real-time radius
        geom.on('change', () => {
          try {
            const center3857 = geom.getCenter();
            const radiusMapUnits = geom.getRadius();
            if (center3857 && radiusMapUnits > 0) {
              const edge3857 = [center3857[0] + radiusMapUnits, center3857[1]];
              const radiusMeters = calculateGeodesicRadiusMeters(center3857, edge3857);

              setLiveRadius({
                radiusMeters: Math.round(radiusMeters),
              });
            }
          } catch (err) {
            console.error('Error calculating live radius:', err);
          }
        });
      });

      draw.on('drawend', (evt) => {
        try {
          const feature = evt.feature;
          const geom = feature.getGeometry();
          const center3857 = geom.getCenter();
          const radiusMapUnits = geom.getRadius();
          const edge3857 = [center3857[0] + radiusMapUnits, center3857[1]];
          const radiusMeters = Math.round(calculateGeodesicRadiusMeters(center3857, edge3857));
          const centerLonLat = toLonLat(center3857);

          setLiveRadius(null);

          // If the radius is tiny (< 30m), treat as accidental click and do not wipe the map
          if (isNaN(radiusMeters) || radiusMeters < 30) {
            drawSourceRef.current.clear();
            if (onRadiusTooSmall) {
              onRadiusTooSmall();
            }
            return;
          }

          feature.set('isSearchCircle', true);

          onRadiusSearchCompleted({
            longitude: Number(centerLonLat[0].toFixed(6)),
            latitude: Number(centerLonLat[1].toFixed(6)),
            radiusMeters: radiusMeters,
          });
        } catch (err) {
          console.error('Error completing circle draw:', err);
          setLiveRadius(null);
        }
      });

      map.addInteraction(draw);
      currentDrawRef.current = draw;
    }

    return () => {
      if (currentDrawRef.current && map) {
        map.removeInteraction(currentDrawRef.current);
      }
    };
  }, [mode, onPolygonCompleted, onRadiusSearchCompleted, onRadiusTooSmall]);

  // Change basemap source dynamically
  useEffect(() => {
    if (!baseTileLayerRef.current) return;
    const option = BASEMAP_OPTIONS.find((b) => b.id === activeBasemap);
    if (option) {
      baseTileLayerRef.current.setSource(option.createSource());
    }
  }, [activeBasemap]);

  // Method to remove draft feature if modal is cancelled
  useEffect(() => {
    if (mode === 'view' && draftFeatureRef.current) {
      drawSourceRef.current.removeFeature(draftFeatureRef.current);
      draftFeatureRef.current = null;
    }
  }, [mode]);

  const currentBasemapOption =
    BASEMAP_OPTIONS.find((b) => b.id === activeBasemap) || BASEMAP_OPTIONS[0];

  return (
    <div className="map-wrapper" data-testid="map-wrapper">
      <div ref={mapElementRef} className="map-viewport" id="landmark-map" />

      {/* Floating Basemap Style Switcher */}
      <div className="basemap-switcher" role="region" aria-label="Basemap Style">
        <button
          className="basemap-toggle-btn"
          onClick={() => setIsBasemapMenuOpen((prev) => !prev)}
          title="Change Basemap Style"
          id="basemap-toggle-btn"
        >
          <span className="basemap-icon">{currentBasemapOption.icon}</span>
          <span className="basemap-btn-label">{currentBasemapOption.name}</span>
        </button>

        {isBasemapMenuOpen && (
          <div className="basemap-menu" id="basemap-menu">
            {BASEMAP_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`basemap-option-btn ${activeBasemap === option.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveBasemap(option.id);
                  setIsBasemapMenuOpen(false);
                }}
                id={`basemap-opt-${option.id}`}
              >
                <span className="option-icon">{option.icon}</span>
                <span className="option-name">{option.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live dynamic radius HUD while dragging the search circle */}
      {liveRadius && (
        <div className="live-radius-hud" id="live-radius-hud">
          <div className="hud-pulse" />
          <div className="hud-content">
            <span className="hud-label">Search Radius</span>
            <span className="hud-value">{formatDistance(liveRadius.radiusMeters)}</span>
          </div>
        </div>
      )}

      {/* OpenLayers Popup Overlay rendered via React Portal */}
      {selectedPlot &&
        popupContainerRef.current &&
        createPortal(
          <PlotDetailsPopup
            plot={selectedPlot}
            onClose={() => {
              setSelectedPlot(null);
              if (popupOverlayRef.current) {
                popupOverlayRef.current.setPosition(undefined);
              }
            }}
          />,
          popupContainerRef.current
        )}
    </div>
  );
}
