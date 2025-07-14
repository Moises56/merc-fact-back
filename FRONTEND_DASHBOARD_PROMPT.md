# Prompt para Frontend Ionic Angular - Dashboard Mejorado

## Contexto
Se ha mejorado significativamente el endpoint `/api/dashboard/statistics` del backend NestJS con métricas avanzadas, cálculos financieros detallados y analytics de rendimiento. Necesito implementar la integración completa en el frontend Ionic Angular.

## Endpoint Mejorado
- **URL**: `GET /api/dashboard/statistics`
- **Autenticación**: Bearer Token (JWT)
- **Mejoras implementadas**: Métricas financieras avanzadas, KPIs de rendimiento, analytics de facturación, métricas de entidades con cálculos automáticos

## Estructura de Respuesta Mejorada

### FinancialMetricsDto
```typescript
{
  monthlyRevenue: number;                    // Recaudación del mes actual
  annualRevenue: number;                     // Recaudación del año actual
  totalRevenue: number;                      // Total histórico
  averageMonthlyRevenue: number;             // Promedio últimos 12 meses
  monthlyGrowthPercentage: number;           // Crecimiento mensual %
  expectedMonthlyRevenue: number;            // Recaudación esperada mensual
  expectedVsActualPercentage: number;        // % cumplimiento expectativas
  revenueByMarket: MarketRevenueDto[];       // Desglose por mercado
  topRevenueLocals: LocalRevenueDto[];       // Top 10 locales
}
```

### InvoiceMetricsDto (Mejorado)
```typescript
{
  overdue: number;                           // Facturas vencidas
  paid: number;                              // Facturas pagadas
  pending: number;                           // Facturas pendientes
  cancelled: number;                         // Facturas anuladas
  generated: number;                         // Total generadas
  paymentRate: number;                       // % de pago
  overdueRate: number;                       // % de morosidad
  collectionEfficiency: number;              // Eficiencia cobranza %
  pendingAmount: number;                     // Monto pendiente
  overdueAmount: number;                     // Monto vencido
}
```

### EntityMetricsDto (Mejorado)
```typescript
{
  totalMarkets: number;                      // Total mercados
  totalLocals: number;                       // Total locales
  totalUsers: number;                        // Total usuarios
  activeMarkets: number;                     // Mercados activos
  activeLocals: number;                      // Locales activos
  activeUsers: number;                       // Usuarios activos
  occupancyRate: number;                     // Tasa ocupación %
  averageLocalsPerMarket: number;            // Promedio locales/mercado
  localsWithPaymentsThisMonth: number;       // Locales con pagos mes actual
}
```

### PerformanceMetricsDto (Nuevo)
```typescript
{
  topMarket: {
    name: string;
    revenue: number;
  };
  topLocal: {
    name: string;
    number: string;
    revenue: number;
    marketName: string;
  };
  peakPaymentDay: number;                    // Día del mes con más pagos
  averageDaysToPayment: number;              // Promedio días para pago
}
```

### MarketRevenueDto (Expandido)
```typescript
{
  marketId: string;
  marketName: string;
  total: number;                             // Total recaudado
  monthly: number;                           // Recaudación mensual
  annual: number;                            // Recaudación anual
  totalLocals: number;                       // Número de locales
  paidInvoices: number;                      // Facturas pagadas
  averageRevenuePerLocal: number;            // Promedio por local
  percentageOfTotalRevenue: number;          // % del total
}
```

## Requerimientos para Implementación

### 1. Service (dashboard.service.ts)
Crear/actualizar el servicio para consumir el endpoint mejorado:

```typescript
// Necesito que implementes:
- Interfaz TypeScript que refleje la estructura completa de respuesta
- Método getDashboardStatistics() con manejo de errores robusto
- Formateo de números y porcentajes para display
- Cache temporal para evitar llamadas excesivas
- Loading states y error handling
- Transformación de datos para gráficos (Chart.js/ng2-charts)
```

### 2. Dashboard Page (dashboard.page.ts)
Componente principal del dashboard:

```typescript
// Implementar:
- Carga inicial de datos con spinner
- Refresh automático cada 5 minutos
- Pull-to-refresh manual
- Estados de loading, error y success
- Navegación a páginas detalle
- Filtros por período (mensual/anual)
- Exportación de datos a PDF/Excel
```

### 3. Dashboard Page Template (dashboard.page.html)
UI/UX mejorada con Ionic components:

```html
<!-- Necesito que diseñes: -->
- Header con título y botón refresh
- Cards organizadas por categorías de métricas
- Gráficos interactivos (barras, donut, líneas)
- Lista expansible de mercados con revenue
- Top locales con ranking visual
- Indicadores KPI con colores semafóricos
- Progress bars para tasas y porcentajes
- Skeleton loaders durante carga
- Alert/toast para errores
```

### 4. Componentes Reutilizables
Crear componentes modulares:

#### MetricCard Component
```typescript
// Inputs: title, value, subtitle, icon, color, trend
// Mostrar métricas con formato consistente
// Animaciones de entrada
// Click navigation a detalle
```

#### ChartComponent
```typescript
// Gráficos para:
- Revenue por mercado (horizontal bar)
- Distribución facturas (donut)
- Tendencia mensual (line chart)
- Top locales (ranking bars)
```

#### PerformanceIndicator Component
```typescript
// KPIs con:
- Valor actual
- Meta/objetivo
- Porcentaje cumplimiento
- Color según rendimiento
- Tooltip explicativo
```

### 5. Styles (dashboard.page.scss)
Diseño responsive y atractivo:

```scss
// Implementar:
- Grid responsivo para cards
- Colores corporativos para métricas
- Animaciones suaves
- Sombras y elevaciones
- Typography consistente
- Dark/light mode support
- Estados hover/active
```

### 6. Navigation & Routing
Navegación desde dashboard:

```typescript
// Rutas a implementar:
- /dashboard/markets/:id (detalle mercado)
- /dashboard/locals/:id (detalle local)
- /dashboard/invoices (gestión facturas)
- /dashboard/reports (reportes detallados)
```

### 7. Error Handling & UX
Manejo robusto de errores:

```typescript
// Implementar:
- Retry automático en caso de fallo
- Mensaje de error user-friendly
- Fallback a datos cached
- Offline mode indicator
- Network status detection
```

### 8. Performance Optimizations
Optimizaciones necesarias:

```typescript
// Aplicar:
- OnPush change detection
- Lazy loading de gráficos
- Virtual scrolling para listas largas
- Image lazy loading
- Bundle splitting
- Service worker para cache
```

### 9. Testing
Casos de test necesarios:

```typescript
// Unit tests para:
- Service methods
- Component logic
- Data transformations
- Error scenarios

// E2E tests para:
- Dashboard load complete
- Navigation flows
- Refresh functionality
- Responsive behavior
```

### 10. Accessibility
Implementar accesibilidad:

```typescript
// Añadir:
- ARIA labels
- Screen reader support
- Keyboard navigation
- High contrast mode
- Font size scaling
```

## Métricas Clave a Destacar Visualmente

### Financieras
- **Total Revenue**: Número grande prominente
- **Monthly Growth**: Badge con porcentaje y flecha
- **Expected vs Actual**: Progress bar con color
- **Revenue by Market**: Horizontal bar chart

### Operacionales
- **Payment Rate**: Circular progress (verde si >80%)
- **Overdue Rate**: Alert badge (rojo si >20%)
- **Occupancy Rate**: Gauge chart
- **Collection Efficiency**: KPI card con trend

### Performance
- **Top Market**: Destacar con card especial
- **Peak Payment Day**: Calendar visualization
- **Average Days to Payment**: Numeric indicator

## Consideraciones Técnicas

### Estado Management
```typescript
// Considerar implementar:
- NgRx para estado global del dashboard
- Entity state para mercados/locales
- Loading/error states centralizados
```

### Caching Strategy
```typescript
// Cache policies:
- Dashboard data: 5 minutos
- Market details: 10 minutos
- User preferences: Persistent
```

### Real-time Updates
```typescript
// Opcional: WebSocket para:
- Notificaciones de pagos
- Updates automáticos de métricas
- Alerts de morosidad
```

## Deliverables Esperados

1. **dashboard.service.ts** - Servicio completo con interfaces
2. **dashboard.page.ts** - Componente principal con lógica
3. **dashboard.page.html** - Template responsiva y atractiva
4. **dashboard.page.scss** - Estilos modernos
5. **Componentes auxiliares** - MetricCard, Chart, etc.
6. **dashboard.module.ts** - Módulo con dependencias
7. **Routing updates** - Navegación integrada
8. **Error handling** - Manejo robusto de errores

## Notas Adicionales

- **Compatibilidad**: Ionic 7+ con Angular 16+
- **Charts**: Usar ng2-charts o @ionic/angular
- **Icons**: Ionicons para consistencia
- **Format**: Usar pipes para números/fechas/moneda
- **Responsive**: Mobile-first approach
- **Performance**: Optimizar para dispositivos móviles

¿Podrías implementar esta funcionalidad completa para el dashboard mejorado?
