import { Router } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { AppointmentService } from '../services/AppointmentService';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Instanciar Prisma e serviços
const prisma = new PrismaClient();
const appointmentService = new AppointmentService(prisma);
const appointmentController = new AppointmentController(appointmentService);

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas principais de agendamento
router.post('/', authenticate, (req, res) => appointmentController.create(req as AuthenticatedRequest, res));
router.get('/', authenticate, (req, res) => appointmentController.findMany(req as AuthenticatedRequest, res));
router.get('/stats', authenticate, (req, res) => appointmentController.getStats(req as AuthenticatedRequest, res));
router.get('/available-slots', authenticate, (req, res) => appointmentController.getAvailableSlots(req as AuthenticatedRequest, res));
router.get('/barber/:barberId', authenticate, (req, res) => appointmentController.getByBarber(req as AuthenticatedRequest, res));
router.get('/:id', authenticate, (req, res) => appointmentController.findById(req as AuthenticatedRequest, res));
router.put('/:id', authenticate, (req, res) => appointmentController.update(req as AuthenticatedRequest, res));
router.delete('/:id', authenticate, (req, res) => appointmentController.cancel(req as AuthenticatedRequest, res));

// Rotas de ações específicas
router.patch('/:id/confirm', authenticate, (req, res) => appointmentController.confirm(req as AuthenticatedRequest, res));
router.patch('/:id/start', authenticate, (req, res) => appointmentController.startService(req as AuthenticatedRequest, res));
router.patch('/:id/complete', authenticate, (req, res) => appointmentController.complete(req as AuthenticatedRequest, res));
router.patch('/:id/no-show', authenticate, (req, res) => appointmentController.markNoShow(req as AuthenticatedRequest, res));

export default router; 