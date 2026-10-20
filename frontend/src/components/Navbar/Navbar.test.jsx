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

  it('renders guest auth button and handles click', () => {
    const handleOpenAuth = vi.fn();
    render(
      <Navbar
        plotCount={2}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onToggleSidebar={vi.fn()}
        isSidebarOpen={false}
        currentUser={null}
        onOpenAuthModal={handleOpenAuth}
        onLogout={vi.fn()}
      />
    );

    const loginBtn = screen.getByRole('button', { name: /Sign In/i });
    expect(loginBtn).toBeInTheDocument();
    fireEvent.click(loginBtn);
    expect(handleOpenAuth).toHaveBeenCalledTimes(1);
  });

  it('renders user profile and logout button when authenticated', () => {
    const handleLogout = vi.fn();
    const mockUser = {
      id: 'user-1',
      name: 'Maria Silva',
      email: 'maria@landmark.com',
      role: 'ROLE_ADMIN',
    };

    render(
      <Navbar
        plotCount={5}
        activeFilter={null}
        onClearFilter={vi.fn()}
        onToggleSidebar={vi.fn()}
        isSidebarOpen={false}
        currentUser={mockUser}
        onOpenAuthModal={vi.fn()}
        onLogout={handleLogout}
      />
    );

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Sign Out/i });
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('renders my-plots filter badge and triggers onClearOnlyMine', () => {
    const handleClearOnlyMine = vi.fn();
    render(
      <Navbar
        plotCount={2}
        activeFilter={null}
        onClearFilter={vi.fn()}
        filterOnlyMine={true}
        onClearOnlyMine={handleClearOnlyMine}
        onToggleSidebar={vi.fn()}
        isSidebarOpen={false}
        currentUser={{ id: '1', name: 'User' }}
      />
    );

    expect(screen.getByText('My Plots')).toBeInTheDocument();
    const clearBtn = screen.getByTitle('Show all plots');
    fireEvent.click(clearBtn);
    expect(handleClearOnlyMine).toHaveBeenCalledTimes(1);
  });
});
