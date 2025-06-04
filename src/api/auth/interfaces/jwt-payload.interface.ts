import { Role } from '../../../common/enums';

export interface JwtPayload {
  id: string;
  correo: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    correo: string;
    nombre: string;
    apellido: string;
    role: Role;
  };
  access_token: string;
  refresh_token: string;
}
