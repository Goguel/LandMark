import React, { useState } from 'react';
import { formatArea, formatCurrency, formatDate } from '../../utils/geoUtils';
import './PlotListPanel.css';

export function PlotListPanel({ isOpen, onClose, plots, selectedPlot, onSelectPlot, activeFilter, onClearFilter }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredPlots = plots.filter((plot) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      plot.description?.toLowerCase().includes(term) ||
      plot.contactInfo?.toLowerCase().includes(term) ||
      plot.totalPrice?.toString().includes(term)
    );
  });

  return (
    <aside className="plot-list-panel" role="complementary" aria-label="Land Plots Directory">
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Land Plots</h2>
          <span className="panel-subtitle">
            {activeFilter ? `Filtered: ${plots.length} found` : `Total: ${plots.length} registered`}
          </span>
        </div>
        <button className="panel-close-btn" onClick={onClose} title="Close panel" id="close-panel-btn">
          ×
        </button>
      </div>

      {activeFilter && (
        <div className="panel-filter-bar">
          <div className="filter-info">
            <span className="filter-badge">⭕ Filter Active</span>
            <span className="filter-radius">Within {activeFilter.radiusMeters}m</span>
          </div>
          <button className="btn-clear-inline" onClick={onClearFilter} id="panel-clear-filter-btn">
            Clear Filter
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
            <div className="empty-icon">🏞️</div>
            <h3 className="empty-title">No Plots Found</h3>
            <p className="empty-desc">
              {searchTerm
                ? 'No plots match your search criteria.'
                : activeFilter
                ? 'No plots found within this radius area.'
                : 'No land plots registered yet. Use the "Draw Plot" tool on the map to register your first plot!'}
            </p>
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
                {(plot.areaSquareMeters || plot.areaM2) && (
                  <span className="plot-card-area">{formatArea(plot.areaSquareMeters || plot.areaM2)}</span>
                )}
              </div>

              <p className="plot-card-description">{plot.description}</p>

              <div className="plot-card-footer">
                <span className="plot-card-contact">{plot.contact || plot.contactInfo}</span>
                {plot.ownerName && <span className="plot-card-owner">👤 {plot.ownerName}</span>}
                {plot.createdAt && <span className="plot-card-date">{formatDate(plot.createdAt)}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
