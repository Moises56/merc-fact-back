import { SetMetadata } from '@nestjs/common';
import { AUDIT_LOG, AuditLogOptions } from '../audit/audit.interceptor';

export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG, options);
