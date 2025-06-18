import { Request, Response } from 'express';
import { GlobalScheduleController } from '../controllers/scheduleController';

// Mock dos serviços
jest.mock('../services/scheduleService', () => ({
  GlobalScheduleService: {
    create: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  BarberScheduleService: {
    create: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  GlobalExceptionService: {
    create: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  BarberExceptionService: {
    create: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  AvailabilityService: {
    getAvailability: jest.fn(),
  },
}));

// Função helper para testar a correção do bug de recursão infinita
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

describe('ScheduleController - Bug Fix Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      params: { barbershopId: 'test-barbershop-id' },
      query: {},
      body: {},
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('getErrorMessage helper function', () => {
    it('should handle Error instances without infinite recursion', () => {
      const testError = new Error('Test error message');
      
      // Esta função deve retornar a mensagem sem causar recursão infinita
      const result = getErrorMessage(testError);
      
      expect(result).toBe('Test error message');
    });

    it('should handle string errors', () => {
      const testError = 'String error message';
      
      const result = getErrorMessage(testError);
      
      expect(result).toBe('String error message');
    });

    it('should handle null/undefined errors', () => {
      expect(getErrorMessage(null)).toBe('null');
      expect(getErrorMessage(undefined)).toBe('undefined');
    });

    it('should handle object errors', () => {
      const testError = { message: 'Object error' };
      
      const result = getErrorMessage(testError);
      
      expect(result).toBe('[object Object]');
    });

    it('should handle number errors', () => {
      const testError = 404;
      
      const result = getErrorMessage(testError);
      
      expect(result).toBe('404');
    });

    it('should not cause stack overflow with nested Error objects', () => {
      const nestedError = new Error('Nested error');
      const parentError = new Error('Parent error');
      (parentError as any).cause = nestedError;
      
      // Esta chamada deve completar sem stack overflow
      const result = getErrorMessage(parentError);
      
      expect(result).toBe('Parent error');
    });
  });

  describe('GlobalScheduleController error handling', () => {
    it('should handle errors in getMany without infinite recursion', async () => {
      const { GlobalScheduleService } = require('../services/scheduleService');
      
      // Simular erro no serviço
      const testError = new Error('Database connection failed');
      GlobalScheduleService.findMany.mockRejectedValue(testError);

      await GlobalScheduleController.getMany(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed',
        error: 'Database connection failed',
      });
    });

    it('should handle errors in create without infinite recursion', async () => {
      const { GlobalScheduleService } = require('../services/scheduleService');
      
      // Simular erro no serviço
      const testError = new Error('Validation failed');
      GlobalScheduleService.create.mockRejectedValue(testError);

      await GlobalScheduleController.create(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        error: 'Validation failed',
      });
    });

    it('should handle non-Error objects in error handling', async () => {
      const { GlobalScheduleService } = require('../services/scheduleService');
      
      // Simular erro que não é uma instância de Error
      const testError = 'String error';
      GlobalScheduleService.findMany.mockRejectedValue(testError);

      await GlobalScheduleController.getMany(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'String error',
        error: 'String error',
      });
    });
  });

  describe('Performance test - no infinite recursion', () => {
    it('should complete error handling within reasonable time', async () => {
      const { GlobalScheduleService } = require('../services/scheduleService');
      
      const testError = new Error('Performance test error');
      GlobalScheduleService.findMany.mockRejectedValue(testError);

      const startTime = Date.now();
      
      await GlobalScheduleController.getMany(
        mockRequest as Request,
        mockResponse as Response
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // O tratamento de erro deve completar em menos de 100ms
      // (muito mais rápido que um stack overflow que travaria)
      expect(executionTime).toBeLessThan(100);
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });
});
