// Invoice-Fact API Endpoints Configuration for Angular 19
// Generated for NestJS Invoice-fact API system

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
  BASE_URL: 'http://localhost:3000/api',
  
  // API Version
  VERSION: 'v1',
  
  // Timeout for requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const API_ENDPOINTS: ApiEndpoints = {
  // 🔐 Authentication Endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register', 
    logout: '/auth/logout',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    refresh: '/auth/refresh'
  },

  // 👥 Users Management Endpoints
  users: {
    getAll: '/users',
    getById: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    search: '/users'
  },

  // 🏪 Markets (Mercados) Endpoints
  mercados: {
    getAll: '/mercados',
    getById: (id: string) => `/mercados/${id}`,
    create: '/mercados',
    update: (id: string) => `/mercados/${id}`,
    delete: (id: string) => `/mercados/${id}`,
    search: '/mercados',
    stats: '/mercados/stats',
    activate: (id: string) => `/mercados/${id}/activate`,
    deactivate: (id: string) => `/mercados/${id}/deactivate`
  },

  // 🏬 Locals (Locales) Endpoints
  locales: {
    getAll: '/locales',
    getById: (id: string) => `/locales/${id}`,
    create: '/locales',
    update: (id: string) => `/locales/${id}`,
    delete: (id: string) => `/locales/${id}`,
    getByMarket: (marketId: string) => `/locales/by-market/${marketId}`,
    search: '/locales'
  },

  // 🧾 Invoices (Facturas) Endpoints
  facturas: {
    getAll: '/facturas',
    getById: (id: string) => `/facturas/${id}`,
    create: '/facturas',
    update: (id: string) => `/facturas/${id}`,
    delete: (id: string) => `/facturas/${id}`,
    getByLocal: (localId: string) => `/facturas/by-local/${localId}`,
    pay: (id: string) => `/facturas/${id}/pay`,
    stats: '/facturas/stats',
    search: '/facturas'
  },

  // 📊 Audit Endpoints
  audit: {
    getLogs: '/audit/logs',
    getLogById: (id: string) => `/audit/logs/${id}`,
    getStats: '/audit/stats',
    getLogsByUser: (userId: string) => `/audit/users/${userId}`,
    getLogsByEntity: (entityType: string) => `/audit/entities/${entityType}`
  },

  // 🌱 Seed Data Endpoints
  seed: {
    execute: '/seed',
    clean: '/seed'
  }
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
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return filteredParams ? `?${filteredParams}` : '';
}

// Helper function to build URL with query parameters
export function buildApiUrlWithParams(endpoint: string, params?: QueryParams): string {
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
  DELETE = 'DELETE'
}

// User Roles enum
export enum UserRole {
  ADMIN = 'ADMIN',
  MARKET = 'MARKET',
  USER = 'USER',
  AUDITOR = 'AUDITOR'
}

// Market States enum
export enum EstadoMercado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  MANTENIMIENTO = 'MANTENIMIENTO'
}

// Local States enum
export enum EstadoLocal {
  DISPONIBLE = 'DISPONIBLE',
  OCUPADO = 'OCUPADO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  RESERVADO = 'RESERVADO'
}

// Local Types enum
export enum TipoLocal {
  COMERCIAL = 'COMERCIAL',
  GASTRONIMICO = 'GASTRONIMICO',
  SERVICIOS = 'SERVICIOS',
  OTROS = 'OTROS'
}

// Invoice States enum
export enum EstadoFactura {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  ANULADA = 'ANULADA'
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
  EstadoFactura
};
