import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');

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

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to include authentication token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Only run this in the browser
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            // Create a new config object with updated headers
            const newConfig = { ...config };
            
            // Set the Authorization header using Axios's header methods
            newConfig.headers = newConfig.headers || {};
            newConfig.headers['Authorization'] = `Bearer ${token}`;
            
            return newConfig;
          }
        }
        return config;
      },
      (error) => {
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
    if (error && typeof error === 'object') {
      const axiosError = error as {
        response?: {
          data?: { message?: string };
          status?: number;
        };
        request?: unknown;
      };

      if (axiosError.response) {
        throw new Error(
          (axiosError.response.data?.message as string) || 
          `Request failed with status ${axiosError.response.status}`
        );
      } else if (axiosError.request) {
        throw new Error('No response received from server');
      }
    }
    
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
}

const apiClient = new ApiClient();

export default apiClient;
export { apiClient };
