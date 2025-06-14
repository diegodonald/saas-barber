import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware de segurança
app.use(helmet())

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // máximo 100 requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
})
app.use('/api', limiter)

// Middleware de parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compressão
app.use(compression())

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  })
})

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    message: '🚀 SaaS Barber API está funcionando!',
    timestamp: new Date().toISOString(),
    features: [
      '✅ Express + TypeScript',
      '✅ Prisma ORM',
      '✅ JWT Auth',
      '✅ Rate Limiting',
      '✅ Security Headers',
      '✅ CORS',
      '✅ Compression',
    ],
  })
})

// Middleware de erro global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint não encontrado',
      status: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  })
})

// Iniciar servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`🧪 API test: http://localhost:${PORT}/api/test`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

export default app 