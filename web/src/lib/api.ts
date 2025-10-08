import { getAccessToken } from './auth';

// Ensure the API URL is properly formatted
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Remove trailing slashes and any existing /api/v1
API_BASE_URL = API_BASE_URL.replace(/\/+$/, '').replace(/\/api\/v1$/, '');

console.log('API Base URL:', API_BASE_URL);

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  // Get the current token
  const token = await getAccessToken();
  
  // Remove any leading slashes from the endpoint to prevent double slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  // Construct the full URL
  const fullUrl = `${API_BASE_URL}/api/v1/${cleanEndpoint}`;
  
  console.log('API Request to:', fullUrl);
  console.log('Using token:', token ? 'Token exists' : 'No token');
  
  // If no token is available and this is not a public endpoint
  const isPublicEndpoint = ['/auth/login', '/auth/register', '/auth/refresh-token'].some(publicPath => 
    endpoint.startsWith(publicPath)
  );
  
  if (!token && !isPublicEndpoint) {
    console.log('No authentication token found for protected endpoint. Current URL:', 
      typeof window !== 'undefined' ? window.location.href : 'Server-side');
    
    // Only redirect if we're in the browser
    if (typeof window !== 'undefined') {
      // Don't redirect if we're already on the login page to avoid infinite redirects
      if (!window.location.pathname.startsWith('/login')) {
        // Store the current URL to redirect back after login
        const returnTo = window.location.pathname + window.location.search;
        console.log('Redirecting to login with returnTo:', returnTo);
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
        // Don't throw an error here to prevent console errors during redirect
        return Promise.reject(new Error('Redirecting to login'));
      }
    }
    return Promise.reject(new Error('No authentication token found'));
  }

  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    });

    console.log('=== Request Details ===');
    console.log('URL:', fullUrl);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', JSON.stringify(Object.fromEntries(headers.entries()), null, 2));
    console.log('Token present:', !!token);
    
    const requestOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    if (options.body) {
      console.log('Request body:', options.body);
    }
    
    const response = await fetch(fullUrl, requestOptions);

    console.log('=== Response ===');
    console.log('Status:', response.status, response.statusText);
    console.log('URL:', response.url);
    console.log('Headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));

    // If we get a 401 Unauthorized, try to refresh the token once
    if (response.status === 401 && retry) {
      try {
        // Import the auth module dynamically to avoid circular dependencies
        const authModule = await import('./auth');
        if (authModule && typeof authModule.refreshAccessToken === 'function') {
          await authModule.refreshAccessToken();
          // Retry the request with the new token
          return apiRequest<T>(endpoint, options, false);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        // If refresh fails, clear auth and redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }
    }

    // Parse the response
    let data: ApiResponse<T>;
    try {
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      try {
        data = responseText ? JSON.parse(responseText) : { success: false, message: 'Empty response' };
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || `Request failed with status ${response.status}`;
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          error: errorMessage,
          data: data
        });
        throw new Error(errorMessage);
      }

      return data.data as T;
    } catch (error) {
      console.error('Error processing response:', error);
      throw error;
    }
  } catch (error) {
    console.error('Request failed:', error);
    
    // If it's a network error, throw a more descriptive message
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.');
    }
    
    // Re-throw the error with additional context
    if (error instanceof Error) {
      error.message = `API request failed: ${error.message}`;
    }
    
    throw error;
  }
}
