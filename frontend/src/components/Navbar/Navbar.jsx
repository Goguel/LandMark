import React from 'react';
import './Navbar.css';

export function Navbar({ plotCount, activeFilter, onClearFilter, onToggleSidebar, isSidebarOpen }) {
  return (
    <header className="navbar" role="banner">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </div>
        <div className="navbar-title-container">
          <h1 className="navbar-title">LandMark</h1>
          <span className="navbar-subtitle">Spatial Real Estate GIS</span>
        </div>
      </div>

      <div className="navbar-stats">
        <div className="stat-pill" title="Total plots currently visible">
          <span className="stat-dot"></span>
          <span className="stat-label">Plots:</span>
          <span className="stat-value" id="plot-counter">{plotCount}</span>
        </div>

        {activeFilter && (
          <div className="filter-pill" id="active-filter-badge">
            <span className="filter-icon">⭕</span>
            <span className="filter-text">
              Radius: {activeFilter.radiusMeters}m
            </span>
            <button
              className="clear-filter-btn"
              onClick={onClearFilter}
              title="Clear radius filter and show all plots"
              id="clear-radius-filter-btn"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="navbar-actions">
        <button
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Close plots panel' : 'Open plots panel'}
          id="toggle-plots-panel-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span className="btn-label">Plots List</span>
        </button>
      </div>
    </header>
  );
}
