import { Module } from '@nestjs/common';
import { ConsultasAuthController } from './consultas-auth.controller';
import { ConsultaIcsModule } from '../../consulta-ics/consulta-ics.module';
import { ConsultaEcModule } from '../../consulta-ec/consulta-ec.module';
import { UserStatsModule } from '../user-stats/user-stats.module';

@Module({
  imports: [ConsultaIcsModule, ConsultaEcModule, UserStatsModule],
  controllers: [ConsultasAuthController],
})
export class ConsultasAuthModule {}
