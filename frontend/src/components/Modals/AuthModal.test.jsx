import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from './AuthModal';
import * as authApi from '../../services/authApi';

describe('AuthModal Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Ana Silva',
    email: 'ana@landmark.com',
    role: 'ROLE_USER',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AuthModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders login tab by default and switches between tabs', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();

    // In login mode, name input is not present
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

    // Switch to register tab
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
  });

  it('submits login successfully', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      token: 'jwt-token',
      user: mockUser,
    });
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(<AuthModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'ana@landmark.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In to Account' }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('ana@landmark.com', 'password123');
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ user: mockUser }));
    });
  });

  it('displays error message when login fails', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(new Error('Invalid credentials'));

    render(<AuthModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'ana@landmark.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In to Account' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('validates password length on registration tab', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    // Switch to register
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'ana@landmark.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register & Sign In' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/6 characters/i);
    });
  });

  it('registers new user successfully', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({
      token: 'jwt-token-new',
      user: mockUser,
    });
    const onSuccess = vi.fn();

    render(<AuthModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />);

    // Switch to register tab
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Ana Silva' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'ana@landmark.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'secret123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register & Sign In' }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith('Ana Silva', 'ana@landmark.com', 'secret123');
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ user: mockUser }));
    });
  });

  it('calls onClose when close button or cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={onClose} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByLabelText(/Close auth modal/i));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
