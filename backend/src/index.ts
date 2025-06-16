import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware de segurança
app.use(helmet())

// CORS - Configuração completa para desenvolvimento
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3003', 
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200, // Para suporte a IE11
  preflightContinue: false
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

// Middleware adicional para OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.sendStatus(200)
    return
  }
  next()
})

// Compressão
app.use(compression())

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Importar rotas
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import serviceRoutes from './routes/services'
import appointmentRoutes from './routes/appointments'
import barberServiceRoutes from './routes/barberService'
import scheduleRoutes from './routes/scheduleRoutes'

// Configurar rotas da API
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/barber-services', barberServiceRoutes)
app.use('/api/schedules', scheduleRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  })
})

// Rota de teste
app.get('/api/test', (_req, res) => {
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
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

// Função para inicializar o servidor
const startServer = () => {
  app.listen(PORT, () => {




  })
}

// Iniciar servidor
if (process.env.NODE_ENV !== 'test') {
  startServer()
}

export default app 