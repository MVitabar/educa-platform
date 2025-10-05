"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CourseCard from '@/components/course/CourseCard';
import { sampleCourses } from '@/types/course';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get all unique categories from courses
  const allCategories = Array.from(
    new Set(sampleCourses.flatMap(course => course.category))
  );

  // Get all unique levels from courses
  const allLevels = Array.from(
    new Set(sampleCourses.map(course => course.level))
  );

  // Check if user is authenticated (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get filters from URL on initial load
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const level = searchParams.get('level');

    if (search) setSearchTerm(search);
    if (category) setCategoryFilter(category);
    if (level) setLevelFilter(level);
  }, [searchParams]);

  // Filter courses based on search and filters
  const filteredCourses = sampleCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
      course.category.includes(categoryFilter);
    
    const matchesLevel = levelFilter === 'all' || 
      course.level === levelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (levelFilter !== 'all') params.set('level', levelFilter);
    
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setLevelFilter('all');
    router.push('/');
  };

  const isAuthenticated = isClient && typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Aprende habilidades nuevas hoy
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Descubre cursos en programación, diseño, negocios y más. Aprende a tu propio ritmo con instructores expertos.
            </p>
            
            <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-sm p-1 rounded-xl shadow-xl">
              <div className="relative flex w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-0 block w-full pl-10 pr-28 py-4 border-0 bg-white/90 text-base text-neutral-900 placeholder-neutral-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                  placeholder="¿Qué te gustaría aprender hoy?"
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-4 border-0 text-base font-medium rounded-r-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-neutral-500 mr-2" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filtros:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              >
                <option value="all">Todas las categorías</option>
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="text-sm rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              >
                <option value="all">Todos los niveles</option>
                {allLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              
              {(searchTerm || categoryFilter !== 'all' || levelFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="flex items-center text-sm text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </button>
              )}
            </div>
            
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">No se encontraron cursos</h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              No hay cursos que coincidan con los filtros seleccionados. Intenta con otros términos de búsqueda.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Call to Action */}
      {!isAuthenticated && (
        <div className="bg-primary-50 dark:bg-neutral-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              ¿Listo para comenzar tu viaje de aprendizaje?
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8 max-w-3xl mx-auto">
              Únete a miles de estudiantes que ya están mejorando sus habilidades con nuestros cursos.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/registro"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Crear cuenta gratuita
              </Link>
              <Link
                href="/cursos"
                className="inline-flex items-center bg-custom-3 px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-custom-3 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Explorar todos los cursos
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Características destacadas
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Descubre todo lo que nuestra plataforma tiene para ofrecerte
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Aprendizaje Interactivo',
                description: 'Contenidos dinámicos que se adaptan a tu ritmo de aprendizaje.',
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                color: 'from-blue-500 to-blue-600'
              },
              {
                title: 'Seguimiento de Progreso',
                description: 'Monitorea tu avance y logros en tiempo real con nuestro sistema de seguimiento detallado.',
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                color: 'from-emerald-500 to-emerald-600'
              },
              {
                title: 'Contenido de Calidad',
                description: 'Cursos diseñados por expertos en educación y tecnología con estándares de calidad.',
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                color: 'from-purple-500 to-purple-600'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-100 dark:border-neutral-700 hover:-translate-y-1"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 mx-auto shadow-md`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">¿Listo para comenzar?</h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Únete a miles de estudiantes que ya están mejorando sus habilidades con nosotros.
          </p>
          <Link 
            href="/registro" 
            className="inline-block bg-custom-3 text-white hover:bg-custom-700 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
          >
            Crear cuenta gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white border-t border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.023.047 1.351.058 3.807.058h.468c2.456 0 2.784-.011 3.807-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.399 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.047-1.023.058-1.351.058-3.807v-.468c0-2.456-.011-2.784-.058-3.807-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
            <p className="mt-8 text-center text-base text-gray-400 md:mt-0 md:order-1">
              &copy; {new Date().getFullYear()} Educa Platform. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
