// Invoice-Fact API Endpoints Configuration for Angular 19
// Generated for NestJS Invoice-fact API system - CORRECTED VERSION

export interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    logout: string;
    profile: string;
    changePassword: string;
    refresh: string;
  };
  users: {
    getAll: string;
    getById: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    search: string;
  };
  mercados: {
    getAll: string;
    getById: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    search: string;
    stats: string;
    activate: (id: string) => string;
    deactivate: (id: string) => string;
  };
  locales: {
    getAll: string;
    getById: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    getByMarket: (marketId: string) => string;
    search: string;
  };
  facturas: {
    getAll: string;
    getById: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    getByLocal: (localId: string) => string;
    pay: (id: string) => string;
    stats: string;
    search: string;
  };
  audit: {
    getLogs: string;
    getLogById: (id: string) => string;
    getStats: string;
    getLogsByUser: (userId: string) => string;
    getLogsByEntity: (entityType: string) => string;
  };
  seed: {
    execute: string;
    clean: string;
  };
}

export const API_CONFIG = {
  // Base URL - Update this according to your environment
  BASE_URL: 'http://localhost:3000',
  
  // API Version
  VERSION: 'v1',
  
  // Timeout for requests (in milliseconds)
  TIMEOUT: 120000,
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const API_ENDPOINTS: ApiEndpoints = {
  // 🔐 Authentication Endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password',
    refresh: '/api/auth/refresh',
  },

  // 👥 Users Management Endpoints
  users: {
    getAll: '/api/users',
    getById: (id: string) => `/api/users/${id}`,
    create: '/api/users',
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
    search: '/api/users',
  },

  // 🏪 Markets (Mercados) Endpoints
  mercados: {
    getAll: '/api/mercados',
    getById: (id: string) => `/api/mercados/${id}`,
    create: '/api/mercados',
    update: (id: string) => `/api/mercados/${id}`,
    delete: (id: string) => `/api/mercados/${id}`,
    search: '/api/mercados',
    stats: '/api/mercados/stats',
    activate: (id: string) => `/api/mercados/${id}/activate`,
    deactivate: (id: string) => `/api/mercados/${id}/deactivate`,
  },

  // 🏬 Locals (Locales) Endpoints
  locales: {
    getAll: '/api/locales',
    getById: (id: string) => `/api/locales/${id}`,
    create: '/api/locales',
    update: (id: string) => `/api/locales/${id}`,
    delete: (id: string) => `/api/locales/${id}`,
    getByMarket: (marketId: string) => `/api/locales/by-market/${marketId}`,
    search: '/api/locales',
  },

  // 🧾 Invoices (Facturas) Endpoints
  facturas: {
    getAll: '/api/facturas',
    getById: (id: string) => `/api/facturas/${id}`,
    create: '/api/facturas',
    update: (id: string) => `/api/facturas/${id}`,
    delete: (id: string) => `/api/facturas/${id}`,
    getByLocal: (localId: string) => `/api/facturas/by-local/${localId}`,
    pay: (id: string) => `/api/facturas/${id}/pay`,
    stats: '/api/facturas/stats',
    search: '/api/facturas',
  },

  // 📊 Audit Endpoints (CORRECTED PATHS)
  audit: {
    getLogs: '/api/audit/logs',
    getLogById: (id: string) => `/api/audit/logs/${id}`,
    getStats: '/api/audit/stats',
    getLogsByUser: (userId: string) => `/api/audit/users/${userId}`,
    getLogsByEntity: (entityType: string) => `/api/audit/entities/${entityType}`,
  },

  // 🌱 Seed Data Endpoints
  seed: {
    execute: '/seed',
    clean: '/seed',
  },
};

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Helper function for query parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

export function buildQueryString(params: QueryParams): string {
  const filteredParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

  return filteredParams ? `?${filteredParams}` : '';
}

// Helper function to build URL with query parameters
export function buildApiUrlWithParams(
  endpoint: string,
  params?: QueryParams,
): string {
  const baseUrl = buildApiUrl(endpoint);
  const queryString = params ? buildQueryString(params) : '';
  return `${baseUrl}${queryString}`;
}

// HTTP Methods enum
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

// User Roles enum
export enum UserRole {
  ADMIN = 'ADMIN',
  MARKET = 'MARKET',
  USER = 'USER',
  AUDITOR = 'AUDITOR',
}

// Market States enum
export enum EstadoMercado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

// Local States enum
export enum EstadoLocal {
  DISPONIBLE = 'DISPONIBLE',
  OCUPADO = 'OCUPADO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  RESERVADO = 'RESERVADO',
}

// Local Types enum
export enum TipoLocal {
  COMERCIAL = 'COMERCIAL',
  GASTRONIMICO = 'GASTRONIMICO',
  SERVICIOS = 'SERVICIOS',
  OTROS = 'OTROS',
}

// Invoice States enum
export enum EstadoFactura {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  ANULADA = 'ANULADA',
}

// Common response interfaces
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    role: UserRole;
    isActive: boolean;
  };
}

// DTOs for requests
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateMercadoDto {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  horarioApertura?: string;
  horarioCierre?: string;
  descripcion?: string;
  capacidadLocales?: number;
  fechaApertura?: string;
  estado?: EstadoMercado;
}

export interface UpdateMercadoDto {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  horarioApertura?: string;
  horarioCierre?: string;
  descripcion?: string;
  capacidadLocales?: number;
  estado?: EstadoMercado;
}

export interface CreateLocalDto {
  numeroLocal: string;
  tipoLocal: TipoLocal;
  area: number;
  descripcion?: string;
  estado?: EstadoLocal;
  mercadoId: string;
  precioAlquiler?: number;
  fechaDisponibilidad?: string;
}

export interface UpdateLocalDto {
  numeroLocal?: string;
  tipoLocal?: TipoLocal;
  area?: number;
  descripcion?: string;
  estado?: EstadoLocal;
  precioAlquiler?: number;
  fechaDisponibilidad?: string;
}

export interface CreateFacturaDto {
  localId: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monto: number;
  descripcion?: string;
  estado?: EstadoFactura;
  conceptos?: string;
}

export interface UpdateFacturaDto {
  numeroFactura?: string;
  fechaVencimiento?: string;
  monto?: number;
  descripcion?: string;
  estado?: EstadoFactura;
  conceptos?: string;
}

export interface PayFacturaDto {
  metodoPago: string;
  fechaPago?: string;
  referenciaPago?: string;
  observaciones?: string;
}

// Usage Examples:

// Example 1: Get all markets with pagination
// const url = buildApiUrlWithParams(API_ENDPOINTS.mercados.getAll, { page: 1, limit: 10 });

// Example 2: Get specific market by ID
// const url = buildApiUrl(API_ENDPOINTS.mercados.getById('uuid-here'));

// Example 3: Search markets with filters
// const url = buildApiUrlWithParams(API_ENDPOINTS.mercados.search, {
//   search: 'central',
//   estado: EstadoMercado.ACTIVO,
//   sort: 'nombre',
//   order: 'asc'
// });

// Example 4: Create a new market
// const url = buildApiUrl(API_ENDPOINTS.mercados.create);
// const body: CreateMercadoDto = { ... };

// Example 5: Update market
// const url = buildApiUrl(API_ENDPOINTS.mercados.update('uuid-here'));
// const body: UpdateMercadoDto = { ... };

// Example 6: Get audit logs
// const url = buildApiUrlWithParams(API_ENDPOINTS.audit.getLogs, { page: 1, limit: 20 });

// Example 7: Get audit logs by user
// const url = buildApiUrl(API_ENDPOINTS.audit.getLogsByUser('user-uuid'));

// Example 8: Get audit logs by entity type
// const url = buildApiUrl(API_ENDPOINTS.audit.getLogsByEntity('mercados'));

export default {
  API_CONFIG,
  API_ENDPOINTS,
  buildApiUrl,
  buildApiUrlWithParams,
  buildQueryString,
  HttpMethod,
  UserRole,
  EstadoMercado,
  EstadoLocal,
  TipoLocal,
  EstadoFactura,
};
