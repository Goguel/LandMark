import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#0a0e17',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '24px',
            textAlign: 'center',
          }}
          data-testid="error-boundary-fallback"
        >
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              maxWidth: '480px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: '#f43f5e' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              The application encountered an unexpected display issue. Your saved plots and data are safe.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
