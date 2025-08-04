# 🚀 Guía de Optimización de Rendimiento

## 📊 Análisis Actual del Sistema

Basado en el análisis del código y configuraciones actuales, se han identificado las siguientes áreas de mejora para optimizar los tiempos de respuesta:

---

## 🎯 Optimizaciones Implementadas Recientemente

### ✅ **Timeouts de Base de Datos**
- **ReadonlyDatabaseService**: Aumentado `connectionTimeout` a 60s y `requestTimeout` a 120s
- **Configuraciones de API**: Timeout aumentado a 120s en archivos de configuración
- **Resultado**: Reducción de errores ETIMEOUT en consultas complejas

### ✅ **Sistema de Cache**
- **ConsultaEcService**: Cache de 10 minutos implementado
- **ConsultaIcsService**: Cache de 10 minutos implementado
- **Resultado**: Mejora significativa en consultas repetidas

---

## 🔧 Optimizaciones Recomendadas

### 1. **Optimización de Base de Datos**

#### A. Índices Faltantes
```sql
-- Índices recomendados para mejorar performance
CREATE INDEX IX_facturas_localId_mes_anio ON facturas (localId, mes, anio);
CREATE INDEX IX_facturas_estado_fecha_vencimiento ON facturas (estado, fecha_vencimiento);
CREATE INDEX IX_audit_logs_userId_createdAt ON audit_logs (userId, createdAt);
CREATE INDEX IX_locales_mercadoId_estado ON locales (mercadoId, estado_local);
CREATE INDEX IX_users_role_isActive ON users (role, isActive);
```

#### B. Connection Pooling Optimizado
```typescript
// En readonly-database.service.ts - Configuración optimizada
pool: {
  max: 20,        // Aumentar de 10 a 20
  min: 5,         // Mantener conexiones mínimas
  idleTimeoutMillis: 60000,  // Aumentar timeout
  acquireTimeoutMillis: 30000, // Timeout para obtener conexión
},
```

### 2. **Optimización de Consultas**

#### A. Consultas Dashboard (Crítico)
```typescript
// Problema actual: Múltiples consultas secuenciales
// Solución: Consulta única optimizada

async getOptimizedStatistics(): Promise<DashboardStatisticsDto> {
  // Usar una sola consulta con CTEs para mejor performance
  const query = `
    WITH FinancialCTE AS (
      SELECT 
        SUM(CASE WHEN estado = 'PAGADA' THEN monto ELSE 0 END) as total_recaudado,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN monto ELSE 0 END) as total_pendiente,
        COUNT(*) as total_facturas
      FROM facturas
    ),
    EntityCTE AS (
      SELECT 
        (SELECT COUNT(*) FROM mercados WHERE isActive = 1) as total_mercados,
        (SELECT COUNT(*) FROM locales WHERE estado_local = 'ACTIVO') as total_locales_activos,
        (SELECT COUNT(*) FROM users WHERE isActive = 1) as total_usuarios
    )
    SELECT * FROM FinancialCTE, EntityCTE
  `;
  
  return this.prisma.$queryRaw(query);
}
```

#### B. Paginación Optimizada
```typescript
// Implementar cursor-based pagination para mejor performance
async findAllOptimized(cursor?: string, limit: number = 10) {
  const where = cursor ? { id: { gt: cursor } } : {};
  
  const items = await this.prisma.factura.findMany({
    where,
    take: limit + 1, // +1 para detectar si hay más páginas
    orderBy: { id: 'asc' },
    include: { /* relaciones necesarias */ }
  });
  
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  
  return {
    data,
    hasMore,
    nextCursor: hasMore ? data[data.length - 1].id : null
  };
}
```

### 3. **Cache Avanzado**

#### A. Redis Cache (Recomendado)
```bash
npm install @nestjs/cache-manager cache-manager-redis-store redis
```

```typescript
// cache.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 600, // 10 minutos
    }),
  ],
})
export class AppCacheModule {}
```

#### B. Cache Estratégico
```typescript
// Implementar cache en servicios críticos
@Injectable()
export class OptimizedDashboardService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
  ) {}

  @CacheKey('dashboard-stats')
  @CacheTTL(300) // 5 minutos
  async getStatistics() {
    // Lógica de consulta
  }
}
```

### 4. **Optimización de Consultas Externas**

#### A. Paralelización de Consultas ICS/EC
```typescript
// En lugar de consultas secuenciales
async consultarMultiple(requests: ConsultaRequest[]) {
  // Ejecutar consultas en paralelo con límite de concurrencia
  const results = await Promise.allSettled(
    requests.map(req => this.consultarSingle(req))
  );
  
  return results.map((result, index) => ({
    request: requests[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

### 5. **Monitoreo y Métricas**

#### A. Performance Interceptor
```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Log consultas lentas
          this.logger.warn(
            `Slow query detected: ${request.method} ${request.url} - ${duration}ms`
          );
        }
      })
    );
  }
}
```

#### B. Health Checks
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readonlyDb: ReadonlyDatabaseService
  ) {}

  @Get()
  async check() {
    const start = Date.now();
    
    try {
      // Test main database
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test readonly database
      await this.readonlyDb.executeQuery('SELECT 1');
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}
```

---

## 📈 Optimizaciones de Frontend

### 1. **Lazy Loading**
```typescript
// Implementar lazy loading en rutas
const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'facturas',
    loadChildren: () => import('./facturas/facturas.module').then(m => m.FacturasModule)
  }
];
```

### 2. **Virtual Scrolling**
```typescript
// Para listas grandes de facturas/locales
<cdk-virtual-scroll-viewport itemSize="50" class="viewport">
  <div *cdkVirtualFor="let item of items">{{item.name}}</div>
</cdk-virtual-scroll-viewport>
```

### 3. **OnPush Change Detection**
```typescript
@Component({
  selector: 'app-factura-list',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacturaListComponent {
  // Usar signals para mejor performance
  facturas = signal<Factura[]>([]);
}
```

---

## 🎯 Plan de Implementación

### **Fase 1: Optimizaciones Críticas (1-2 días)**
1. ✅ Implementar índices de base de datos
2. ✅ Optimizar connection pooling
3. ✅ Implementar performance interceptor

### **Fase 2: Cache Avanzado (2-3 días)**
1. ✅ Configurar Redis
2. ✅ Implementar cache en dashboard
3. ✅ Cache en consultas ICS/EC

### **Fase 3: Optimizaciones Avanzadas (3-5 días)**
1. ✅ Refactorizar consultas dashboard
2. ✅ Implementar cursor pagination
3. ✅ Paralelizar consultas externas

### **Fase 4: Monitoreo (1-2 días)**
1. ✅ Health checks
2. ✅ Métricas de performance
3. ✅ Alertas automáticas

---

## 📊 Métricas Esperadas

### **Antes de Optimizaciones**
- Dashboard: ~3-5 segundos
- Consultas ICS: ~30-60 segundos (con timeouts)
- Listados: ~2-3 segundos

### **Después de Optimizaciones**
- Dashboard: ~500ms-1s
- Consultas ICS: ~5-15 segundos
- Listados: ~300-500ms

---

## 🚨 Alertas y Monitoreo

### **Configurar Alertas Para:**
- Consultas > 5 segundos
- Errores de timeout
- Uso de memoria > 80%
- Conexiones de BD > 15
- Cache hit rate < 70%

### **Herramientas Recomendadas:**
- **APM**: New Relic, Datadog, o Sentry
- **Logs**: Winston + ELK Stack
- **Métricas**: Prometheus + Grafana

---

## 🔧 Comandos Útiles

```bash
# Analizar performance de consultas
npm run start:dev -- --inspect

# Monitorear memoria
node --max-old-space-size=4096 dist/main.js

# Profiling
node --prof dist/main.js

# Analizar bundle size (frontend)
npx webpack-bundle-analyzer dist/stats.json
```

---

## 📝 Notas Importantes

1. **Priorizar optimizaciones** basadas en métricas reales
2. **Implementar gradualmente** para evitar regresiones
3. **Monitorear constantemente** después de cada cambio
4. **Mantener balance** entre performance y mantenibilidad
5. **Documentar cambios** para el equipo

---

**🎯 Objetivo**: Reducir tiempos de respuesta en 60-80% y eliminar timeouts en consultas normales.