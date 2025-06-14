import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { 
  authenticate, 
  requireSuperAdmin, 
  requireSelfOrAdmin 
} from '../middleware/auth';

const router = Router();
const userController = new UserController();

/**
 * @route GET /api/users/profile
 * @desc Obter perfil do usuário autenticado
 * @access Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Atualizar dados básicos do usuário
 * @access Private
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route PUT /api/users/client-profile
 * @desc Atualizar perfil específico do cliente
 * @access Private (apenas clientes)
 */
router.put('/client-profile', authenticate, userController.updateClientProfile);

/**
 * @route PUT /api/users/barber-profile
 * @desc Atualizar perfil específico do barbeiro
 * @access Private (apenas barbeiros)
 */
router.put('/barber-profile', authenticate, userController.updateBarberProfile);

/**
 * @route PUT /api/users/change-password
 * @desc Alterar senha do usuário
 * @access Private
 */
router.put('/change-password', authenticate, userController.changePassword);

/**
 * @route GET /api/users
 * @desc Listar todos os usuários
 * @access Private (apenas SUPER_ADMIN)
 */
router.get('/', authenticate, requireSuperAdmin, userController.listUsers);

/**
 * @route GET /api/users/:id
 * @desc Buscar usuário por ID
 * @access Private (SUPER_ADMIN, ADMIN ou próprio usuário)
 */
router.get('/:id', authenticate, requireSelfOrAdmin, userController.getUserById);

/**
 * @route DELETE /api/users/:id
 * @desc Desativar usuário
 * @access Private (apenas SUPER_ADMIN)
 */
router.delete('/:id', authenticate, requireSuperAdmin, userController.deactivateUser);

export default router; 