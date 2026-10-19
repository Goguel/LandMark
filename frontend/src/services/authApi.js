/**
 * Authentication service for LandMark platform.
 * Handles JWT token storage, login, user registration, and session state.
 */

const AUTH_BASE_URL = '/api/auth';
const TOKEN_KEY = 'landmark_token';
const USER_KEY = 'landmark_user';

export class AuthError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.errors = errors;
    this.isUnauthorized = status === 401;
    this.isConflict = status === 409;
  }
}

async function handleAuthResponse(response) {
  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response
    }
    const message = errorData?.message || `Authentication failed with status ${response.status}`;
    const errors = errorData?.validationErrors || errorData?.errors || null;
    throw new AuthError(response.status, message, errors);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(tokenOrAuthData, maybeUser) {
  if (!tokenOrAuthData) return;
  try {
    let token = null;
    let user = null;

    if (typeof tokenOrAuthData === 'string') {
      token = tokenOrAuthData;
      user = maybeUser || null;
    } else {
      token = tokenOrAuthData.token;
      if (tokenOrAuthData.user) {
        user = tokenOrAuthData.user;
      } else {
        user = {
          id: tokenOrAuthData.id,
          name: tokenOrAuthData.name,
          email: tokenOrAuthData.email,
          role: tokenOrAuthData.role,
        };
      }
    }

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Failed to clear session from localStorage', e);
  }
}

/**
 * Authenticates user credentials with backend.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} AuthResponseDTO
 */
export async function login(email, password) {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const authData = await handleAuthResponse(response);
  saveSession(authData);
  return authData;
}

/**
 * Registers a new user account.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} AuthResponseDTO
 */
export async function register(name, email, password) {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const authData = await handleAuthResponse(response);
  saveSession(authData);
  return authData;
}

/**
 * Fetches the currently authenticated user's profile from /api/auth/me.
 * @returns {Promise<Object|null>}
 */
export async function fetchCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${AUTH_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      clearSession();
      return null;
    }

    const user = await handleAuthResponse(response);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}
