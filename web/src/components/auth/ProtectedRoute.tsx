'use client';

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';

type UserRole = 'student' | 'instructor' | 'admin';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['student', 'instructor', 'admin'],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      console.log('=== Verificando autenticación ===');
      // Check if running on client-side
      if (typeof window === 'undefined') {
        console.log('No se está ejecutando en el cliente');
        return;
      }
      
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole') as UserRole | null;
      const userData = localStorage.getItem('userData');
      
      console.log('Token en localStorage:', token ? 'Presente' : 'Ausente');
      console.log('Rol en localStorage:', userRole);
      console.log('Datos del usuario:', userData);
      console.log('Roles permitidos en esta ruta:', allowedRoles);
      
      // If no token, redirect to login
      if (!token) {
        console.log('No hay token, redirigiendo a login...');
        router.push(redirectTo);
        setIsAuthorized(false);
        return;
      }

      // If user has a role but it's not in the allowed roles, redirect to their dashboard
      if (userRole && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        console.log(`Rol ${userRole} no tiene permiso para acceder a esta ruta`);
        console.log(`Redirigiendo a /${userRole}/dashboard`);
        router.push(`/${userRole}/dashboard`);
        setIsAuthorized(false);
        return;
      }
      
      // If we get here, the user is authorized
      console.log('Usuario autorizado, mostrando contenido...');
      setIsAuthorized(true);
    };

    checkAuth();
  }, [allowedRoles, redirectTo, router]);

  // Show loading state while checking auth
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
