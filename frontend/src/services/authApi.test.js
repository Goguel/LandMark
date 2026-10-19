import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  login,
  register,
  fetchCurrentUser,
  saveSession,
  clearSession,
  getStoredToken,
  getStoredUser,
  AuthError,
} from './authApi';

describe('authApi service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('manages session storage correctly', () => {
    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();

    const mockUser = { id: 'u1', name: 'User One', email: 'u1@test.com', role: 'ROLE_USER' };
    saveSession('test-token-123', mockUser);

    expect(getStoredToken()).toBe('test-token-123');
    expect(getStoredUser()).toEqual(mockUser);

    clearSession();
    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('handles corrupt JSON in localStorage gracefully', () => {
    localStorage.setItem('landmark_user', 'invalid-json{');
    expect(getStoredUser()).toBeNull();
  });

  it('logs in successfully and saves session', async () => {
    const mockResponse = {
      token: 'jwt-abc-123',
      type: 'Bearer',
      user: {
        id: 'u-1',
        name: 'Maria',
        email: 'maria@test.com',
        role: 'ROLE_USER',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await login('maria@test.com', 'secret123');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: 'maria@test.com', password: 'secret123' }),
      })
    );
    expect(result).toEqual(mockResponse);
    expect(getStoredToken()).toBe('jwt-abc-123');
    expect(getStoredUser()).toEqual(mockResponse.user);
  });

  it('throws AuthError on login failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Credenciais inválidas' }),
    });

    await expect(login('maria@test.com', 'wrong')).rejects.toThrow('Credenciais inválidas');
  });

  it('registers successfully and saves session', async () => {
    const mockResponse = {
      token: 'jwt-reg-456',
      type: 'Bearer',
      user: {
        id: 'u-2',
        name: 'Carlos',
        email: 'carlos@test.com',
        role: 'ROLE_USER',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await register('Carlos', 'carlos@test.com', 'secret123');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: 'Carlos', email: 'carlos@test.com', password: 'secret123' }),
      })
    );
    expect(result).toEqual(mockResponse);
    expect(getStoredToken()).toBe('jwt-reg-456');
    expect(getStoredUser()).toEqual(mockResponse.user);
  });

  it('throws AuthError with field errors on registration validation failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        message: 'Validation failed',
        validationErrors: { email: 'Invalid email address' },
      }),
    });

    try {
      await register('Carlos', 'bad-email', '123');
      expect.fail('Should have thrown AuthError');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect(err.status).toBe(400);
      expect(err.errors).toEqual({ email: 'Invalid email address' });
    }
  });

  it('fetches current user when token exists', async () => {
    localStorage.setItem('landmark_token', 'my-token');
    const mockUser = { id: 'u-1', name: 'Maria', email: 'maria@test.com', role: 'ROLE_USER' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    const result = await fetchCurrentUser();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      })
    );
    expect(result).toEqual(mockUser);
    expect(getStoredUser()).toEqual(mockUser);
  });

  it('returns null from fetchCurrentUser if no token stored', async () => {
    const result = await fetchCurrentUser();
    expect(result).toBeNull();
  });
});
