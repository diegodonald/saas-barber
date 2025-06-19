import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /api/auth/register
 * @desc Registrar novo usuário
 * @access Public
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route POST /api/auth/login
 * @desc Fazer login
 * @access Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route POST /api/auth/refresh
 * @desc Renovar access token
 * @access Public
 */
router.post('/refresh', authController.refreshToken.bind(authController));

/**
 * @route POST /api/auth/logout
 * @desc Fazer logout
 * @access Private
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

/**
 * @route GET /api/auth/me
 * @desc Obter dados do usuário autenticado
 * @access Private
 */
router.get('/me', authenticate, authController.me.bind(authController));

/**
 * @route POST /api/auth/verify-token
 * @desc Verificar se token é válido
 * @access Public
 */
router.post('/verify-token', authController.verifyToken.bind(authController));

export default router;
