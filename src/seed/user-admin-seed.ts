import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserStatsSeederService } from '../api/user-stats/user-stats-seeder.service';

async function runSeed() {
  console.log('🌱 Iniciando proceso de seed para USER-ADMIN y UserStats...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seederService = app.get(UserStatsSeederService);
    await seederService.seedUserAdminAndLocations();

    console.log('✅ Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void runSeed();
