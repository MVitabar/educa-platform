/**
 * A wrapper around localStorage that handles server-side rendering
 * and provides type-safe methods for storing and retrieving data.
 * This is synchronized with NextAuth's session.
 */

const TOKEN_KEY = 'auth_token';

const storage = {
  // Get token from localStorage
  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      // First try to get from NextAuth's session
      const authData = localStorage.getItem('nextauth.session');
      if (authData) {
        const session = JSON.parse(authData);
        if (session?.accessToken) {
          return session.accessToken;
        }
      }
      
      // Fallback to our own storage
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token from storage:', error);
      return null;
    }
  },

  // Set token in localStorage
  setToken(token: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Store in both places for compatibility
      localStorage.setItem(TOKEN_KEY, token);
      
      // Also update NextAuth's session if it exists
      const authData = localStorage.getItem('nextauth.session');
      if (authData) {
        const session = JSON.parse(authData);
        session.accessToken = token;
        localStorage.setItem('nextauth.session', JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error setting auth token in storage:', error);
    }
  },

  // Remove token from localStorage
  removeToken(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.removeItem(TOKEN_KEY);
      
      // Also clear NextAuth's session
      localStorage.removeItem('nextauth.session');
    } catch (error) {
      console.error('Error removing auth token from storage:', error);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

export default storage;
