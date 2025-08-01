import { IsOptional, IsString, ValidateIf, IsNotEmpty } from 'class-validator';

export class GetConsultaICSDto {
  @ValidateIf((o) => !o.dni)
  @IsNotEmpty({ message: 'Debe proporcionar al menos ics o dni/rtn' })
  @IsString()
  ics?: string; // Número de empresa ICS (ej: ICS-107444)

  @ValidateIf((o) => !o.ics)
  @IsNotEmpty({ message: 'Debe proporcionar al menos ics o dni/rtn' })
  @IsString()
  dni?: string; // DNI (13 dígitos) o RTN (14 dígitos) - validación flexible


}