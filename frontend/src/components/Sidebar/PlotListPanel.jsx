import React, { useState } from 'react';
import { formatArea, formatCurrency, formatDate } from '../../utils/geoUtils';
import './PlotListPanel.css';

export function PlotListPanel({
  isOpen,
  onClose,
  plots,
  allPlots = [],
  currentUser,
  filterOnlyMine = false,
  onToggleFilterOnlyMine,
  onOpenAuthModal,
  onStartDrawPlot,
  selectedPlot,
  onSelectPlot,
  activeFilter,
  onClearFilter,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const basePlots = allPlots.length > 0 ? allPlots : plots;
  const myPlotsCount = currentUser
    ? basePlots.filter((p) => p.ownerId && p.ownerId === currentUser.id).length
    : 0;

  const filteredPlots = plots.filter((plot) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      plot.title?.toLowerCase().includes(term) ||
      plot.description?.toLowerCase().includes(term) ||
      plot.contactInfo?.toLowerCase().includes(term) ||
      plot.contact?.toLowerCase().includes(term) ||
      plot.ownerName?.toLowerCase().includes(term) ||
      plot.totalPrice?.toString().includes(term)
    );
  });

  return (
    <aside className="plot-list-panel" role="complementary" aria-label="Land Plots Directory">
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Land Plots</h2>
          <span className="panel-subtitle">
            {filterOnlyMine
              ? `My Portfolio: ${plots.length} ${plots.length === 1 ? 'plot' : 'plots'}`
              : activeFilter
              ? `Filtered: ${plots.length} found`
              : `Total: ${plots.length} registered`}
          </span>
        </div>
        <button className="panel-close-btn" onClick={onClose} title="Close panel" id="close-panel-btn">
          ×
        </button>
      </div>

      {/* Scope Filter Tabs: All Plots vs My Plots */}
      <div className="panel-scope-tabs" role="tablist" aria-label="Plots Scope Filter">
        <button
          type="button"
          role="tab"
          aria-selected={!filterOnlyMine}
          className={`scope-tab ${!filterOnlyMine ? 'active' : ''}`}
          onClick={() => onToggleFilterOnlyMine && onToggleFilterOnlyMine(false)}
          id="tab-all-plots"
        >
          <span>🌐 All Plots</span>
          <span className="tab-count">{basePlots.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterOnlyMine}
          className={`scope-tab ${filterOnlyMine ? 'active' : ''}`}
          onClick={() => {
            if (!currentUser) {
              if (onOpenAuthModal) onOpenAuthModal();
            } else if (onToggleFilterOnlyMine) {
              onToggleFilterOnlyMine(true);
            }
          }}
          id="tab-my-plots"
          title={currentUser ? 'Show only your plots' : 'Sign in to view your plots'}
        >
          <span>👤 My Plots</span>
          {currentUser ? (
            <span className="tab-count">{myPlotsCount}</span>
          ) : (
            <span className="tab-lock-icon" title="Sign in required">🔒</span>
          )}
        </button>
      </div>

      {activeFilter && (
        <div className="panel-filter-bar">
          <div className="filter-info">
            <span className="filter-badge">⭕ Radius Active</span>
            <span className="filter-radius">Within {activeFilter.radiusMeters}m</span>
          </div>
          <button className="btn-clear-inline" onClick={onClearFilter} id="panel-clear-filter-btn">
            Clear
          </button>
        </div>
      )}

      <div className="panel-search-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by description, contact, price..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="panel-search-input"
          id="panel-search-plots"
        />
        {searchTerm && (
          <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Clear search">
            ×
          </button>
        )}
      </div>

      <div className="panel-plots-list">
        {filteredPlots.length === 0 ? (
          <div className="empty-plots-state">
            <div className="empty-icon">{filterOnlyMine ? '📂' : '🏞️'}</div>
            <h3 className="empty-title">
              {searchTerm
                ? 'No Plots Found'
                : filterOnlyMine
                ? 'No Plots in Your Portfolio'
                : 'No Plots Found'}
            </h3>
            <p className="empty-desc">
              {searchTerm
                ? 'No plots match your search criteria.'
                : filterOnlyMine
                ? "You haven't registered any land plots under this account yet. Use the 'Draw Plot' tool on the map to register your first parcel!"
                : activeFilter
                ? 'No plots found within this radius area.'
                : 'No land plots registered yet. Use the "Draw Plot" tool on the map to register your first plot!'}
            </p>
            {filterOnlyMine && onStartDrawPlot && (
              <button
                type="button"
                className="btn-draw-first-plot"
                onClick={onStartDrawPlot}
                id="panel-draw-first-plot-btn"
              >
                ✏️ Draw Your First Plot
              </button>
            )}
          </div>
        ) : (
          filteredPlots.map((plot) => (
            <div
              key={plot.id}
              className={`plot-card ${selectedPlot?.id === plot.id ? 'selected' : ''}`}
              onClick={() => onSelectPlot(plot)}
              id={`plot-card-${plot.id}`}
            >
              <div className="plot-card-header">
                <span className="plot-card-price">{formatCurrency(plot.totalPrice)}</span>
                <div className="plot-card-badges">
                  {currentUser && plot.ownerId === currentUser.id && (
                    <span className="my-plot-tag" title="You registered this plot">★ My Plot</span>
                  )}
                  {(plot.areaSquareMeters || plot.areaM2) && (
                    <span className="plot-card-area">{formatArea(plot.areaSquareMeters || plot.areaM2)}</span>
                  )}
                </div>
              </div>

              {plot.title && <h4 className="plot-card-title">{plot.title}</h4>}
              <p className="plot-card-description">{plot.description}</p>

              <div className="plot-card-footer">
                <span className="plot-card-contact">{plot.contact || plot.contactInfo}</span>
                {plot.ownerName && (
                  <span className="plot-card-owner">
                    👤 {currentUser && plot.ownerId === currentUser.id ? 'You' : plot.ownerName}
                  </span>
                )}
                {plot.createdAt && <span className="plot-card-date">{formatDate(plot.createdAt)}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
