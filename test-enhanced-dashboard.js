// Script para probar el endpoint de dashboard mejorado con totales esperados
const axios = require('axios');

async function testDashboardEndpoint() {
  try {
    console.log('🧪 Probando endpoint de dashboard mejorado...\n');
    
    // Hacer petición al endpoint de dashboard
    const response = await axios.get('http://localhost:3000/api/dashboard/statistics', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzODZhNzgzYi1lMjI3LTQ2YTMtODFiMy0zYmNhNTY5MWY4ODMiLCJlbWFpbCI6InVzZXJAbWVyY2Fkb3MuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzM2ODcxMTU5LCJleHAiOjE3MzY4NzQ3NTl9.xxNbsQqXqGdpTlp7iAV_mjDX4FEZ5uQ-gzwz7ZZ41nQ'
      }
    });

    const data = response.data;
    
    console.log('✅ Respuesta exitosa del endpoint');
    console.log('📊 Estructura de datos recibida:\n');
    
    // Mostrar métricas financieras mejoradas
    console.log('💰 MÉTRICAS FINANCIERAS:');
    console.log(`   • Recaudación mensual: $${data.financial.monthlyRevenue}`);
    console.log(`   • Recaudación anual: $${data.financial.annualRevenue}`);
    console.log(`   • Total histórico: $${data.financial.totalRevenue}`);
    console.log(`   • 🎯 ESPERADO MENSUAL: $${data.financial.expectedMonthlyRevenue}`);
    console.log(`   • 🎯 ESPERADO ANUAL: $${data.financial.expectedAnnualRevenue}`);
    console.log(`   • Mercados con revenue: ${data.financial.revenueByMarket.length}`);
    console.log(`   • Locales con revenue: ${data.financial.revenueByLocal.length}\n`);
    
    // Mostrar métricas de facturación
    console.log('📋 MÉTRICAS DE FACTURACIÓN:');
    console.log(`   • Facturas pagadas: ${data.invoices.paid}`);
    console.log(`   • Facturas pendientes: ${data.invoices.pending}`);
    console.log(`   • Facturas vencidas: ${data.invoices.overdue}`);
    console.log(`   • Facturas anuladas: ${data.invoices.cancelled}`);
    console.log(`   • Total generadas: ${data.invoices.generated}`);
    console.log(`   • Tasa de pago: ${data.invoices.paymentRate}%`);
    console.log(`   • Tasa de morosidad: ${data.invoices.overdueRate}%`);
    console.log(`   • Eficiencia cobranza: ${data.invoices.collectionEfficiency}%`);
    console.log(`   • Monto pendiente: $${data.invoices.pendingAmount}`);
    console.log(`   • Monto vencido: $${data.invoices.overdueAmount}\n`);
    
    // Mostrar métricas de entidades
    console.log('🏢 MÉTRICAS DE ENTIDADES:');
    console.log(`   • Total mercados: ${data.entities.totalMarkets}`);
    console.log(`   • Total locales: ${data.entities.totalLocals}`);
    console.log(`   • Total usuarios: ${data.entities.totalUsers}`);
    console.log(`   • Mercados activos: ${data.entities.activeMarkets}`);
    console.log(`   • Locales activos: ${data.entities.activeLocals}`);
    console.log(`   • Usuarios activos: ${data.entities.activeUsers}`);
    console.log(`   • Tasa ocupación: ${data.entities.occupancyRate}%`);
    console.log(`   • Promedio locales/mercado: ${data.entities.averageLocalsPerMarket}`);
    console.log(`   • Locales con pagos este mes: ${data.entities.localsWithPaymentsThisMonth}\n`);
    
    // Verificar que los nuevos campos están presentes
    console.log('🔍 VERIFICACIÓN DE NUEVOS CAMPOS:');
    
    if (data.financial.expectedMonthlyRevenue !== undefined) {
      console.log('   ✅ expectedMonthlyRevenue: Presente');
    } else {
      console.log('   ❌ expectedMonthlyRevenue: FALTANTE');
    }
    
    if (data.financial.expectedAnnualRevenue !== undefined) {
      console.log('   ✅ expectedAnnualRevenue: Presente');
    } else {
      console.log('   ❌ expectedAnnualRevenue: FALTANTE');
    }
    
    // Mostrar cálculos de proyección
    const monthlyActual = data.financial.monthlyRevenue;
    const monthlyExpected = data.financial.expectedMonthlyRevenue;
    const fulfillmentPercentage = monthlyExpected > 0 ? ((monthlyActual / monthlyExpected) * 100).toFixed(2) : 0;
    
    console.log('\n📈 ANÁLISIS DE RENDIMIENTO:');
    console.log(`   • Cumplimiento mensual: ${fulfillmentPercentage}%`);
    console.log(`   • Diferencia esperado vs actual: $${monthlyExpected - monthlyActual}`);
    
    if (fulfillmentPercentage >= 80) {
      console.log('   🟢 Estado: EXCELENTE');
    } else if (fulfillmentPercentage >= 60) {
      console.log('   🟡 Estado: BUENO');
    } else {
      console.log('   🔴 Estado: NECESITA ATENCIÓN');
    }
    
    console.log('\n🎉 Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al probar el endpoint:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testDashboardEndpoint();
