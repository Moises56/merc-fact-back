import { Module } from '@nestjs/common';
import { UserStatsController } from './user-stats.controller';
import { UserStatsService } from './user-stats.service';
import { UserStatsSeederService } from './user-stats-seeder.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserStatsController],
  providers: [UserStatsService, UserStatsSeederService],
  exports: [UserStatsService, UserStatsSeederService],
})
export class UserStatsModule {}
