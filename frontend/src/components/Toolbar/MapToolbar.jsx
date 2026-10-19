import React from 'react';
import './MapToolbar.css';

export function MapToolbar({ mode, setMode, activeFilter, onClearFilter, onResetView }) {
  return (
    <div className="map-toolbar-container" role="toolbar" aria-label="Map Tools">
      <div className="map-toolbar">
        <button
          className={`toolbar-btn ${mode === 'view' ? 'active' : ''}`}
          onClick={() => setMode('view')}
          title="Browse & Inspect Plots"
          id="tool-browse-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toolbar-icon">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="M13 13l6 6" />
          </svg>
          <span className="toolbar-btn-text">Inspect</span>
        </button>

        <button
          className={`toolbar-btn ${mode === 'draw_polygon' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'draw_polygon' ? 'view' : 'draw_polygon')}
          title="Draw Polygon to Register Plot"
          id="tool-draw-plot-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toolbar-icon">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
          </svg>
          <span className="toolbar-btn-text">Draw Plot</span>
        </button>

        <button
          className={`toolbar-btn ${mode === 'draw_circle' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'draw_circle' ? 'view' : 'draw_circle')}
          title="Draw Circle for Radius Search"
          id="tool-radius-search-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toolbar-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="12" x2="19" y2="12" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          <span className="toolbar-btn-text">Radius Search</span>
        </button>

        <div className="toolbar-divider" />

        {activeFilter && (
          <button
            className="toolbar-btn clear-btn"
            onClick={onClearFilter}
            title="Clear active radius filter"
            id="tool-clear-filter-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toolbar-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span className="toolbar-btn-text">Reset Filter</span>
          </button>
        )}

        <button
          className="toolbar-btn icon-only"
          onClick={onResetView}
          title="Reset Map View"
          id="tool-reset-view-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toolbar-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
        </button>
      </div>

      {mode === 'draw_polygon' && (
        <div className="mode-instruction-badge" id="polygon-instructions">
          <span className="instruction-icon">✏️</span>
          <span>Click on the map to place vertices. <strong>Double-click</strong> or click the first point to complete the plot.</span>
        </div>
      )}

      {mode === 'draw_circle' && (
        <div className="mode-instruction-badge amber" id="circle-instructions">
          <span className="instruction-icon">⭕</span>
          <span>Click center point, <strong>move mouse</strong> to expand radius (or drag), then <strong>click again</strong> to search.</span>
        </div>
      )}
    </div>
  );
}
