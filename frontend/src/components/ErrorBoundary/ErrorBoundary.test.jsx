import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function ProblemChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test crash in child component');
  }
  return <div>Safe child content</div>;
}

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe child content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws an error and allows reload', () => {
    // Suppress console.error in vitest output for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location.reload
    const reloadMock = vi.fn();
    delete window.location;
    window.location = { reload: reloadMock };

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

    const reloadBtn = screen.getByText('Reload Application');
    fireEvent.click(reloadBtn);
    expect(reloadMock).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
