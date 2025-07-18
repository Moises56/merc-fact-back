import { Module } from '@nestjs/common';
import { ReportesBasicController } from './reportes-basic.controller';
import { ReportesDemoController } from './reportes-demo.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportesBasicController, ReportesDemoController],
  providers: [],
  exports: [],
})
export class ReportesModule {}
