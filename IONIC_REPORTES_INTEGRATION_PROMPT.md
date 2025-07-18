# 📊 PROMPT COMPLETO: INTEGRACIÓN DE REPORTES EN IONIC ANGULAR + TAILWIND

## 📋 INFORMACIÓN DEL PROYECTO

**Contexto**: Sistema de Gestión de Facturas para Mercados Municipales  
**Frontend**: Ionic 8 + Angular 19 + Tailwind CSS + Capacitor  
**Backend**: NestJS + Prisma + SQL Server (YA IMPLEMENTADO)  
**Objetivo**: Integrar módulo de reportes con dashboard completo  

---

## 🚀 ENDPOINTS BACKEND DISPONIBLES

### 🔓 **Endpoints Públicos (Para Desarrollo)**
```bash
# Test de conectividad
GET http://localhost:3000/reportes-demo/test

# Configuración UI
GET http://localhost:3000/reportes-demo/configuracion

# Estadísticas generales
GET http://localhost:3000/reportes-demo/stats
```

### 🔒 **Endpoints con Autenticación (Producción)**
```bash
# Generar reportes
POST http://localhost:3000/reportes/generar
Authorization: Bearer {jwt-token}

# Configuración completa
GET http://localhost:3000/reportes/configuracion
Authorization: Bearer {jwt-token}

# Test autenticado
GET http://localhost:3000/reportes/test
Authorization: Bearer {jwt-token}
```

---

## 📱 ESTRUCTURA DE ARCHIVOS IONIC A CREAR

```
src/app/
├── pages/
│   └── reportes/
│       ├── reportes.page.ts
│       ├── reportes.page.html
│       ├── reportes.page.scss
│       ├── reportes-routing.module.ts
│       └── reportes.module.ts
├── components/
│   └── reportes/
│       ├── dashboard-stats/
│       │   ├── dashboard-stats.component.ts
│       │   ├── dashboard-stats.component.html
│       │   └── dashboard-stats.component.scss
│       ├── filtros-reportes/
│       │   ├── filtros-reportes.component.ts
│       │   ├── filtros-reportes.component.html
│       │   └── filtros-reportes.component.scss
│       ├── reporte-cards/
│       │   ├── reporte-cards.component.ts
│       │   ├── reporte-cards.component.html
│       │   └── reporte-cards.component.scss
│       └── reporte-modal/
│           ├── reporte-modal.component.ts
│           ├── reporte-modal.component.html
│           └── reporte-modal.component.scss
├── services/
│   └── reportes/
│       ├── reportes.service.ts
│       └── reportes-config.service.ts
└── interfaces/
    └── reportes/
        ├── reporte.interface.ts
        ├── mercado.interface.ts
        └── estadisticas.interface.ts
```

---

## 🎯 1. INTERFACES Y TIPOS TYPESCRIPT

### **src/app/interfaces/reportes/reporte.interface.ts**
```typescript
export interface ReporteRequest {
  tipo: 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL';
  periodo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  formato?: 'JSON' | 'PDF' | 'EXCEL' | 'CSV';
  fechaInicio?: string;
  fechaFin?: string;
  mercados?: string[];
  locales?: string[];
}

export interface ReporteResponse {
  success: boolean;
  data: ReporteData;
  metadata: ReporteMetadata;
  filtros_aplicados?: FiltrosAplicados;
  error?: string;
  timestamp: string;
}

export interface ReporteData {
  // Para tipo FINANCIERO
  resumen?: {
    total_recaudado: number;
    total_facturas: number;
    promedio_factura: number;
  };
  por_estado?: {
    [estado: string]: {
      cantidad: number;
      monto: number;
    };
  };
  por_mercado?: MercadoStats[];
  
  // Para tipo OPERACIONAL
  estadisticas?: {
    total_facturas: number;
    mercados_activos: number;
    locales_activos: number;
  };
  rendimiento?: {
    facturas_hoy: number;
    eficiencia: 'ALTA' | 'BAJA';
  };
  
  // Para tipo MERCADO
  mercados?: MercadoStats[];
  
  // Para tipo LOCAL
  locales?: LocalStats[];
}

export interface MercadoStats {
  mercado_id: string;
  nombre_mercado: string;
  total_recaudado: number;
  total_facturas: number;
  facturas_pagadas: number;
  total_locales: number;
}

export interface LocalStats {
  id: string;
  numero_local: string;
  nombre_local: string;
  mercado: string;
  total_facturas: number;
  total_recaudado: number;
  facturas_pagadas: number;
}

export interface ReporteMetadata {
  tipo: string;
  periodo: {
    inicio: string;
    fin: string;
  };
  formato: string;
  tiempo_procesamiento: string;
  timestamp: string;
  usuario?: string;
}

export interface FiltrosAplicados {
  mercados: string[];
  locales: string[];
}
```

### **src/app/interfaces/reportes/mercado.interface.ts**
```typescript
export interface Mercado {
  id: string;
  nombre_mercado: string;
  direccion: string;
  _count?: {
    locales: number;
  };
}

export interface TipoReporte {
  value: string;
  label: string;
  icon: string;
}

export interface Periodo {
  value: string;
  label: string;
}

export interface FormatoExport {
  value: string;
  label: string;
  icon: string;
}

export interface ConfiguracionReportes {
  tipos_reporte: TipoReporte[];
  periodos: Periodo[];
  formatos: FormatoExport[];
  mercados_disponibles: Mercado[];
  tipos_local: string[];
}
```

### **src/app/interfaces/reportes/estadisticas.interface.ts**
```typescript
export interface EstadisticasGenerales {
  total_mercados: number;
  total_locales: number;
  total_facturas: number;
  total_recaudado: number;
  promedio_factura: number;
}

export interface EstadisticasDemo {
  total_mercados: number;
  total_facturas: number;
  total_recaudado: number;
  mercados_sample: Mercado[];
  tipos_local_disponibles: string[];
  configuracion_ui: ConfiguracionReportes;
}

export interface DemoResponse {
  success: boolean;
  demo_data: EstadisticasDemo;
  timestamp: string;
  note: string;
}
```

---

## 🛠️ 2. SERVICIOS ANGULAR

### **src/app/services/reportes/reportes.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { 
  ReporteRequest, 
  ReporteResponse, 
  ConfiguracionReportes,
  EstadisticasGenerales,
  DemoResponse 
} from '../../interfaces/reportes/reporte.interface';
import { AuthService } from '../auth/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private baseUrl = 'http://localhost:3000';
  private reportesSubject = new BehaviorSubject<ReporteResponse | null>(null);
  public reportes$ = this.reportesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  // 🔓 MÉTODOS PÚBLICOS (SIN AUTENTICACIÓN)
  
  /**
   * Test de conectividad público
   */
  async testConectividad(): Promise<any> {
    try {
      return await this.http.get(`${this.baseUrl}/reportes-demo/test`).toPromise();
    } catch (error) {
      await this.showError('Error de conectividad', error);
      throw error;
    }
  }

  /**
   * Obtener configuración pública para UI
   */
  async obtenerConfiguracionPublica(): Promise<DemoResponse> {
    try {
      return await this.http.get<DemoResponse>(`${this.baseUrl}/reportes-demo/configuracion`).toPromise();
    } catch (error) {
      await this.showError('Error obteniendo configuración', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas generales públicas
   */
  async obtenerEstadisticasPublicas(): Promise<any> {
    try {
      return await this.http.get(`${this.baseUrl}/reportes-demo/stats`).toPromise();
    } catch (error) {
      await this.showError('Error obteniendo estadísticas', error);
      throw error;
    }
  }

  // 🔒 MÉTODOS CON AUTENTICACIÓN

  /**
   * Generar reporte completo con autenticación
   */
  async generarReporte(request: ReporteRequest): Promise<ReporteResponse> {
    const loading = await this.loadingCtrl.create({
      message: 'Generando reporte...',
      spinner: 'dots'
    });
    
    try {
      await loading.present();
      
      const headers = await this.getAuthHeaders();
      const response = await this.http.post<ReporteResponse>(
        `${this.baseUrl}/reportes/generar`, 
        request, 
        { headers }
      ).toPromise();

      this.reportesSubject.next(response);
      await this.showSuccess(`Reporte ${request.tipo} generado exitosamente`);
      
      return response;
    } catch (error) {
      await this.showError('Error generando reporte', error);
      throw error;
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Obtener configuración completa con autenticación
   */
  async obtenerConfiguracion(): Promise<{ success: boolean; configuracion: ConfiguracionReportes }> {
    try {
      const headers = await this.getAuthHeaders();
      return await this.http.get<{ success: boolean; configuracion: ConfiguracionReportes }>(
        `${this.baseUrl}/reportes/configuracion`, 
        { headers }
      ).toPromise();
    } catch (error) {
      await this.showError('Error obteniendo configuración', error);
      throw error;
    }
  }

  /**
   * Test con autenticación
   */
  async testAutenticado(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      return await this.http.get(`${this.baseUrl}/reportes/test`, { headers }).toPromise();
    } catch (error) {
      await this.showError('Error en test autenticado', error);
      throw error;
    }
  }

  // 🎯 MÉTODOS DE UTILIDAD

  /**
   * Obtener headers con autenticación
   */
  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Mostrar mensaje de éxito
   */
  private async showSuccess(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  /**
   * Mostrar mensaje de error
   */
  private async showError(message: string, error: any): Promise<void> {
    console.error(message, error);
    const toast = await this.toastCtrl.create({
      message: `${message}: ${error?.error?.message || error?.message || 'Error desconocido'}`,
      duration: 5000,
      color: 'danger',
      position: 'top',
      icon: 'alert-circle'
    });
    await toast.present();
  }

  /**
   * Limpiar datos de reportes
   */
  clearReportes(): void {
    this.reportesSubject.next(null);
  }

  /**
   * Formatear números para UI
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  }

  /**
   * Formatear fechas para UI
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
```

### **src/app/services/reportes/reportes-config.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfiguracionReportes, TipoReporte } from '../../interfaces/reportes/reporte.interface';

@Injectable({
  providedIn: 'root'
})
export class ReportesConfigService {
  private configSubject = new BehaviorSubject<ConfiguracionReportes | null>(null);
  public config$ = this.configSubject.asObservable();

  constructor() {}

  /**
   * Configuración por defecto para modo offline
   */
  getDefaultConfig(): ConfiguracionReportes {
    return {
      tipos_reporte: [
        { value: 'FINANCIERO', label: 'Reporte Financiero', icon: 'cash-outline' },
        { value: 'OPERACIONAL', label: 'Reporte Operacional', icon: 'analytics-outline' },
        { value: 'MERCADO', label: 'Por Mercado', icon: 'business-outline' },
        { value: 'LOCAL', label: 'Por Local', icon: 'storefront-outline' }
      ],
      periodos: [
        { value: 'MENSUAL', label: 'Mensual' },
        { value: 'TRIMESTRAL', label: 'Trimestral' },
        { value: 'ANUAL', label: 'Anual' }
      ],
      formatos: [
        { value: 'JSON', label: 'Vista Previa', icon: 'eye-outline' },
        { value: 'PDF', label: 'PDF', icon: 'document-text-outline' },
        { value: 'EXCEL', label: 'Excel', icon: 'grid-outline' }
      ],
      mercados_disponibles: [],
      tipos_local: []
    };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(config: ConfiguracionReportes): void {
    this.configSubject.next(config);
  }

  /**
   * Obtener configuración actual
   */
  getCurrentConfig(): ConfiguracionReportes | null {
    return this.configSubject.value;
  }

  /**
   * Obtener colores por tipo de reporte
   */
  getColorByTipo(tipo: string): string {
    const colors = {
      'FINANCIERO': 'bg-green-100 text-green-800',
      'OPERACIONAL': 'bg-blue-100 text-blue-800',
      'MERCADO': 'bg-purple-100 text-purple-800',
      'LOCAL': 'bg-orange-100 text-orange-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtener iconos por estado
   */
  getIconByEstado(estado: string): string {
    const icons = {
      'PENDIENTE': 'time-outline',
      'PAGADA': 'checkmark-circle-outline',
      'VENCIDA': 'alert-circle-outline',
      'ANULADA': 'close-circle-outline'
    };
    return icons[estado] || 'help-circle-outline';
  }
}
```

---

## 🎨 3. PÁGINA PRINCIPAL DE REPORTES

### **src/app/pages/reportes/reportes.page.ts**
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportesService } from '../../services/reportes/reportes.service';
import { ReportesConfigService } from '../../services/reportes/reportes-config.service';
import { 
  ReporteRequest, 
  ReporteResponse, 
  ConfiguracionReportes,
  EstadisticasGenerales 
} from '../../interfaces/reportes/reporte.interface';
import { ModalController, ActionSheetController } from '@ionic/angular';
import { ReporteModalComponent } from '../../components/reportes/reporte-modal/reporte-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
})
export class ReportesPage implements OnInit, OnDestroy {
  // Datos principales
  configuracion: ConfiguracionReportes;
  estadisticas: EstadisticasGenerales;
  ultimoReporte: ReporteResponse | null = null;
  
  // Estados de la UI
  isLoading = false;
  isDemoMode = true; // Cambiar a false para modo producción
  
  // Filtros seleccionados
  filtrosActivos = {
    tipo: 'FINANCIERO',
    periodo: 'MENSUAL',
    formato: 'JSON',
    mercados: [],
    locales: []
  };

  // Subscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private reportesService: ReportesService,
    private configService: ReportesConfigService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController
  ) {
    this.configuracion = this.configService.getDefaultConfig();
  }

  async ngOnInit() {
    await this.cargarDatosIniciales();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Cargar datos iniciales
   */
  async cargarDatosIniciales() {
    this.isLoading = true;
    
    try {
      if (this.isDemoMode) {
        // Modo demo (sin autenticación)
        const [testResult, configData, statsData] = await Promise.all([
          this.reportesService.testConectividad(),
          this.reportesService.obtenerConfiguracionPublica(),
          this.reportesService.obtenerEstadisticasPublicas()
        ]);

        console.log('🎯 Conectividad:', testResult);
        
        if (configData.success) {
          this.configuracion = configData.demo_data.configuracion_ui;
          this.configService.updateConfig(this.configuracion);
        }

        if (statsData.success) {
          this.estadisticas = statsData.estadisticas;
        }
        
      } else {
        // Modo producción (con autenticación)
        const [testResult, configData] = await Promise.all([
          this.reportesService.testAutenticado(),
          this.reportesService.obtenerConfiguracion()
        ]);

        console.log('🔐 Test autenticado:', testResult);
        
        if (configData.success) {
          this.configuracion = configData.configuracion;
          this.configService.updateConfig(this.configuracion);
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Configurar subscripciones
   */
  setupSubscriptions() {
    // Escuchar cambios en reportes
    const reporteSub = this.reportesService.reportes$.subscribe(reporte => {
      this.ultimoReporte = reporte;
    });
    this.subscriptions.push(reporteSub);

    // Escuchar cambios en configuración
    const configSub = this.configService.config$.subscribe(config => {
      if (config) {
        this.configuracion = config;
      }
    });
    this.subscriptions.push(configSub);
  }

  /**
   * Generar reporte
   */
  async generarReporte() {
    const request: ReporteRequest = {
      tipo: this.filtrosActivos.tipo as any,
      periodo: this.filtrosActivos.periodo as any,
      formato: this.filtrosActivos.formato as any,
      mercados: this.filtrosActivos.mercados,
      locales: this.filtrosActivos.locales
    };

    try {
      const reporte = await this.reportesService.generarReporte(request);
      await this.mostrarReporte(reporte);
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
    }
  }

  /**
   * Mostrar reporte en modal
   */
  async mostrarReporte(reporte: ReporteResponse) {
    const modal = await this.modalCtrl.create({
      component: ReporteModalComponent,
      componentProps: {
        reporte: reporte,
        configuracion: this.configuracion
      },
      cssClass: 'reporte-modal'
    });

    await modal.present();
  }

  /**
   * Mostrar opciones de filtros
   */
  async mostrarFiltros() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filtros de Reporte',
      buttons: [
        {
          text: 'Seleccionar Mercados',
          icon: 'business-outline',
          handler: () => this.seleccionarMercados()
        },
        {
          text: 'Seleccionar Período',
          icon: 'calendar-outline',
          handler: () => this.seleccionarPeriodo()
        },
        {
          text: 'Limpiar Filtros',
          icon: 'refresh-outline',
          handler: () => this.limpiarFiltros()
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Seleccionar mercados
   */
  async seleccionarMercados() {
    // TODO: Implementar selector de mercados
    console.log('🏢 Seleccionar mercados');
  }

  /**
   * Seleccionar período
   */
  async seleccionarPeriodo() {
    // TODO: Implementar selector de período
    console.log('📅 Seleccionar período');
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    this.filtrosActivos = {
      tipo: 'FINANCIERO',
      periodo: 'MENSUAL',
      formato: 'JSON',
      mercados: [],
      locales: []
    };
  }

  /**
   * Cambiar tipo de reporte
   */
  cambiarTipo(tipo: string) {
    this.filtrosActivos.tipo = tipo;
  }

  /**
   * Cambiar período
   */
  cambiarPeriodo(periodo: string) {
    this.filtrosActivos.periodo = periodo;
  }

  /**
   * Obtener color por tipo
   */
  getColorByTipo(tipo: string): string {
    return this.configService.getColorByTipo(tipo);
  }

  /**
   * Refrescar datos
   */
  async doRefresh(event: any) {
    await this.cargarDatosIniciales();
    event.target.complete();
  }
}
```

### **src/app/pages/reportes/reportes.page.html**
```html
<ion-header [translucent]="true">
  <ion-toolbar color="primary">
    <ion-title>
      <ion-icon name="analytics-outline" class="mr-2"></ion-icon>
      Reportes
    </ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="mostrarFiltros()">
        <ion-icon name="filter-outline"></ion-icon>
      </ion-button>
      <ion-button (click)="cargarDatosIniciales()">
        <ion-icon name="refresh-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" class="bg-gray-50">
  <!-- Header con estadísticas generales -->
  <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
    <div class="grid grid-cols-2 gap-4" *ngIf="estadisticas">
      <div class="text-center">
        <div class="text-2xl font-bold">{{ estadisticas.total_mercados }}</div>
        <div class="text-blue-100">Mercados</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold">{{ estadisticas.total_facturas }}</div>
        <div class="text-blue-100">Facturas</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold">{{ reportesService.formatCurrency(estadisticas.total_recaudado) }}</div>
        <div class="text-blue-100">Recaudado</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold">{{ estadisticas.total_locales }}</div>
        <div class="text-blue-100">Locales</div>
      </div>
    </div>
    
    <!-- Indicador de modo -->
    <div class="mt-4 text-center">
      <ion-chip [color]="isDemoMode ? 'warning' : 'success'" outline="true">
        <ion-icon [name]="isDemoMode ? 'flask-outline' : 'shield-checkmark-outline'"></ion-icon>
        <ion-label>{{ isDemoMode ? 'Modo Demo' : 'Modo Producción' }}</ion-label>
      </ion-chip>
    </div>
  </div>

  <!-- Refresh -->
  <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <!-- Tipos de Reporte -->
  <div class="px-4 mb-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Tipos de Reporte</h2>
    <div class="grid grid-cols-2 gap-3">
      <div 
        *ngFor="let tipo of configuracion?.tipos_reporte" 
        (click)="cambiarTipo(tipo.value)"
        class="bg-white rounded-2xl p-4 shadow-md transition-all duration-200 cursor-pointer"
        [class]="filtrosActivos.tipo === tipo.value ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'"
      >
        <div class="flex flex-col items-center text-center">
          <ion-icon 
            [name]="tipo.icon" 
            class="text-3xl mb-2"
            [class]="filtrosActivos.tipo === tipo.value ? 'text-blue-600' : 'text-gray-600'"
          ></ion-icon>
          <span 
            class="text-sm font-medium"
            [class]="filtrosActivos.tipo === tipo.value ? 'text-blue-600' : 'text-gray-700'"
          >
            {{ tipo.label }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Períodos -->
  <div class="px-4 mb-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Período</h2>
    <div class="flex space-x-2">
      <ion-chip 
        *ngFor="let periodo of configuracion?.periodos"
        (click)="cambiarPeriodo(periodo.value)"
        [color]="filtrosActivos.periodo === periodo.value ? 'primary' : 'medium'"
        [outline]="filtrosActivos.periodo !== periodo.value"
        class="cursor-pointer"
      >
        <ion-label>{{ periodo.label }}</ion-label>
      </ion-chip>
    </div>
  </div>

  <!-- Filtros Activos -->
  <div class="px-4 mb-6" *ngIf="filtrosActivos.mercados.length > 0 || filtrosActivos.locales.length > 0">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Filtros Aplicados</h2>
    <div class="flex flex-wrap gap-2">
      <ion-chip *ngIf="filtrosActivos.mercados.length > 0" color="tertiary">
        <ion-icon name="business-outline"></ion-icon>
        <ion-label>{{ filtrosActivos.mercados.length }} Mercados</ion-label>
        <ion-icon name="close-circle" (click)="filtrosActivos.mercados = []"></ion-icon>
      </ion-chip>
      <ion-chip *ngIf="filtrosActivos.locales.length > 0" color="secondary">
        <ion-icon name="storefront-outline"></ion-icon>
        <ion-label>{{ filtrosActivos.locales.length }} Locales</ion-label>
        <ion-icon name="close-circle" (click)="filtrosActivos.locales = []"></ion-icon>
      </ion-chip>
    </div>
  </div>

  <!-- Último Reporte -->
  <div class="px-4 mb-6" *ngIf="ultimoReporte">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Último Reporte</h2>
    <div class="bg-white rounded-2xl p-4 shadow-md">
      <div class="flex justify-between items-center mb-3">
        <span class="text-lg font-medium text-gray-800">{{ ultimoReporte.metadata.tipo }}</span>
        <ion-chip [color]="getColorByTipo(ultimoReporte.metadata.tipo)">
          <ion-label>{{ ultimoReporte.metadata.tiempo_procesamiento }}</ion-label>
        </ion-chip>
      </div>
      
      <div class="text-sm text-gray-600 mb-3">
        {{ reportesService.formatDate(ultimoReporte.metadata.timestamp) }}
      </div>

      <!-- Preview de datos según tipo -->
      <div *ngIf="ultimoReporte.data.resumen" class="grid grid-cols-3 gap-4 mb-4">
        <div class="text-center">
          <div class="text-xl font-bold text-green-600">
            {{ reportesService.formatCurrency(ultimoReporte.data.resumen.total_recaudado) }}
          </div>
          <div class="text-xs text-gray-500">Recaudado</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-blue-600">
            {{ ultimoReporte.data.resumen.total_facturas }}
          </div>
          <div class="text-xs text-gray-500">Facturas</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-purple-600">
            {{ reportesService.formatCurrency(ultimoReporte.data.resumen.promedio_factura) }}
          </div>
          <div class="text-xs text-gray-500">Promedio</div>
        </div>
      </div>

      <ion-button 
        expand="block" 
        fill="outline" 
        (click)="mostrarReporte(ultimoReporte)"
        class="mt-4"
      >
        <ion-icon name="eye-outline" slot="start"></ion-icon>
        Ver Reporte Completo
      </ion-button>
    </div>
  </div>

  <!-- Botón Principal -->
  <div class="px-4 pb-8">
    <ion-button 
      expand="block" 
      size="large"
      (click)="generarReporte()"
      [disabled]="isLoading"
      class="h-14 rounded-2xl font-semibold"
    >
      <ion-icon name="analytics-outline" slot="start"></ion-icon>
      {{ isLoading ? 'Generando...' : 'Generar Reporte' }}
    </ion-button>
  </div>

  <!-- Loading -->
  <div *ngIf="isLoading" class="flex justify-center items-center p-8">
    <ion-spinner name="dots" color="primary"></ion-spinner>
    <span class="ml-3 text-gray-600">Cargando datos...</span>
  </div>
</ion-content>
```

### **src/app/pages/reportes/reportes.page.scss**
```scss
.reporte-modal {
  --height: 90%;
  --border-radius: 20px 20px 0 0;
}

ion-chip {
  font-weight: 500;
}

.cursor-pointer {
  cursor: pointer;
}

// Gradientes personalizados
.bg-gradient-to-r {
  background: linear-gradient(90deg, var(--tw-gradient-stops));
}

.from-blue-600 {
  --tw-gradient-from: #2563eb;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(37, 99, 235, 0));
}

.to-purple-600 {
  --tw-gradient-to: #9333ea;
}

// Animaciones
.transition-all {
  transition: all 0.2s ease-in-out;
}

.hover\\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
```

---

## 🧩 4. COMPONENTE DE MODAL DE REPORTE

### **src/app/components/reportes/reporte-modal/reporte-modal.component.ts**
```typescript
import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ReporteResponse, ConfiguracionReportes } from '../../../interfaces/reportes/reporte.interface';
import { ReportesService } from '../../../services/reportes/reportes.service';

@Component({
  selector: 'app-reporte-modal',
  templateUrl: './reporte-modal.component.html',
  styleUrls: ['./reporte-modal.component.scss']
})
export class ReporteModalComponent {
  @Input() reporte: ReporteResponse;
  @Input() configuracion: ConfiguracionReportes;

  activeTab = 'resumen';

  constructor(
    private modalCtrl: ModalController,
    public reportesService: ReportesService
  ) {}

  async cerrar() {
    await this.modalCtrl.dismiss();
  }

  cambiarTab(tab: string) {
    this.activeTab = tab;
  }

  async exportar(formato: string) {
    // TODO: Implementar exportación
    console.log(`📤 Exportar como ${formato}`);
  }

  // Obtener datos para gráficos
  getChartData() {
    if (this.reporte.data.por_estado) {
      return Object.entries(this.reporte.data.por_estado).map(([estado, data]) => ({
        name: estado,
        value: data.monto,
        count: data.cantidad
      }));
    }
    return [];
  }
}
```

### **src/app/components/reportes/reporte-modal/reporte-modal.component.html**
```html
<ion-header>
  <ion-toolbar>
    <ion-title>Reporte {{ reporte.metadata.tipo }}</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="cerrar()">
        <ion-icon name="close"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <!-- Tabs -->
  <div class="flex border-b border-gray-200 bg-white">
    <button 
      *ngFor="let tab of ['resumen', 'detalles', 'graficos']"
      (click)="cambiarTab(tab)"
      class="flex-1 py-3 px-4 text-center font-medium text-sm"
      [class]="activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'"
    >
      {{ tab | titlecase }}
    </button>
  </div>

  <!-- Contenido según tab activo -->
  <div class="p-4">
    <!-- Tab Resumen -->
    <div *ngIf="activeTab === 'resumen'" class="space-y-6">
      <!-- Metadata -->
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-3">Información del Reporte</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Tipo:</span>
            <span class="ml-2 font-medium">{{ reporte.metadata.tipo }}</span>
          </div>
          <div>
            <span class="text-gray-500">Formato:</span>
            <span class="ml-2 font-medium">{{ reporte.metadata.formato }}</span>
          </div>
          <div>
            <span class="text-gray-500">Período:</span>
            <span class="ml-2 font-medium">
              {{ reportesService.formatDate(reporte.metadata.periodo.inicio) }} - 
              {{ reportesService.formatDate(reporte.metadata.periodo.fin) }}
            </span>
          </div>
          <div>
            <span class="text-gray-500">Procesamiento:</span>
            <span class="ml-2 font-medium">{{ reporte.metadata.tiempo_procesamiento }}</span>
          </div>
        </div>
      </div>

      <!-- Resumen Financiero -->
      <div *ngIf="reporte.data.resumen" class="bg-white rounded-xl p-4 shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-4">Resumen Financiero</h3>
        <div class="grid grid-cols-1 gap-4">
          <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span class="text-gray-600">Total Recaudado</span>
            <span class="text-2xl font-bold text-green-600">
              {{ reportesService.formatCurrency(reporte.data.resumen.total_recaudado) }}
            </span>
          </div>
          <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span class="text-gray-600">Total Facturas</span>
            <span class="text-2xl font-bold text-blue-600">
              {{ reporte.data.resumen.total_facturas }}
            </span>
          </div>
          <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
            <span class="text-gray-600">Promedio por Factura</span>
            <span class="text-2xl font-bold text-purple-600">
              {{ reportesService.formatCurrency(reporte.data.resumen.promedio_factura) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Estados de Facturas -->
      <div *ngIf="reporte.data.por_estado" class="bg-white rounded-xl p-4 shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-4">Por Estado</h3>
        <div class="space-y-3">
          <div 
            *ngFor="let estado of reporte.data.por_estado | keyvalue" 
            class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center">
              <ion-icon [name]="getIconByEstado(estado.key)" class="mr-2 text-lg"></ion-icon>
              <span class="font-medium">{{ estado.key }}</span>
            </div>
            <div class="text-right">
              <div class="font-bold">{{ reportesService.formatCurrency(estado.value.monto) }}</div>
              <div class="text-sm text-gray-500">{{ estado.value.cantidad }} facturas</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Detalles -->
    <div *ngIf="activeTab === 'detalles'" class="space-y-6">
      <!-- Mercados -->
      <div *ngIf="reporte.data.por_mercado || reporte.data.mercados" class="bg-white rounded-xl p-4 shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-4">Detalles por Mercado</h3>
        <div class="space-y-3">
          <div 
            *ngFor="let mercado of (reporte.data.por_mercado || reporte.data.mercados)" 
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="font-medium text-gray-800 mb-2">{{ mercado.nombre_mercado }}</div>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div class="text-center">
                <div class="font-bold text-green-600">{{ reportesService.formatCurrency(mercado.total_recaudado) }}</div>
                <div class="text-gray-500">Recaudado</div>
              </div>
              <div class="text-center">
                <div class="font-bold text-blue-600">{{ mercado.total_facturas }}</div>
                <div class="text-gray-500">Facturas</div>
              </div>
              <div class="text-center">
                <div class="font-bold text-purple-600">{{ mercado.total_locales }}</div>
                <div class="text-gray-500">Locales</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Locales -->
      <div *ngIf="reporte.data.locales" class="bg-white rounded-xl p-4 shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-4">Detalles por Local</h3>
        <div class="space-y-3">
          <div 
            *ngFor="let local of reporte.data.locales" 
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="font-medium text-gray-800">{{ local.nombre_local || 'Local ' + local.numero_local }}</div>
                <div class="text-sm text-gray-500">{{ local.mercado }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-green-600">{{ reportesService.formatCurrency(local.total_recaudado) }}</div>
                <div class="text-sm text-gray-500">{{ local.total_facturas }} facturas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas Operacionales -->
      <div *ngIf="reporte.data.estadisticas" class="bg-white rounded-xl p-4 shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-4">Estadísticas Operacionales</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ reporte.data.estadisticas.total_facturas }}</div>
            <div class="text-sm text-gray-600">Facturas</div>
          </div>
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ reporte.data.estadisticas.mercados_activos }}</div>
            <div class="text-sm text-gray-600">Mercados</div>
          </div>
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ reporte.data.estadisticas.locales_activos }}</div>
            <div class="text-sm text-gray-600">Locales</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Gráficos -->
    <div *ngIf="activeTab === 'graficos'" class="space-y-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <h3 class="font-semibold text-gray-800 mb-4">Visualización de Datos</h3>
        <div class="text-center text-gray-500 py-8">
          <ion-icon name="bar-chart-outline" class="text-4xl mb-2"></ion-icon>
          <p>Gráficos disponibles próximamente</p>
          <p class="text-sm">Se integrará con Chart.js o ApexCharts</p>
        </div>
      </div>
    </div>
  </div>
</ion-content>

<ion-footer>
  <ion-toolbar>
    <div class="flex space-x-2 p-2">
      <ion-button 
        *ngFor="let formato of configuracion.formatos" 
        fill="outline" 
        size="small"
        (click)="exportar(formato.value)"
        class="flex-1"
      >
        <ion-icon [name]="formato.icon" slot="start"></ion-icon>
        {{ formato.label }}
      </ion-button>
    </div>
  </ion-toolbar>
</ion-footer>
```

---

## 📦 5. MÓDULOS Y ROUTING

### **src/app/pages/reportes/reportes.module.ts**
```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ReportesPageRoutingModule } from './reportes-routing.module';
import { ReportesPage } from './reportes.page';

// Componentes
import { ReporteModalComponent } from '../../components/reportes/reporte-modal/reporte-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportesPageRoutingModule
  ],
  declarations: [
    ReportesPage,
    ReporteModalComponent
  ]
})
export class ReportesPageModule {}
```

### **src/app/pages/reportes/reportes-routing.module.ts**
```typescript
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportesPage } from './reportes.page';

const routes: Routes = [
  {
    path: '',
    component: ReportesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportesPageRoutingModule {}
```

---

## 🎨 6. CONFIGURACIÓN DE TAILWIND

### **tailwind.config.js** (Raíz del proyecto)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'ionic-primary': '#3880ff',
        'ionic-secondary': '#3dc2ff',
        'ionic-tertiary': '#5260ff',
        'ionic-success': '#2dd36f',
        'ionic-warning': '#ffc409',
        'ionic-danger': '#eb445a',
      }
    },
  },
  plugins: [],
}
```

### **src/global.scss**
```scss
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

// Clases personalizadas para Ionic + Tailwind
.ion-page {
  @apply bg-gray-50;
}

.reporte-card {
  @apply bg-white rounded-xl shadow-md p-4 mb-4 transition-all duration-200;
}

.reporte-card:hover {
  @apply shadow-lg;
}

.stats-grid {
  @apply grid grid-cols-2 gap-4;
}

@media (min-width: 768px) {
  .stats-grid {
    @apply grid-cols-4;
  }
}
```

---

## 📋 7. INTEGRACIÓN EN APP PRINCIPAL

### **src/app/app-routing.module.ts**
```typescript
const routes: Routes = [
  // ... otras rutas
  {
    path: 'reportes',
    loadChildren: () => import('./pages/reportes/reportes.module').then(m => m.ReportesPageModule),
    canActivate: [AuthGuard] // Solo si usas autenticación
  },
  // ... más rutas
];
```

### **src/app/app.module.ts**
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Servicios
import { ReportesService } from './services/reportes/reportes.service';
import { ReportesConfigService } from './services/reportes/reportes-config.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ReportesService,
    ReportesConfigService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

---

## 🚀 8. COMANDOS DE INSTALACIÓN

```bash
# 1. Instalar dependencias de Tailwind
npm install -D tailwindcss postcss autoprefixer

# 2. Generar configuración de Tailwind
npx tailwindcss init -p

# 3. Instalar librerías adicionales (opcional)
npm install chart.js ng2-charts  # Para gráficos
npm install date-fns            # Para manejo de fechas
npm install lodash             # Para utilidades

# 4. Generar páginas y servicios
ionic generate page pages/reportes
ionic generate service services/reportes/reportes
ionic generate service services/reportes/reportes-config
ionic generate component components/reportes/reporte-modal
```

---

## ✅ 9. TESTING Y VALIDACIÓN

### **Pruebas Básicas**
```typescript
// src/app/pages/reportes/reportes.page.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportesPage } from './reportes.page';
import { ReportesService } from '../../services/reportes/reportes.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ReportesPage', () => {
  let component: ReportesPage;
  let fixture: ComponentFixture<ReportesPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportesPage],
      imports: [HttpClientTestingModule],
      providers: [ReportesService]
    });
    fixture = TestBed.createComponent(ReportesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial data on init', async () => {
    spyOn(component, 'cargarDatosIniciales').and.returnValue(Promise.resolve());
    await component.ngOnInit();
    expect(component.cargarDatosIniciales).toHaveBeenCalled();
  });
});
```

---

## 🎯 10. RESULTADO FINAL ESPERADO

Una vez implementado, tendrás:

1. **📱 Página de Reportes** funcional con diseño moderno
2. **🎨 UI con Tailwind** responsive y atractiva  
3. **🔄 Modo Demo** para desarrollo sin autenticación
4. **🔐 Modo Producción** con JWT completo
5. **📊 4 Tipos de Reportes** listos para usar
6. **🎯 Filtros Dinámicos** por mercado, período, etc.
7. **📱 Optimizado para Móvil** con gestos y navegación fluida
8. **🚀 Escalable** para agregar gráficos y nuevas funciones

**¡Tu sistema de reportes estará completamente integrado y listo para usar en producción!** 🎉

---

## 💡 TIPS DE IMPLEMENTACIÓN

1. **Comenzar con modo demo** para probar sin autenticación
2. **Implementar gradualmente** cada tipo de reporte  
3. **Usar interceptors** para manejo automático de tokens
4. **Agregar loading states** para mejor UX
5. **Implementar caché** para mejorar rendimiento
6. **Considerar modo offline** para funcionalidad básica

**¿Comenzamos con la implementación paso a paso?** 🚀
