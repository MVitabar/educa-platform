import { signOut } from 'next-auth/react';

// Tipos para la sesión de usuario
export type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

export type Session = {
  user: User;
  accessToken: string;
  refreshToken: string;
  expires: string;
};

// Almacenamiento en memoria para el token
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiry: number | null = null;

// Configuración de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Establece los tokens de autenticación
 */
export function setAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  tokenExpiry = Date.now() + tokens.expiresIn * 1000;

  if (typeof window !== 'undefined') {
    try {
      // Store in the expected format
      const authData = {
        accessToken,
        refreshToken,
        expiresAt: tokenExpiry
      };
      
      localStorage.setItem('auth', JSON.stringify(authData));
      
      // Also store the token in the simple format for backward compatibility
      localStorage.setItem('token', accessToken);
      
      console.log('Auth tokens stored in localStorage');
    } catch (error) {
      console.warn('No se pudo guardar la sesión en localStorage', error);
    }
  }
}
/**
 * Obtiene el token de acceso, refrescándolo si es necesario
 */
export async function getAccessToken(): Promise<string | null> {
  console.log('=== getAccessToken() called ===');
  
  // Check if we already have the token in memory
  if (accessToken) {
    console.log('Using in-memory access token');
    // Verify token is not expired
    if (tokenExpiry && tokenExpiry > Date.now()) {
      console.log('Token is valid, expires at:', new Date(tokenExpiry).toISOString());
      return accessToken;
    }
    console.log('Token expired or no expiry, checking localStorage...');
  }

  // If no token in memory or it's expired, try to load from storage
  if (typeof window === 'undefined') {
    console.log('Running on server side, no access to localStorage');
    return null;
  }

  console.log('Checking localStorage for tokens...');
  
  try {
    // 1. First check for the simple token format
    const simpleToken = localStorage.getItem('token');
    if (simpleToken) {
      console.log('Found simple token in localStorage');
      accessToken = simpleToken;
      // Set a default expiry (1 hour from now) since we don't have this info
      tokenExpiry = Date.now() + 3600 * 1000;
      // Store in the expected format for future use
      setAuthTokens({
        accessToken: simpleToken,
        refreshToken: localStorage.getItem('refreshToken') || '',
        expiresIn: 3600 // 1 hour
      });
      console.log('Converted simple token to auth format');
      return accessToken;
    }
  
    // 2. Check for the full auth object format
    const storedAuth = localStorage.getItem('auth');
    console.log('Stored auth in localStorage:', storedAuth ? 'exists' : 'not found');
    
    if (storedAuth) {
      try {
        console.log('Parsing stored auth data...');
        const { accessToken: storedToken, refreshToken: storedRefresh, expiresAt } = JSON.parse(storedAuth);
        
        if (!storedToken) {
          console.error('No access token found in stored auth data');
          localStorage.removeItem('auth');
          return null;
        }
        
        accessToken = storedToken;
        refreshToken = storedRefresh;
        tokenExpiry = expiresAt;
        
        console.log('Successfully loaded tokens from localStorage');
        console.log('Token expires at:', new Date(expiresAt).toISOString());
        
        // Verify token is not expired
        if (expiresAt && expiresAt < Date.now()) {
          console.log('Stored token has expired');
          // Try to refresh the token if we have a refresh token
          if (storedRefresh) {
            console.log('Attempting to refresh token...');
            try {
              await refreshAccessToken();
              return accessToken;
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
              clearAuth();
              return null;
            }
          }
          clearAuth();
          return null;
        }
        
        return accessToken;
      } catch (parseError) {
        console.error('Error parsing stored auth data:', parseError);
        // Clear invalid stored data
        clearAuth();
      }
    }
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
    return null;
  }

  // If we have a token at this point, check if it needs refreshing
  if (accessToken && tokenExpiry !== null) {
    const expiryDate = new Date(tokenExpiry);
    console.log('Current token expiry:', expiryDate.toISOString());
    
    // If token is about to expire (within 5 minutes) or already expired, try to refresh it
    if (Date.now() > tokenExpiry - 5 * 60 * 1000) {
      console.log('Token needs refresh or is expired, attempting to refresh...');
      try {
        await refreshAccessToken();
        console.log('Token refreshed successfully');
        return accessToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        // If we can't refresh, clear the session
        clearAuth();
        await signOut({ redirect: false });
        return null;
      }
    }
    
    console.log('Returning valid access token');
    return accessToken;
  }

  // If we reach here, no valid token was found
  console.log('No valid access token found in any storage location');
  return null;
}

/**
 * Refresca el token de acceso
 */
export async function refreshAccessToken(): Promise<void> {
  console.log('Refreshing access token...');
  
  if (!refreshToken) {
    console.error('No refresh token available for refresh');
    throw new Error('No hay token de refresco disponible');
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Error al refrescar el token');
    }

    const data = await response.json();
    setAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn || 3600, // Valor por defecto de 1 hora
    });
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    throw error;
  }
}

/**
 * Limpia los tokens de autenticación
 */
export function clearAuth(): void {
  accessToken = null;
  refreshToken = null;
  tokenExpiry = null;
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('auth');
    } catch (error) {
      console.warn('Error al limpiar la sesión', error);
    }
  }
}

/**
 * Función para obtener la sesión del usuario
 */
export async function getSession(): Promise<Session | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuth();
      }
      return null;
    }

    const user = await response.json();
    return {
      user,
      accessToken: token,
      refreshToken: refreshToken || '',
      expires: new Date(tokenExpiry || Date.now() + 3600 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
    return null;
  }
}

/**
 * Función para iniciar sesión
 */
export async function signIn(credentials: { email: string; password: string }): Promise<Session> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al iniciar sesión');
  }

  const data = await response.json();
  
  // Almacenar los tokens
  setAuthTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn || 3600,
  });

  return {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expires: new Date(Date.now() + (data.expiresIn || 3600) * 1000).toISOString(),
  };
}

/**
 * Función para cerrar sesión
 */
export async function logout(): Promise<void> {
  try {
    // Intentar hacer logout en el servidor
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.warn('Error al cerrar sesión en el servidor:', error);
  } finally {
    // Limpiar la sesión local en cualquier caso
    clearAuth();
  }
}

export { signOut } from 'next-auth/react';
