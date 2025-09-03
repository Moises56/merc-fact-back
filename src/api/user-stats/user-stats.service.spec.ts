import { Test, TestingModule } from '@nestjs/testing';
import { UserStatsService } from './user-stats.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { ConsultationStatsDto } from './dto/user-location.dto';

describe('UserStatsService', () => {
  let service: UserStatsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    consultaLog: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userLocation: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserStatsService>(UserStatsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserConsultationStats', () => {
    it('should return consultation statistics for a user', async () => {
      const userId = 'test-user-id';
      const mockAggregateResult = {
        _count: { id: 100 },
        _sum: { duracionMs: 125000, totalEncontrado: 50000 },
      };

      const mockCounts = [25, 8, 15, 5, 45, 8]; // icsNormal, icsAmnistia, ecNormal, ecAmnistia, success, error

      mockPrismaService.consultaLog.aggregate.mockResolvedValue(mockAggregateResult);
      mockPrismaService.consultaLog.count
        .mockResolvedValueOnce(mockCounts[0]) // icsNormal
        .mockResolvedValueOnce(mockCounts[1]) // icsAmnistia
        .mockResolvedValueOnce(mockCounts[2]) // ecNormal
        .mockResolvedValueOnce(mockCounts[3]) // ecAmnistia
        .mockResolvedValueOnce(mockCounts[4]) // success
        .mockResolvedValueOnce(mockCounts[5]); // error

      // Usar reflexión para acceder al método privado
      const result = await (service as any).getUserConsultationStats(userId);

      expect(result).toEqual({
        icsNormal: 25,
        icsAmnistia: 8,
        ecNormal: 15,
        ecAmnistia: 5,
        totalExitosas: 45,
        totalErrores: 8,
        totalConsultas: 100,
        promedioDuracionMs: 1250, // 125000 / 100
        totalAcumulado: 50000,
      });

      expect(mockPrismaService.consultaLog.aggregate).toHaveBeenCalledWith({
        where: { userId },
        _count: { id: true },
        _sum: { duracionMs: true, totalEncontrado: true },
      });

      expect(mockPrismaService.consultaLog.count).toHaveBeenCalledTimes(6);
    });

    it('should handle date filters correctly', async () => {
      const userId = 'test-user-id';
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');

      const mockAggregateResult = {
        _count: { id: 50 },
        _sum: { duracionMs: 62500, totalEncontrado: 25000 },
      };

      mockPrismaService.consultaLog.aggregate.mockResolvedValue(mockAggregateResult);
      mockPrismaService.consultaLog.count.mockResolvedValue(10);

      await (service as any).getUserConsultationStats(userId, dateFrom, dateTo);

      expect(mockPrismaService.consultaLog.aggregate).toHaveBeenCalledWith({
        where: {
          userId,
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _count: { id: true },
        _sum: { duracionMs: true, totalEncontrado: true },
      });
    });

    it('should return empty stats on error', async () => {
      const userId = 'test-user-id';

      mockPrismaService.consultaLog.aggregate.mockRejectedValue(new Error('Database error'));

      const result = await (service as any).getUserConsultationStats(userId);

      expect(result).toEqual({
        icsNormal: 0,
        icsAmnistia: 0,
        ecNormal: 0,
        ecAmnistia: 0,
        totalExitosas: 0,
        totalErrores: 0,
        totalConsultas: 0,
        promedioDuracionMs: undefined,
        totalAcumulado: undefined,
      });
    });
  });

  describe('getAllUsersLocationHistory with consultation stats', () => {
    it('should include consultation stats when requested', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser1',
          nombre: 'Test',
          apellido: 'User1',
        },
      ];

      const mockUserHistory = {
        userId: 'user1',
        username: 'testuser1',
        fullName: 'Test User1',
        locationHistory: [],
        metadata: {
          totalLocations: 0,
          activeLocations: 0,
          inactiveLocations: 0,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      };

      const mockConsultationStats: ConsultationStatsDto = {
        icsNormal: 10,
        icsAmnistia: 2,
        ecNormal: 5,
        ecAmnistia: 1,
        totalExitosas: 15,
        totalErrores: 3,
        totalConsultas: 18,
        promedioDuracionMs: 1200,
        totalAcumulado: 25000,
      };

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      
      // Mock getUserLocationHistory method
      jest.spyOn(service, 'getUserLocationHistory').mockResolvedValue(mockUserHistory);
      
      // Mock getUserConsultationStats method
      jest.spyOn(service as any, 'getUserConsultationStats').mockResolvedValue(mockConsultationStats);

      const result = await service.getAllUsersLocationHistory({
        includeConsultationStats: true,
        page: 1,
        limit: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].consultationStats).toEqual(mockConsultationStats);
    });

    it('should not include consultation stats when not requested', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'testuser1',
          nombre: 'Test',
          apellido: 'User1',
        },
      ];

      const mockUserHistory = {
        userId: 'user1',
        username: 'testuser1',
        fullName: 'Test User1',
        locationHistory: [],
        metadata: {
          totalLocations: 0,
          activeLocations: 0,
          inactiveLocations: 0,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      };

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      jest.spyOn(service, 'getUserLocationHistory').mockResolvedValue(mockUserHistory);

      const result = await service.getAllUsersLocationHistory({
        includeConsultationStats: false,
        page: 1,
        limit: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].consultationStats).toBeUndefined();
    });
  });
});