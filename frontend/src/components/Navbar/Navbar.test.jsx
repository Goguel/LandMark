import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';

describe('Navbar Component', () => {
  it('renders branding title and plot count', () => {
    render(
      <Navbar
        plotCount={7}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onToggleSidebar={vi.fn()}
        isSidebarOpen={false}
      />
    );

    expect(screen.getByText('LandMark')).toBeInTheDocument();
    expect(screen.getByText('Spatial Real Estate GIS')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders active filter badge and handles clear filter click', () => {
    const handleClearFilter = vi.fn();
    render(
      <Navbar
        plotCount={3}
        activeFilter={{ radiusMeters: 450 }}
        onClearFilter={handleClearFilter}
        onToggleSidebar={vi.fn()}
        isSidebarOpen={false}
      />
    );

    expect(screen.getByText('Radius: 450m')).toBeInTheDocument();
    const clearBtn = screen.getByTitle('Clear radius filter and show all plots');
    fireEvent.click(clearBtn);
    expect(handleClearFilter).toHaveBeenCalledTimes(1);
  });

  it('handles sidebar toggle button click', () => {
    const handleToggle = vi.fn();
    render(
      <Navbar
        plotCount={5}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onToggleSidebar={handleToggle}
        isSidebarOpen={true}
      />
    );

    const toggleBtn = screen.getByTitle('Close plots panel');
    expect(toggleBtn).toHaveClass('active');
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
