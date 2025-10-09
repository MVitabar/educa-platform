import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Asegurarse de que la URL base no termine con /api/v1 si NEXT_PUBLIC_API_URL ya lo incluye
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Asegurarse de que la URL base no termine con /
API_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Si la URL base no termina con /api/v1, lo añadimos
if (!API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = `${API_BASE_URL}/api/v1`;
}

// Import the storage utility
import storage from '@/lib/storage';

// Define a type for the API response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// Extend AxiosRequestConfig to include our custom properties
type CustomAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
};

// ApiClient class that wraps axios instance
class ApiClient {
  public axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Client initialized with base URL:', API_BASE_URL);

    // Add interceptor to include authentication token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Skip if we're on the server
        if (typeof window === 'undefined') {
          console.log('Running on server, skipping auth header');
          return config;
        }

        try {
          // Get token from storage
          let token = storage.getToken();
          
          // If no token, try to get it from NextAuth's session
          if (!token && typeof window !== 'undefined') {
            const authData = localStorage.getItem('nextauth.session');
            if (authData) {
              const session = JSON.parse(authData);
              if (session?.accessToken) {
                token = session.accessToken;
                console.log('Retrieved token from NextAuth session');
              }
            }
          }
          
          console.log('Current auth token:', token ? '***' + token.slice(-5) : 'No token found');
          
          if (token) {
            // Create a new config object with updated headers
            const newConfig = { ...config };
            
            // Set the Authorization header
            newConfig.headers = newConfig.headers || {};
            newConfig.headers['Authorization'] = `Bearer ${token}`;
            
            console.log('Added Authorization header to request:', config.url);
            return newConfig;
          } else {
            console.warn('No authentication token found for request:', config.url);
            // Don't throw an error here, let the server handle unauthenticated requests
          }
        } catch (error) {
          console.error('Error in request interceptor:', error);
          // Don't block the request if there's an error getting the token
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle 401 Unauthorized responses
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          if (typeof window !== 'undefined') {
            // Redirect to login or handle unauthorized access
            console.error('Unauthorized access - redirecting to login');
            // You might want to redirect to login page here
            // window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(
    url: string, 
    config?: CustomAxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.get(url, config);
      return response.data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: CustomAxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(
        url,
        data,
        config
      );
      return response.data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: CustomAxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.put(
        url,
        data,
        config
      );
      return response.data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async delete<T>(
    url: string,
    config?: CustomAxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.delete(url, config);
      return response.data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    console.error('API Error:', error);
    
    if (error && typeof error === 'object') {
      const axiosError = error as {
        response?: {
          data?: { 
            message?: string;
            error?: string;
          };
          status?: number;
        };
        request?: unknown;
        message?: string;
      };

      // If we have a response from the server
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        
        // Handle 401 Unauthorized
        if (status === 401) {
          // Clear any existing tokens
          if (typeof window !== 'undefined') {
            storage.removeToken();
            localStorage.removeItem('nextauth.session');
            // Optionally redirect to login
            window.location.href = '/login';
          }
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
        
        // Handle 404 Not Found
        if (status === 404) {
          throw new Error('El recurso solicitado no fue encontrado.');
        }
        
        // Handle other errors with custom message if available
        const errorMessage = data?.message || data?.error || 
          `Error en la solicitud (${status})`;
        throw new Error(errorMessage);
      } 
      // Handle network errors
      else if (axiosError.request) {
        console.error('Network Error:', axiosError.request);
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
      }
    }
    
    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    throw new Error(errorMessage);
  }
}

// Create and export the apiClient instance
const apiClient = new ApiClient();

export default apiClient;
export { apiClient };
