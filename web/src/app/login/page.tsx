'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { setAuthTokens } from '@/lib/auth';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  console.log('=== Iniciando proceso de login ===');
  console.log('Email ingresado:', formData.email);

  if (!formData.email || !formData.password) {
    const errorMsg = 'Por favor ingresa tu correo y contraseña';
    console.error('Error de validación:', errorMsg);
    setError(errorMsg);
    return;
  }

  try {
    setIsLoading(true);
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
    console.log('URL de la API:', apiUrl);
    
    const requestBody = {
      email: formData.email,
      password: formData.password,
    };
    
    console.log('Cuerpo de la solicitud:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Código de estado de la respuesta:', response.status);
    
    let data;
    try {
      data = await response.json();
      console.log('Datos de la respuesta:', JSON.stringify(data, null, 2));
    } catch (jsonError) {
      console.error('Error al parsear la respuesta JSON:', jsonError);
      throw new Error('Error en la respuesta del servidor');
    }

    if (!response.ok) {
      const errorMsg = data?.message || `Error al iniciar sesión (${response.status})`;
      console.error('Error en la respuesta:', errorMsg);
      throw new Error(errorMsg);
    }

    // Verificar que la respuesta tenga la estructura esperada
    if (!data.token || !data.data?.user) {
      console.error('Respuesta inesperada del servidor:', data);
      throw new Error('Formato de respuesta inesperado del servidor');
    }

    console.log('Token recibido, guardando en auth system...');
    
    const userData = data.data.user;
    const userRole = userData.role || 'student';
    
    console.log('Rol del usuario:', userRole);
    console.log('Datos del usuario:', JSON.stringify(userData, null, 2));
    
    // Store tokens using our auth system
    setAuthTokens({
      accessToken: data.token,
      refreshToken: data.refreshToken || '', // Use the refresh token if available
      expiresIn: 3600 // 1 hour default
    });
    
    // Store user data in localStorage (this is separate from the auth tokens)
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    console.log(`Redirigiendo a /${userRole}/dashboard`);
    
    // Get the returnTo URL from query params or use the default dashboard
    const searchParams = new URLSearchParams(window.location.search);
    const returnTo = searchParams.get('returnTo') || searchParams.get('callbackUrl') || `/${userRole}/dashboard`;
    
    // Use replace instead of push to prevent going back to login page
    router.replace(returnTo);
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
    console.error('Error en handleSubmit:', errorMessage, err);
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <Link 
        href="/" 
        className="absolute top-4 left-4 flex items-center text-custom-4 hover:text-custom-3 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Volver al inicio
      </Link>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-custom-4 to-custom-3 p-8 text-center">
            <h1 className="text-3xl font-bold text-custom-3">Bienvenido</h1>
            <p className="mt-2 text-custom-3">Inicia sesión para continuar</p>
          </div>

          {/* Formulario */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="focus:ring-2 focus:ring-custom-4 focus:border-custom-4 block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none transition duration-150 ease-in-out"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <Link href="/olvide-contrasena" className="text-sm text-custom-4 hover:text-custom-3 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="focus:ring-2 focus:ring-custom-4 focus:border-custom-4 block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none transition duration-150 ease-in-out"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-custom-4 focus:ring-custom-4 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Recordar mi sesión
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-3 px-4 bg-custom-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-custom-4 to-custom-3 hover:from-custom-5 hover:to-custom-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-4 shadow-md transition duration-150 ease-in-out ${isLoading ? 'opacity-80' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">¿No tienes una cuenta?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/registro"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-4 transition duration-150 ease-in-out"
                >
                  Regístrate ahora
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-custom-4">
            Al continuar, aceptas nuestros{' '}
              <a href="#" className="text-custom-4 hover:text-custom-3 transition-colors">
              Términos de servicio
            </a>{' '}
            y{' '}
              <a href="#" className="text-custom-4 hover:text-custom-3 transition-colors">
              Política de privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
