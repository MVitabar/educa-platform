'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación al cargar el componente
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    setIsAuthenticated(!!token);
    setUserRole(role);

    // Efecto para el scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    router.push('/');
  };

  // No mostrar header en rutas de autenticación
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  // Si es una ruta del dashboard, el header se maneja en el layout del dashboard
  if (pathname.startsWith('/student') || 
      pathname.startsWith('/instructor') || 
      pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
      } border-b border-gray-200 dark:border-gray-700`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/favicon-32x32.png" 
                alt="Logo Educa Platform" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="ml-2 text-xl font-bold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                Educa Platform
              </span>
            </Link>
          </div>

          {/* Menú de navegación (desktop) */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`px-3 py-2 text-sm font-medium ${
                pathname === '/' 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              Inicio
            </Link>
            <Link 
              href="/courses" 
              className={`px-3 py-2 text-sm font-medium ${
                pathname === '/courses' 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              Cursos
            </Link>
            {isAuthenticated && userRole === 'instructor' && (
              <Link 
                href="/instructor/dashboard" 
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Panel del Instructor
              </Link>
            )}
          </nav>

          {/* Botones de autenticación (desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href={
                    userRole === 'student' ? '/student/dashboard' :
                    userRole === 'instructor' ? '/instructor/dashboard' :
                    userRole === 'admin' ? '/admin/dashboard' : '/'
                  }
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <User className="h-4 w-4 mr-2" />
                  Mi Cuenta
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/' 
                  ? 'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/courses"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/courses' 
                  ? 'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-white' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Cursos
            </Link>
            {isAuthenticated && userRole === 'instructor' && (
              <Link
                href="/instructor/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Panel del Instructor
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {isAuthenticated ? (
              <div className="px-5 space-y-3">
                <Link
                  href={
                    userRole === 'student' ? '/student/dashboard' :
                    userRole === 'instructor' ? '/instructor/dashboard' :
                    userRole === 'admin' ? '/admin/dashboard' : '/'
                  }
                  className="block w-full px-4 py-2 text-base font-medium text-center text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mi Cuenta
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-base font-medium text-center text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="px-5 space-y-3">
                <Link
                  href="/login"
                  className="block w-full px-4 py-2 text-base font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="block w-full px-4 py-2 text-base font-medium text-center text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
