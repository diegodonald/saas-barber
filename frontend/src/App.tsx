import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Páginas de autenticação
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Páginas principais
import { DashboardPage } from './pages/DashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Página inicial temporária
function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">💈 SaaS Barber</h1>
        <p className="text-lg text-blue-700 mb-8">Sistema de Agendamento para Barbearias</p>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">🚀 Sistema Pronto!</h2>
          <p className="text-gray-600 mb-4">Autenticação implementada com sucesso:</p>
          <ul className="text-left text-sm text-gray-700 space-y-2 mb-6">
            <li>✅ Context API de Autenticação</li>
            <li>✅ Login e Registro</li>
            <li>✅ Proteção de Rotas</li>
            <li>✅ Refresh Token Automático</li>
            <li>✅ Dashboard Responsivo</li>
            <li>✅ Controle de Permissões</li>
          </ul>
          <div className="space-y-2">
            <a
              href="/login"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Fazer Login
            </a>
            <a
              href="/register"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Criar Conta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Página 404
function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
          <svg
            className="h-6 w-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - Página não encontrada</h1>
        <p className="text-gray-600 mb-6">A página que você está procurando não existe.</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rota inicial */}
        <Route path="/" element={<HomePage />} />

        {/* Rotas públicas (apenas para usuários não autenticados) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* Rotas protegidas (apenas para usuários autenticados) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Rotas de agendamento */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute requiredRoles={['BARBER', 'ADMIN', 'SUPER_ADMIN']}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute requiredRoles={['CLIENT']}>
              <BookAppointmentPage />
            </ProtectedRoute>
          }
        />

        {/* Página de acesso negado */}
        <Route
          path="/unauthorized"
          element={
            <ProtectedRoute>
              <UnauthorizedPage />
            </ProtectedRoute>
          }
        />

        {/* Rotas futuras (protegidas por role) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Área Administrativa</h1>
                  <p className="text-gray-600">
                    Funcionalidades administrativas serão implementadas nas próximas fases.
                  </p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/barber/*"
          element={
            <ProtectedRoute requiredRoles={['BARBER', 'ADMIN', 'SUPER_ADMIN']}>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Área do Barbeiro</h1>
                  <p className="text-gray-600">
                    Funcionalidades para barbeiros serão implementadas nas próximas fases.
                  </p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Redirecionamento para dashboard se autenticado */}
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

        {/* Página 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
