import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Usuarios</h2>
            <p>Gestiona todos los usuarios del sistema.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cursos</h2>
            <p>Administra todos los cursos de la plataforma.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Reportes</h2>
            <p>Genera reportes y estadísticas.</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
