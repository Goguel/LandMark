import React, { useState, useEffect } from 'react';
import { formatArea, formatCurrency } from '../../utils/geoUtils';
import './PlotCreationModal.css';

export function PlotCreationModal({ isOpen, onClose, onSubmit, areaM2, isSubmitting, error }) {
  const [totalPrice, setTotalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [validationError, setValidationError] = useState('');

  // Reset form fields whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setTotalPrice('');
      setDescription('');
      setContactInfo('');
      setValidationError('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setTotalPrice('');
    setDescription('');
    setContactInfo('');
    setValidationError('');
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const parsedPrice = parseFloat(totalPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setValidationError('Please enter a valid total price greater than 0.');
      return;
    }

    if (!description.trim()) {
      setValidationError('Please enter a description for the land plot.');
      return;
    }

    if (!contactInfo.trim()) {
      setValidationError('Please provide contact information (e.g., email or phone).');
      return;
    }

    onSubmit({
      totalPrice: parsedPrice,
      description: description.trim(),
      contactInfo: contactInfo.trim(),
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 id="modal-title" className="modal-title">Register New Land Plot</h2>
            <p className="modal-subtitle">Review spatial boundary and fill plot details</p>
          </div>
          <button className="modal-close-btn" onClick={handleClose} disabled={isSubmitting} id="modal-cancel-x-btn">
            ×
          </button>
        </div>

        {/* Spatial Area Summary Card */}
        <div className="modal-area-badge">
          <div className="area-info">
            <span className="area-label">Calculated Plot Area</span>
            <span className="area-value" id="modal-calculated-area">{formatArea(areaM2)}</span>
          </div>
          <div className="area-icon">📐</div>
        </div>

        {/* Error / Conflict Alert */}
        {(validationError || error) && (
          <div className={`modal-alert ${error?.isConflict ? 'conflict-alert' : 'error-alert'}`} id="modal-error-alert">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>{error?.isConflict ? 'Spatial Overlap Rejected' : 'Validation Error'}</strong>
              <p>{error?.message || validationError}</p>
              {error?.details && <small className="alert-details">{error.details}</small>}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="plot-price" className="form-label">
              Total Price (R$) <span className="required">*</span>
            </label>
            <div className="price-input-wrapper">
              <span className="currency-prefix">R$</span>
              <input
                id="plot-price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="150000.00"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="plot-description" className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="plot-description"
              rows="3"
              placeholder="e.g., Flat residential plot with water and electricity connections available."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="plot-contact" className="form-label">
              Contact Information <span className="required">*</span>
            </label>
            <input
              id="plot-contact"
              type="text"
              placeholder="e.g., contact@landmark.com or +1 (555) 234-5678"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
              id="modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
              id="modal-submit-plot-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  <span>Validating & Saving...</span>
                </>
              ) : (
                'Register Plot'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
