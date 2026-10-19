import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { MapToolbar } from './components/Toolbar/MapToolbar';
import { MapContainer } from './components/Map/MapContainer';
import { PlotCreationModal } from './components/Modals/PlotCreationModal';
import { PlotListPanel } from './components/Sidebar/PlotListPanel';
import { ToastContainer } from './components/Toast/ToastContainer';
import { fetchAllPlots, searchPlotsByRadius, registerPlot } from './services/plotApi';
import { formatCurrency } from './utils/geoUtils';
import './App.css';

export function App() {
  const [plots, setPlots] = useState([]);
  const [allPlots, setAllPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [mode, setMode] = useState('view'); // 'view' | 'draw_polygon' | 'draw_circle'
  const [activeFilter, setActiveFilter] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);

  // Plot Creation Modal states
  const [draftPolygon, setDraftPolygon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all plots on mount
  const loadPlots = useCallback(async () => {
    try {
      const data = await fetchAllPlots();
      setPlots(data || []);
      setAllPlots(data || []);
    } catch (err) {
      console.error('Failed to load plots:', err);
      addToast('error', 'Could not connect to backend service. Please check API.', 'Connection Error');
    }
  }, [addToast]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  // Handle polygon drawing completion
  const handlePolygonCompleted = useCallback((drawnData) => {
    setDraftPolygon(drawnData);
    setIsModalOpen(true);
    setSubmitError(null);
    setMode('view'); // Exit drawing mode so user can interact with modal
  }, []);

  // Handle modal close / cancellation
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setDraftPolygon(null);
    setSubmitError(null);
  }, []);

  // Handle plot registration form submission
  const handleRegisterPlotSubmit = useCallback(async (formData) => {
    if (!draftPolygon) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: `Plot #${Math.floor(Math.random() * 9000 + 1000)}`,
      totalPrice: formData.totalPrice,
      description: formData.description,
      contact: formData.contactInfo,
      geometry: {
        type: 'Polygon',
        coordinates: draftPolygon.geoJsonCoordinates4326,
      },
    };

    try {
      const createdPlot = await registerPlot(payload);
      setIsSubmitting(false);
      setIsModalOpen(false);
      setDraftPolygon(null);

      addToast('success', `Plot registered for ${formatCurrency(createdPlot.totalPrice)}!`, 'Registration Successful');

      // Reload plots and select newly created plot
      await loadPlots();
      setSelectedPlot(createdPlot);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err);

      if (err.isConflict) {
        addToast(
          'error',
          'Spatial Overlap Rejected: Your polygon intersects with an existing plot.',
          'Boundary Conflict'
        );
      } else {
        addToast('error', err.message || 'Failed to register plot.', 'Error');
      }
    }
  }, [draftPolygon, loadPlots, addToast]);

  // Handle radius search completion
  const handleRadiusSearchCompleted = useCallback(async ({ latitude, longitude, radiusMeters }) => {
    try {
      setActiveFilter({ latitude, longitude, radiusMeters });
      const results = await searchPlotsByRadius(latitude, longitude, radiusMeters);
      setPlots(results || []);
      setMode('view');

      if (results && results.length > 0) {
        addToast(
          'info',
          `Found ${results.length} plot(s) within ${radiusMeters}m radius.`,
          'Search Complete'
        );
        setIsSidebarOpen(true);
      } else {
        addToast(
          'info',
          `No plots found within ${radiusMeters}m. Click 'Clear Filter' in the toolbar to see all plots.`,
          'Search Complete'
        );
      }
    } catch (err) {
      console.error('Radius search failed:', err);
      addToast('error', 'Failed to perform radius search.', 'Search Error');
    }
  }, [addToast]);

  // Handle accidental small click without dragging
  const handleRadiusTooSmall = useCallback(() => {
    addToast(
      'warning',
      'Please expand a search radius of at least 50m. Click center, move mouse to adjust radius, and click again.',
      'Radius Too Small'
    );
  }, [addToast]);

  // Handle clearing filter
  const handleClearFilter = useCallback(() => {
    setActiveFilter(null);
    setPlots(allPlots);
    addToast('info', 'Filter cleared. Showing all registered plots.', 'Reset');
  }, [allPlots, addToast]);

  // Reset map view
  const handleResetView = useCallback(() => {
    setResetViewTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="app-container">
      <Navbar
        plotCount={plots.length}
        activeFilter={activeFilter}
        onClearFilter={handleClearFilter}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <main className="map-main">
        <MapToolbar
          mode={mode}
          setMode={setMode}
          activeFilter={activeFilter}
          onClearFilter={handleClearFilter}
          onResetView={handleResetView}
        />

        <MapContainer
          plots={plots}
          mode={mode}
          setMode={setMode}
          selectedPlot={selectedPlot}
          setSelectedPlot={setSelectedPlot}
          activeFilter={activeFilter}
          onPolygonCompleted={handlePolygonCompleted}
          onRadiusSearchCompleted={handleRadiusSearchCompleted}
          onRadiusTooSmall={handleRadiusTooSmall}
          resetViewTrigger={resetViewTrigger}
        />

        <PlotListPanel
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          plots={plots}
          selectedPlot={selectedPlot}
          onSelectPlot={(plot) => setSelectedPlot(plot)}
          activeFilter={activeFilter}
          onClearFilter={handleClearFilter}
        />
      </main>

      <PlotCreationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleRegisterPlotSubmit}
        areaM2={draftPolygon?.areaM2 || 0}
        isSubmitting={isSubmitting}
        error={submitError}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
