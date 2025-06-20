import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { BarberServiceController } from '../controllers/BarberServiceController';
import { authenticate } from '../middleware/auth';
import { BarberServiceService } from '../services/BarberServiceService';

const router = Router();
const prisma = new PrismaClient();

// Instanciar serviços e controllers
const barberServiceService = new BarberServiceService(prisma);
const barberServiceController = new BarberServiceController(barberServiceService);

// Rotas protegidas - requerem autenticação
router.use(authenticate);

/**
 * @route POST /api/barber-services
 * @desc Atribuir serviço a barbeiro
 * @access SUPER_ADMIN, ADMIN, BARBER
 */
router.post('/', ((req: any, res: any) => barberServiceController.create(req, res)) as any);

/**
 * @route GET /api/barber-services
 * @desc Listar atribuições com filtros
 * @access SUPER_ADMIN, ADMIN, BARBER
 */
router.get('/', ((req: any, res: any) => barberServiceController.findMany(req, res)) as any);

/**
 * @route GET /api/barber-services/stats
 * @desc Obter estatísticas de atribuições
 * @access SUPER_ADMIN, ADMIN, BARBER
 */
router.get('/stats', ((req: any, res: any) => barberServiceController.getStats(req, res)) as any);

/**
 * @route GET /api/barber-services/available/:serviceId
 * @desc Buscar barbeiros disponíveis para um serviço (público)
 * @access ALL AUTHENTICATED USERS
 */
router.get('/available/:serviceId', ((req: any, res: any) =>
  barberServiceController.getAvailableBarbers(req, res)) as any);

/**
 * @route GET /api/barber-services/check/:barberId/:serviceId
 * @desc Verificar se barbeiro pode executar serviço
 * @access ALL AUTHENTICATED USERS
 */
router.get('/check/:barberId/:serviceId', ((req: any, res: any) =>
  barberServiceController.checkCanPerformService(req, res)) as any);

/**
 * @route GET /api/barber-services/barber/:barberId
 * @desc Buscar serviços de um barbeiro
 * @access SUPER_ADMIN, ADMIN, BARBER (próprios serviços)
 */
router.get('/barber/:barberId', ((req: any, res: any) =>
  barberServiceController.findServicesByBarber(req, res)) as any);

/**
 * @route GET /api/barber-services/service/:serviceId
 * @desc Buscar barbeiros que executam um serviço
 * @access SUPER_ADMIN, ADMIN
 */
router.get('/service/:serviceId', ((req: any, res: any) =>
  barberServiceController.findBarbersByService(req, res)) as any);

/**
 * @route GET /api/barber-services/:id
 * @desc Buscar atribuição por ID
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.get('/:id', ((req: any, res: any) => barberServiceController.findById(req, res)) as any);

/**
 * @route PUT /api/barber-services/:id
 * @desc Atualizar atribuição
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.put('/:id', ((req: any, res: any) => barberServiceController.update(req, res)) as any);

/**
 * @route DELETE /api/barber-services/:id
 * @desc Remover atribuição (soft delete)
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.delete('/:id', ((req: any, res: any) => barberServiceController.delete(req, res)) as any);

/**
 * @route PATCH /api/barber-services/:id/reactivate
 * @desc Reativar atribuição
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.patch('/:id/reactivate', ((req: any, res: any) =>
  barberServiceController.reactivate(req, res)) as any);

export default router;
