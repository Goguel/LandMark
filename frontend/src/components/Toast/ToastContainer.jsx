import React from 'react';
import './Toast.css';

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item ${toast.type || 'info'}`}
          id={`toast-${toast.id}`}
        >
          <div className="toast-icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠️'}
            {toast.type === 'info' && 'ℹ'}
          </div>
          <div className="toast-content">
            {toast.title && <strong className="toast-title">{toast.title}</strong>}
            <p className="toast-message">{toast.message}</p>
          </div>
          <button
            className="toast-close-btn"
            onClick={() => onDismiss(toast.id)}
            title="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
