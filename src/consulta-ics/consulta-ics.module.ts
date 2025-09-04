import { Module } from '@nestjs/common';
import { ConsultaIcsService } from './consulta-ics.service';
import { ConsultaIcsController } from './consulta-ics.controller';
import { ReadonlyDatabaseService } from '../consulta-ec/readonly-database.service';
import { UserStatsModule } from '../api/user-stats/user-stats.module';
import { ConsultaEcModule } from '../consulta-ec/consulta-ec.module';

@Module({
  imports: [UserStatsModule, ConsultaEcModule],
  controllers: [ConsultaIcsController],
  providers: [ConsultaIcsService],
  exports: [ConsultaIcsService],
})
export class ConsultaIcsModule {}