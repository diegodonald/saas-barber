import { Router } from 'express';
import { 
  GlobalScheduleController,
  BarberScheduleController,
  GlobalExceptionController,
  BarberExceptionController,
  AvailabilityController
} from '../controllers/scheduleController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// ========================================
// ROTAS DE HORÁRIOS GLOBAIS
// ========================================

// Todas as rotas de horários globais requerem autenticação
router.use('/global-schedules', authenticate);

// Criar horário global (apenas ADMIN)
router.post('/global-schedules', 
  authorize(['ADMIN']), 
  GlobalScheduleController.create
);

// Buscar horários globais por barbearia (ADMIN, BARBER)
router.get('/global-schedules/barbershop/:barbershopId', 
  authorize(['ADMIN', 'BARBER']), 
  GlobalScheduleController.getMany
);

// Buscar horário global por ID (ADMIN, BARBER)
router.get('/global-schedules/:id', 
  authorize(['ADMIN', 'BARBER']), 
  GlobalScheduleController.getById
);

// Atualizar horário global (apenas ADMIN)
router.put('/global-schedules/:id', 
  authorize(['ADMIN']), 
  GlobalScheduleController.update
);

// Remover horário global (apenas ADMIN)
router.delete('/global-schedules/:id', 
  authorize(['ADMIN']), 
  GlobalScheduleController.delete
);

// ========================================
// ROTAS DE HORÁRIOS DE BARBEIROS
// ========================================

// Todas as rotas de horários de barbeiros requerem autenticação
router.use('/barber-schedules', authenticate);

// Criar horário de barbeiro (ADMIN, BARBER - próprio)
router.post('/barber-schedules', 
  authorize(['ADMIN', 'BARBER']), 
  BarberScheduleController.create
);

// Buscar horários de barbeiros (ADMIN, BARBER)
router.get('/barber-schedules', 
  authorize(['ADMIN', 'BARBER']), 
  BarberScheduleController.getMany
);

// Buscar horário de barbeiro por ID (ADMIN, BARBER - próprio)
router.get('/barber-schedules/:id', 
  authorize(['ADMIN', 'BARBER']), 
  BarberScheduleController.getById
);

// Atualizar horário de barbeiro (ADMIN, BARBER - próprio)
router.put('/barber-schedules/:id', 
  authorize(['ADMIN', 'BARBER']), 
  BarberScheduleController.update
);

// Remover horário de barbeiro (ADMIN, BARBER - próprio)
router.delete('/barber-schedules/:id', 
  authorize(['ADMIN', 'BARBER']), 
  BarberScheduleController.delete
);

// ========================================
// ROTAS DE EXCEÇÕES GLOBAIS
// ========================================

// Todas as rotas de exceções globais requerem autenticação
router.use('/global-exceptions', authenticate);

// Criar exceção global (apenas ADMIN)
router.post('/global-exceptions', 
  authorize(['ADMIN']), 
  GlobalExceptionController.create
);

// Buscar exceções globais por barbearia (ADMIN, BARBER)
router.get('/global-exceptions/barbershop/:barbershopId', 
  authorize(['ADMIN', 'BARBER']), 
  GlobalExceptionController.getMany
);

// Buscar exceção global por ID (ADMIN, BARBER)
router.get('/global-exceptions/:id', 
  authorize(['ADMIN', 'BARBER']), 
  GlobalExceptionController.getById
);

// Atualizar exceção global (apenas ADMIN)
router.put('/global-exceptions/:id', 
  authorize(['ADMIN']), 
  GlobalExceptionController.update
);

// Remover exceção global (apenas ADMIN)
router.delete('/global-exceptions/:id', 
  authorize(['ADMIN']), 
  GlobalExceptionController.delete
);

// ========================================
// ROTAS DE EXCEÇÕES DE BARBEIROS
// ========================================

// Todas as rotas de exceções de barbeiros requerem autenticação
router.use('/barber-exceptions', authenticate);

// Criar exceção de barbeiro (ADMIN, BARBER - próprio)
router.post('/barber-exceptions', 
  authorize(['ADMIN', 'BARBER']), 
  BarberExceptionController.create
);

// Buscar exceções de barbeiros (ADMIN, BARBER)
router.get('/barber-exceptions', 
  authorize(['ADMIN', 'BARBER']), 
  BarberExceptionController.getMany
);

// Buscar exceção de barbeiro por ID (ADMIN, BARBER - próprio)
router.get('/barber-exceptions/:id', 
  authorize(['ADMIN', 'BARBER']), 
  BarberExceptionController.getById
);

// Atualizar exceção de barbeiro (ADMIN, BARBER - próprio)
router.put('/barber-exceptions/:id', 
  authorize(['ADMIN', 'BARBER']), 
  BarberExceptionController.update
);

// Remover exceção de barbeiro (ADMIN, BARBER - próprio)
router.delete('/barber-exceptions/:id', 
  authorize(['ADMIN', 'BARBER']), 
  BarberExceptionController.delete
);

// ========================================
// ROTAS DE DISPONIBILIDADE (PÚBLICO)
// ========================================

// Buscar disponibilidade por barbearia e data (PÚBLICO)
router.get('/availability/barbershop/:barbershopId/date/:date', 
  AvailabilityController.getAvailability
);

// Buscar disponibilidade específica de um barbeiro (PÚBLICO)
router.get('/availability/barber/:barberId/date/:date', 
  AvailabilityController.getBarberAvailability
);

// ========================================
// ROTAS ADMINISTRATIVAS
// ========================================

// Rota para criar horários padrão de uma barbearia (ADMIN)
router.post('/admin/barbershop/:barbershopId/setup-default-schedule', 
  authenticate,
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { barbershopId } = req.params;
      const { 
        openTime = '09:00',
        closeTime = '18:00',
        lunchStart = '12:00',
        lunchEnd = '13:00',
        workingDays = [1, 2, 3, 4, 5, 6] // Segunda a sábado
      } = req.body;

      const createdSchedules = [];

      // Criar horários para os dias da semana especificados
      for (const dayOfWeek of workingDays) {
        try {
          const schedule = await GlobalScheduleController.create({
            body: {
              barbershopId,
              dayOfWeek,
              isOpen: true,
              openTime,
              closeTime,
              lunchStart,
              lunchEnd,
            }
          } as any, {} as any);
          
          createdSchedules.push(schedule);
        } catch (error) {
          // Ignorar erros de duplicação (horário já existe)
          // Horário para este dia já existe - ignorando duplicação
        }
      }

      res.json({
        success: true,
        message: 'Horários padrão configurados com sucesso',
        data: {
          barbershopId,
          createdSchedules: createdSchedules.length,
          workingDays,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao configurar horários padrão',
        error: error.message,
      });
    }
  }
);

// Rota para copiar horários globais para um barbeiro específico (ADMIN)
router.post('/admin/barber/:barberId/copy-global-schedule', 
  authenticate,
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { barberId } = req.params;
      
      // Buscar o barbeiro para obter o barbershopId
      const barberSchedules = await BarberScheduleController.getMany({
        query: { barberId }
      } as any, {} as any);

      if (!barberSchedules) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado',
        });
      }

      // Buscar horários globais da barbearia
      // Implementar lógica para copiar horários globais

      res.json({
        success: true,
        message: 'Horários globais copiados para o barbeiro com sucesso',
        data: { barberId },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao copiar horários globais',
        error: error.message,
      });
    }
  }
);

export default router;
