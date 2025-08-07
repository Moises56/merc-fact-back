import { Module } from '@nestjs/common';
import { ConsultaEcService } from './consulta-ec.service';
import { ConsultaEcController } from './consulta-ec.controller';
import { ReadonlyDatabaseService } from './readonly-database.service';
import { UserStatsModule } from '../api/user-stats/user-stats.module';

@Module({
  imports: [UserStatsModule],
  controllers: [ConsultaEcController],
  providers: [ConsultaEcService, ReadonlyDatabaseService],
  exports: [ConsultaEcService, ReadonlyDatabaseService],
})
export class ConsultaEcModule {}
