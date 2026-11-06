// JWT Token Management and Authenticated Fetch Helper

const TOKEN_KEY = 'synapse_jwt_token';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

// Authenticated fetch wrapper that automatically appends the Bearer token
export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If token is invalid or expired, clear it
  if (response.status === 401 && token) {
    removeAuthToken();
  }

  return response;
};
