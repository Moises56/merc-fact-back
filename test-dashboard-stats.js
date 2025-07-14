// Script para probar el endpoint de dashboard mejorado
const axios = require('axios');

async function testDashboardEndpoint() {
  try {
    console.log('🧪 Probando endpoint del dashboard...\n');

    const response = await axios.get('http://localhost:3000/api/dashboard/statistics');
    
    console.log('✅ Respuesta del endpoint:');
    console.log(JSON.stringify(response.data, null, 2));

    // Verificar que incluye todos los campos requeridos
    const data = response.data;
    
    console.log('\n🔍 Verificando estructura actual:');
    
    // Verificar entidades
    console.log('\n📊 ENTIDADES:');
    if (data.entities) {
      console.log(`✅ Total usuarios: ${data.entities.totalUsers}`);
      console.log(`✅ Total mercados: ${data.entities.totalMarkets}`);
      console.log(`✅ Total locales: ${data.entities.totalLocals}`);
      
      if (data.entities.activeUsers !== undefined) {
        console.log(`✅ Usuarios activos: ${data.entities.activeUsers}`);
      } else {
        console.log(`❌ Usuarios activos: FALTA`);
      }
      
      if (data.entities.activeMarkets !== undefined) {
        console.log(`✅ Mercados activos: ${data.entities.activeMarkets}`);
      } else {
        console.log(`❌ Mercados activos: FALTA`);
      }
      
      if (data.entities.activeLocals !== undefined) {
        console.log(`✅ Locales activos: ${data.entities.activeLocals}`);
      } else {
        console.log(`❌ Locales activos: FALTA`);
      }
    }

    // Verificar facturas
    console.log('\n📄 FACTURAS:');
    if (data.invoices) {
      console.log(`✅ Total generadas: ${data.invoices.generated}`);
      console.log(`✅ Pagadas: ${data.invoices.paid}`);
      console.log(`✅ Vencidas: ${data.invoices.overdue}`);
      
      if (data.invoices.pending !== undefined) {
        console.log(`✅ Pendientes: ${data.invoices.pending}`);
      } else {
        console.log(`❌ Pendientes: FALTA`);
      }
      
      if (data.invoices.cancelled !== undefined) {
        console.log(`✅ Anuladas: ${data.invoices.cancelled}`);
      } else {
        console.log(`❌ Anuladas: FALTA`);
      }
    }

    // Verificar financiero
    console.log('\n💰 FINANCIERO:');
    if (data.financial) {
      console.log(`✅ Total recaudado: $${data.financial.totalRevenue}`);
      console.log(`✅ Recaudación mensual: $${data.financial.monthlyRevenue}`);
      console.log(`✅ Recaudación anual: $${data.financial.annualRevenue}`);
      console.log(`✅ Mercados con recaudación: ${data.financial.revenueByMarket.length}`);
      console.log(`✅ Locales con recaudación: ${data.financial.revenueByLocal.length}`);
      
      // Mostrar detalle de mercados si hay datos
      if (data.financial.revenueByMarket.length > 0) {
        console.log('\n🏪 TOP 3 MERCADOS POR RECAUDACIÓN:');
        data.financial.revenueByMarket.slice(0, 3).forEach((market, index) => {
          console.log(`${index + 1}. ${market.marketName}: $${market.total}`);
          if (market.monthly !== undefined) {
            console.log(`   - Mensual: $${market.monthly}, Anual: $${market.annual}`);
            console.log(`   - Locales: ${market.totalLocals}, Facturas pagadas: ${market.paidInvoices}`);
          }
        });
      }
    }

    // Calcular porcentajes útiles
    console.log('\n📈 ANÁLISIS:');
    if (data.invoices && data.entities && data.financial) {
      const porcentajePagadas = ((data.invoices.paid / data.invoices.generated) * 100).toFixed(1);
      console.log(`💡 Porcentaje de facturas pagadas: ${porcentajePagadas}%`);
      
      if (data.invoices.pending !== undefined) {
        const porcentajePendientes = ((data.invoices.pending / data.invoices.generated) * 100).toFixed(1);
        console.log(`💡 Porcentaje de facturas pendientes: ${porcentajePendientes}%`);
      }
      
      if (data.entities.activeLocals && data.entities.totalLocals) {
        const porcentajeLocalesActivos = ((data.entities.activeLocals / data.entities.totalLocals) * 100).toFixed(1);
        console.log(`💡 Porcentaje de locales activos: ${porcentajeLocalesActivos}%`);
      }
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Error del servidor:', error.response.status);
      console.log('📄 Respuesta:', error.response.data);
    } else {
      console.log('❌ Error de conexión:', error.message);
      console.log('\n💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
    }
  }
}

// Ejecutar la función de prueba
if (require.main === module) {
  testDashboardEndpoint();
}

module.exports = { testDashboardEndpoint };
