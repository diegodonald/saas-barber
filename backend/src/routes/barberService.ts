import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BarberServiceController } from '../controllers/BarberServiceController';
import { BarberServiceService } from '../services/BarberServiceService';
import { authenticate } from '../middleware/auth';

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
router.post('/', (req, res) => barberServiceController.create(req, res));

/**
 * @route GET /api/barber-services
 * @desc Listar atribuições com filtros
 * @access SUPER_ADMIN, ADMIN, BARBER
 */
router.get('/', (req, res) => barberServiceController.findMany(req, res));

/**
 * @route GET /api/barber-services/stats
 * @desc Obter estatísticas de atribuições
 * @access SUPER_ADMIN, ADMIN, BARBER
 */
router.get('/stats', (req, res) => barberServiceController.getStats(req, res));

/**
 * @route GET /api/barber-services/available/:serviceId
 * @desc Buscar barbeiros disponíveis para um serviço (público)
 * @access ALL AUTHENTICATED USERS
 */
router.get('/available/:serviceId', (req, res) => barberServiceController.getAvailableBarbers(req, res));

/**
 * @route GET /api/barber-services/check/:barberId/:serviceId
 * @desc Verificar se barbeiro pode executar serviço
 * @access ALL AUTHENTICATED USERS
 */
router.get('/check/:barberId/:serviceId', (req, res) => barberServiceController.checkCanPerformService(req, res));

/**
 * @route GET /api/barber-services/barber/:barberId
 * @desc Buscar serviços de um barbeiro
 * @access SUPER_ADMIN, ADMIN, BARBER (próprios serviços)
 */
router.get('/barber/:barberId', (req, res) => barberServiceController.findServicesByBarber(req, res));

/**
 * @route GET /api/barber-services/service/:serviceId
 * @desc Buscar barbeiros que executam um serviço
 * @access SUPER_ADMIN, ADMIN
 */
router.get('/service/:serviceId', (req, res) => barberServiceController.findBarbersByService(req, res));

/**
 * @route GET /api/barber-services/:id
 * @desc Buscar atribuição por ID
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.get('/:id', (req, res) => barberServiceController.findById(req, res));

/**
 * @route PUT /api/barber-services/:id
 * @desc Atualizar atribuição
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.put('/:id', (req, res) => barberServiceController.update(req, res));

/**
 * @route DELETE /api/barber-services/:id
 * @desc Remover atribuição (soft delete)
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.delete('/:id', (req, res) => barberServiceController.delete(req, res));

/**
 * @route PATCH /api/barber-services/:id/reactivate
 * @desc Reativar atribuição
 * @access SUPER_ADMIN, ADMIN, BARBER (próprias atribuições)
 */
router.patch('/:id/reactivate', (req, res) => barberServiceController.reactivate(req, res));

export default router; 