import { Module } from '@nestjs/common';
import { ConsultaEcService } from './consulta-ec.service';
import { ConsultaEcController } from './consulta-ec.controller';
import { ReadonlyDatabaseService } from './readonly-database.service';

@Module({
  controllers: [ConsultaEcController],
  providers: [ConsultaEcService, ReadonlyDatabaseService],
  exports: [ConsultaEcService, ReadonlyDatabaseService],
})
export class ConsultaEcModule {}
