import { Test, TestingModule } from '@nestjs/testing';
import { UserStatsService } from '../user-stats.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  UserLocationHistoryResponseDto,
  GetUserLocationHistoryDto,
} from '../dto/user-location.dto';

describe('UserStatsService - Location History', () => {
  let service: UserStatsService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    nombre: 'Test',
    apellido: 'User',
  };

  const mockLocations = [
    {
      id: 'loc-1',
      userId: 'user-123',
      locationName: 'Oficina Central',
      locationCode: 'OFC-001',
      description: 'Oficina principal',
      isActive: false,
      assignedAt: new Date('2024-01-01T08:00:00Z'),
      assignedBy: 'admin',
      createdAt: new Date('2024-01-01T08:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: 'loc-2',
      userId: 'user-123',
      locationName: 'Sucursal Norte',
      locationCode: 'SUC-001',
      description: 'Sucursal del norte',
      isActive: true,
      assignedAt: new Date('2024-01-15T10:00:00Z'),
      assignedBy: 'supervisor',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
  ];

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
      ],
    }).compile();

    service = module.get<UserStatsService>(UserStatsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserLocationHistory', () => {
    it('should return user location history successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userLocation.findMany
        .mockResolvedValueOnce(mockLocations) // Primera llamada para ubicaciones paginadas
        .mockResolvedValueOnce(mockLocations); // Segunda llamada para todas las ubicaciones
      mockPrismaService.userLocation.count.mockResolvedValue(2);

      const options: GetUserLocationHistoryDto = {
        activeOnly: false,
        sortOrder: 'desc',
        limit: 50,
        page: 1,
      };

      // Act
      const result = await service.getUserLocationHistory('user-123', options);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.username).toBe('testuser');
      expect(result.locationHistory).toHaveLength(2);
      expect(result.totalLocations).toBe(2);
      expect(result.currentLocation).toBeDefined();
      expect(result.currentLocation?.isActive).toBe(true);
      expect(result.firstAssignedAt).toEqual(new Date('2024-01-01T08:00:00Z'));
      expect(result.lastAssignedAt).toEqual(new Date('2024-01-15T10:00:00Z'));
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getUserLocationHistory('nonexistent-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter active locations only when activeOnly is true', async () => {
      // Arrange
      const activeLocation = mockLocations.filter((loc) => loc.isActive);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userLocation.findMany
        .mockResolvedValueOnce(activeLocation)
        .mockResolvedValueOnce(mockLocations);
      mockPrismaService.userLocation.count.mockResolvedValue(1);

      const options: GetUserLocationHistoryDto = {
        activeOnly: true,
      };

      // Act
      const result = await service.getUserLocationHistory('user-123', options);

      // Assert
      expect(mockPrismaService.userLocation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            isActive: true,
          }),
        }),
      );
      expect(result.locationHistory).toHaveLength(1);
      expect(result.locationHistory[0].isActive).toBe(true);
    });

    it('should calculate duration days correctly', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userLocation.findMany
        .mockResolvedValueOnce(mockLocations)
        .mockResolvedValueOnce(mockLocations);
      mockPrismaService.userLocation.count.mockResolvedValue(2);

      // Act
      const result = await service.getUserLocationHistory('user-123');

      // Assert
      const inactiveLocation = result.locationHistory.find(
        (loc) => !loc.isActive,
      );
      const activeLocation = result.locationHistory.find((loc) => loc.isActive);

      expect(inactiveLocation?.durationDays).toBe(14); // 14 días entre 01-01 y 15-01
      expect(activeLocation?.durationDays).toBeGreaterThan(0); // Días desde asignación hasta ahora
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userLocation.findMany
        .mockResolvedValueOnce([mockLocations[0]]) // Solo primer elemento
        .mockResolvedValueOnce(mockLocations);
      mockPrismaService.userLocation.count.mockResolvedValue(2);

      const options: GetUserLocationHistoryDto = {
        limit: 1,
        page: 1,
      };

      // Act
      const result = await service.getUserLocationHistory('user-123', options);

      // Assert
      expect(mockPrismaService.userLocation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 1,
        }),
      );
      expect(result.locationHistory).toHaveLength(1);
    });
  });

  describe('getAllUsersLocationHistory', () => {
    const mockUsers = [
      {
        id: 'user-1',
        username: 'user1',
        nombre: 'User',
        apellido: 'One',
      },
      {
        id: 'user-2',
        username: 'user2',
        nombre: 'User',
        apellido: 'Two',
      },
    ];

    it('should return location history for all users', async () => {
      // Arrange
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      // Mock getUserLocationHistory calls
      const mockHistoryResponse: UserLocationHistoryResponseDto = {
        userId: 'user-1',
        username: 'user1',
        nombre: 'User',
        apellido: 'One',
        currentLocation: undefined,
        locationHistory: [],
        totalLocations: 0,
        firstAssignedAt: undefined,
        lastAssignedAt: undefined,
      };

      jest
        .spyOn(service, 'getUserLocationHistory')
        .mockResolvedValue(mockHistoryResponse);

      const options: GetUserLocationHistoryDto = {
        activeOnly: false,
        limit: 50,
        page: 1,
      };

      // Act
      const result = await service.getAllUsersLocationHistory(options);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(service.getUserLocationHistory).toHaveBeenCalledTimes(2);
    });

    it('should filter users with active locations when activeOnly is true', async () => {
      // Arrange
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      jest.spyOn(service, 'getUserLocationHistory').mockResolvedValue({
        userId: 'user-1',
        username: 'user1',
        nombre: 'User',
        apellido: 'One',
        currentLocation: undefined,
        locationHistory: [],
        totalLocations: 0,
        firstAssignedAt: undefined,
        lastAssignedAt: undefined,
      });

      const options: GetUserLocationHistoryDto = {
        activeOnly: true,
      };

      // Act
      await service.getAllUsersLocationHistory(options);

      // Assert
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userLocations: {
              some: { isActive: true },
            },
          },
        }),
      );
    });

    it('should handle errors gracefully and continue with other users', async () => {
      // Arrange
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      jest
        .spyOn(service, 'getUserLocationHistory')
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({
          userId: 'user-2',
          username: 'user2',
          nombre: 'User',
          apellido: 'Two',
          currentLocation: undefined,
          locationHistory: [],
          totalLocations: 0,
          firstAssignedAt: undefined,
          lastAssignedAt: undefined,
        });

      // Act
      const result = await service.getAllUsersLocationHistory();

      // Assert
      expect(result).toHaveLength(1); // Solo el segundo usuario exitoso
      expect(result[0].userId).toBe('user-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no location history', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userLocation.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.userLocation.count.mockResolvedValue(0);

      // Act
      const result = await service.getUserLocationHistory('user-123');

      // Assert
      expect(result.locationHistory).toHaveLength(0);
      expect(result.totalLocations).toBe(0);
      expect(result.currentLocation).toBeUndefined();
      expect(result.firstAssignedAt).toBeUndefined();
      expect(result.lastAssignedAt).toBeUndefined();
    });

    it('should handle user with only inactive locations', async () => {
      // Arrange
      const inactiveLocations = mockLocations.map((loc) => ({
        ...loc,
        isActive: false,
      }));
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userLocation.findMany
        .mockResolvedValueOnce(inactiveLocations)
        .mockResolvedValueOnce(inactiveLocations);
      mockPrismaService.userLocation.count.mockResolvedValue(2);

      // Act
      const result = await service.getUserLocationHistory('user-123');

      // Assert
      expect(result.currentLocation).toBeUndefined();
      expect(result.locationHistory.every((loc) => !loc.isActive)).toBe(true);
    });
  });
});
