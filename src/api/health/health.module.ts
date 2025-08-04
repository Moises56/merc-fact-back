import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ConsultaEcModule } from '../../consulta-ec/consulta-ec.module';

@Module({
  imports: [PrismaModule, ConsultaEcModule],
  controllers: [HealthController],
})
export class HealthModule {}