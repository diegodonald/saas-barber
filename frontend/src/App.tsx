import { Routes, Route } from 'react-router-dom'

// Páginas temporárias para estrutura inicial
function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-900 mb-4">
          💈 SaaS Barber
        </h1>
        <p className="text-lg text-primary-700 mb-8">
          Sistema de Agendamento para Barbearias
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">🚀 Projeto Iniciado!</h2>
          <p className="text-gray-600 mb-4">
            Estrutura base configurada com sucesso:
          </p>
          <ul className="text-left text-sm text-gray-700 space-y-2">
            <li>✅ React + TypeScript</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ React Query</li>
            <li>✅ React Router</li>
            <li>✅ Vite</li>
            <li>✅ Playwright</li>
            <li>✅ Prisma Schema</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              404 - Página não encontrada
            </h1>
            <p className="text-gray-600">
              Esta página será implementada em breve.
            </p>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App 