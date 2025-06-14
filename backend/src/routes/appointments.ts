import { Router } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { AppointmentService } from '../services/AppointmentService';
import { authenticate, authorize } from '../middleware/auth';
import { Role, PrismaClient } from '@prisma/client';

const router = Router();

// Instanciar Prisma e serviços
const prisma = new PrismaClient();
const appointmentService = new AppointmentService(prisma);
const appointmentController = new AppointmentController(appointmentService);

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas principais de agendamento
router.post('/', (req, res) => appointmentController.create(req, res));
router.get('/', (req, res) => appointmentController.findMany(req, res));
router.get('/stats', (req, res) => appointmentController.getStats(req, res));
router.get('/available-slots', (req, res) => appointmentController.getAvailableSlots(req, res));
router.get('/barber/:barberId', (req, res) => appointmentController.getByBarber(req, res));
router.get('/:id', (req, res) => appointmentController.findById(req, res));
router.put('/:id', (req, res) => appointmentController.update(req, res));
router.delete('/:id', (req, res) => appointmentController.cancel(req, res));

// Rotas de ações específicas
router.patch('/:id/confirm', (req, res) => appointmentController.confirm(req, res));
router.patch('/:id/start', (req, res) => appointmentController.startService(req, res));
router.patch('/:id/complete', (req, res) => appointmentController.complete(req, res));
router.patch('/:id/no-show', (req, res) => appointmentController.markNoShow(req, res));

export default router; 