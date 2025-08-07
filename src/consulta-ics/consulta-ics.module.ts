import { Module } from '@nestjs/common';
import { ConsultaIcsService } from './consulta-ics.service';
import { ConsultaIcsController } from './consulta-ics.controller';
import { ReadonlyDatabaseService } from '../consulta-ec/readonly-database.service';
import { UserStatsModule } from '../api/user-stats/user-stats.module';

@Module({
  imports: [UserStatsModule],
  controllers: [ConsultaIcsController],
  providers: [ConsultaIcsService, ReadonlyDatabaseService],
  exports: [ConsultaIcsService, ReadonlyDatabaseService],
})
export class ConsultaIcsModule {}