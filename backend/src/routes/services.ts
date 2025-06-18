import { Role } from '@prisma/client';
import { Router } from 'express';
import { ServiceController } from '../controllers/ServiceController';
import { authenticate, authorize } from '../middleware/auth';
import { asAuthenticatedHandler } from '../types/auth';

const router = Router();
const serviceController = new ServiceController();

/**
 * Rotas para gestão de serviços
 *
 * Todas as rotas requerem autenticação
 * Apenas ADMIN, BARBER e SUPER_ADMIN podem gerenciar serviços
 */

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Middleware de autorização para roles permitidos
const authorizeServiceManagement = authorize([Role.ADMIN, Role.BARBER, Role.SUPER_ADMIN]);

/**
 * @route   GET /api/services/categories
 * @desc    Obter categorias de serviços
 * @access  Private (Admin, Barber, Super Admin)
 */
router.get(
  '/categories',
  authorizeServiceManagement,
  asAuthenticatedHandler(serviceController.getServiceCategories)
);

/**
 * @route   GET /api/services/stats
 * @desc    Obter estatísticas de serviços
 * @access  Private (Admin, Barber, Super Admin)
 */
router.get(
  '/stats',
  authorizeServiceManagement,
  asAuthenticatedHandler(serviceController.getServiceStats)
);

/**
 * @route   POST /api/services
 * @desc    Criar novo serviço
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/',
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  asAuthenticatedHandler(serviceController.createService)
);

/**
 * @route   GET /api/services
 * @desc    Listar serviços com filtros
 * @access  Private (Admin, Barber, Super Admin)
 */
router.get('/', authorizeServiceManagement, asAuthenticatedHandler(serviceController.getServices));

/**
 * @route   GET /api/services/:id
 * @desc    Buscar serviço por ID
 * @access  Private (Admin, Barber, Super Admin)
 */
router.get(
  '/:id',
  authorizeServiceManagement,
  asAuthenticatedHandler(serviceController.getServiceById)
);

/**
 * @route   PUT /api/services/:id
 * @desc    Atualizar serviço
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/:id',
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  asAuthenticatedHandler(serviceController.updateService)
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Desativar serviço
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  '/:id',
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  asAuthenticatedHandler(serviceController.deactivateService)
);

/**
 * @route   PATCH /api/services/:id/reactivate
 * @desc    Reativar serviço
 * @access  Private (Admin, Super Admin)
 */
router.patch(
  '/:id/reactivate',
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  asAuthenticatedHandler(serviceController.reactivateService)
);

export default router;
