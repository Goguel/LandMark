import React from 'react';
import { formatArea, formatCurrency, formatDate } from '../../utils/geoUtils';
import './PlotDetailsPopup.css';

export function PlotDetailsPopup({ plot, onClose }) {
  if (!plot) return null;

  return (
    <div className="plot-popup-card" id={`plot-popup-${plot.id}`}>
      <div className="popup-header">
        <span className="popup-badge">Land Plot</span>
        <button
          className="popup-close-btn"
          onClick={onClose}
          title="Close details"
          id="close-popup-btn"
        >
          ×
        </button>
      </div>

      <div className="popup-price-row">
        <span className="popup-price" id="popup-plot-price">
          {formatCurrency(plot.totalPrice)}
        </span>
        {plot.areaM2 && (
          <span className="popup-area-pill" id="popup-plot-area">
            {formatArea(plot.areaM2)}
          </span>
        )}
      </div>

      <div className="popup-divider" />

      <div className="popup-body">
        <div className="popup-field">
          <span className="field-label">Description</span>
          <p className="field-text" id="popup-plot-description">{plot.description}</p>
        </div>

        <div className="popup-field">
          <span className="field-label">Contact</span>
          <p className="field-contact" id="popup-plot-contact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{plot.contact || plot.contactInfo}</span>
          </p>
        </div>

        {plot.createdAt && (
          <div className="popup-field footer-field">
            <span className="field-label">Listed on</span>
            <span className="field-date" id="popup-plot-date">{formatDate(plot.createdAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
