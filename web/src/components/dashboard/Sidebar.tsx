'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Bookmark, 
  MessageSquare,
  BarChart2,
  Calendar,
  Bell,
  HelpCircle,
  Home
} from 'lucide-react';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [notifications] = useState<number>(0);
  
  const fetchUserData = useCallback(async () => {
    try {
      console.log('Fetching user data...');
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/me`;
      console.log('Making request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Important for cookies/sessions if using them
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'No se pudo cargar la información del usuario');
      }

      const responseData = await response.json();
      console.log('User data received:', responseData);
      
      // Check for both possible response structures
      const userData = responseData.data?.user || responseData.data || responseData;
      
      if (userData) {
        console.log('Processing user data:', userData);
        const userNameToSet = userData.name || userData.username || 'Usuario';
        const userEmailToSet = userData.email || '';
        const userRoleToSet = userData.role || 'student';
        
        console.log('Setting user data:', { 
          name: userNameToSet, 
          email: userEmailToSet, 
          role: userRoleToSet 
        });
        
        setUserName(userNameToSet);
        setUserEmail(userEmailToSet);
        setUserRole(userRoleToSet);
        
        // Handle avatar
        if (userData.avatar || userData.image) {
          const imagePath = userData.avatar || userData.image;
          
          if (imagePath === 'default-avatar.png' || imagePath.includes('default-avatar')) {
            setUserAvatar('');
          } else {
            const avatarUrl = imagePath.startsWith('http')
              ? imagePath
              : `${process.env.NEXT_PUBLIC_API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
            
            try {
              console.log('Checking avatar URL:', avatarUrl);
              const imgCheck = await fetch(avatarUrl, { 
                method: 'HEAD',
                credentials: 'omit',
                cache: 'no-cache'
              });
              
              if (imgCheck.ok) {
                console.log('Avatar image exists, setting URL');
                setUserAvatar(avatarUrl);
              } else {
                console.log('Avatar image not found, using default');
                setUserAvatar('');
              }
            } catch (error) {
              console.warn('Error checking avatar image:', error);
              setUserAvatar('');
            }
          }
        } else {
          setUserAvatar('');
        }
        
        // Update localStorage
        localStorage.setItem('userRole', userRoleToSet);
        localStorage.setItem('userName', userNameToSet);
        localStorage.setItem('userEmail', userEmailToSet);
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('User data saved to localStorage');
      } else {
        console.warn('No user data in response:', responseData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      
      // Fallback to localStorage data if available
      const userDataStr = localStorage.getItem('userData');
      const savedRole = localStorage.getItem('userRole');
      const savedName = localStorage.getItem('userName');
      const savedEmail = localStorage.getItem('userEmail');
      
      console.log('Falling back to localStorage data:', { 
        hasUserData: !!userDataStr,
        savedRole,
        savedName,
        savedEmail
      });
      
      if (savedName) setUserName(savedName);
      if (savedEmail) setUserEmail(savedEmail);
      if (savedRole) setUserRole(savedRole);
      
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData.avatar || userData.image) {
            const avatarUrl = (userData.avatar || userData.image).startsWith('http')
              ? (userData.avatar || userData.image)
              : `${process.env.NEXT_PUBLIC_API_URL}${(userData.avatar || userData.image).startsWith('/') ? '' : '/'}${userData.avatar || userData.image}`;
            setUserAvatar(avatarUrl);
          }
        } catch (e) {
          console.error('Error parsing localStorage user data:', e);
        }
      }
    } finally {
      setIsLoading(false);
      console.log('Finished loading user data');
    }
  }, [router]);
  
  useEffect(() => {
    // Marcar que el componente se ha montado en el cliente
    setIsClient(true);
    
    // Solo se ejecuta en el cliente
    if (typeof window !== 'undefined') {
      // Intentar obtener el rol del localStorage si existe
      const savedRole = localStorage.getItem('userRole');
      if (savedRole) {
        setUserRole(savedRole);
      }
      
      fetchUserData();
      
      // Configurar un intervalo para actualizar los datos del usuario periódicamente
      const intervalId = setInterval(fetchUserData, 5 * 60 * 1000); // Actualizar cada 5 minutos
      
      return () => clearInterval(intervalId);
    }
  }, [fetchUserData]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const navigation = [
    { 
      name: 'Inicio', 
      href: `/${userRole}/dashboard`, 
      icon: Home,
      roles: ['student', 'instructor', 'admin'] 
    },
    { 
      name: 'Mis Cursos', 
      href: `/${userRole}/courses`, 
      icon: BookOpen,
      roles: ['student'] 
    },
    { 
      name: 'Mis Clases', 
      href: `/${userRole}/sessions`, 
      icon: Calendar,
      roles: ['student', 'instructor'] 
    },
    { 
      name: 'Mis Cursos', 
      href: `/${userRole}/my-courses`, 
      icon: BookOpen,
      roles: ['instructor'] 
    },
    { 
      name: 'Mensajes', 
      href: `/${userRole}/messages`, 
      icon: MessageSquare,
      roles: ['student', 'instructor'],
      badge: 5 // Número de mensajes no leídos
    },
    { 
      name: 'Favoritos', 
      href: `/${userRole}/saved`, 
      icon: Bookmark,
      roles: ['student'] 
    },
    { 
      name: 'Usuarios', 
      href: '/admin/users', 
      icon: Users,
      roles: ['admin'] 
    },
    { 
      name: 'Reportes', 
      href: '/admin/reports', 
      icon: BarChart2,
      roles: ['admin'] 
    },
    { 
      name: 'Configuración', 
      href: `/${userRole}/settings`, 
      icon: Settings,
      roles: ['student', 'instructor', 'admin'] 
    },
    { 
      name: 'Soporte', 
      href: '/support', 
      icon: HelpCircle,
      roles: ['student', 'instructor', 'admin'] 
    },
  ];

  // Mostrar opciones genéricas mientras se carga el rol del usuario
  const filteredNavigation = userRole 
    ? navigation.filter(item => item.roles.includes(userRole))
    : [
        { 
          name: 'Inicio', 
          href: '/dashboard', 
          icon: Home,
          roles: ['guest'] 
        },
        { 
          name: 'Cursos', 
          href: '/courses', 
          icon: BookOpen,
          roles: ['guest'] 
        },
        { 
          name: 'Iniciar Sesión', 
          href: '/login', 
          icon: LogOut,
          roles: ['guest'] 
        }
      ];

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-screen">
          {/* Logo */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image 
                src="/favicon-32x32.png" 
                alt="Logo Educa Platform" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Educa Platform
              </h1>
            </Link>
          </div>
          
          {/* Perfil del usuario */}
          {!isLoading && (
            <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {userAvatar ? (
                  <Image
                    src={userAvatar} 
                    width={40}
                    height={40}
                    alt={userName}
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      // Si hay un error al cargar la imagen, mostrar la inicial
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center justify-center ${userAvatar ? 'hidden' : ''}`}>
                  <span className="text-primary-600 dark:text-primary-300 font-medium">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                    {userName || 'Usuario'}
                  </p>
                  {userEmail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userEmail}
                    </p>
                  )}
                  <p className="text-xs font-medium mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      {userRole === 'student' ? 'Estudiante' : 
                       userRole === 'instructor' ? 'Instructor' : 
                       userRole === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </p>
                </div>
                <Link 
                  href={`/${userRole}/settings`}
                  className="ml-auto p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  title="Configuración"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}
          
          {/* Navegación principal */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={userRole ? item.href : item.href.replace(/^\/(student|instructor|admin)/, '')}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        isActive 
                          ? 'text-primary-500 dark:text-primary-400' 
                          : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Notificaciones y Cerrar sesión */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <Link 
              href="/notifications" 
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </div>
              <span className="ml-3">Notificaciones</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header móvil */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <button className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">
            {filteredNavigation.find(item => pathname.startsWith(item.href))?.name || 'Dashboard'}
          </h1>
          <div className="w-6"></div> {/* Para mantener el espacio del botón de menú */}
        </div>
      </div>
    </div>
  );
}
