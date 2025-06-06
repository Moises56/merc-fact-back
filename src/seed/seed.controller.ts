import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('mercados')
  async seedMercados() {
    return await this.seedService.seedMercados();
  }
}
