import { Module } from '@nestjs/common';
import { MercadosService } from './mercados.service';
import { MercadosController } from './mercados.controller';

@Module({
  controllers: [MercadosController],
  providers: [MercadosService],
})
export class MercadosModule {}
