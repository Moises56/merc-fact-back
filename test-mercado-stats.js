const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMercadoStats() {
  console.log('🧪 Probando el nuevo endpoint de estadísticas de mercado...\n');

  // Usar el ID del mercado que mencionaste en la consulta
  const mercadoId = '4604695e-b177-44b8-93c3-3fa5f90a8263';
  
  try {
    // Simular lo que hace el nuevo método
    const mercado = await prisma.mercado.findUnique({
      where: { id: mercadoId },
      select: { id: true, nombre_mercado: true, isActive: true },
    });

    if (!mercado) {
      console.log('❌ Mercado no encontrado');
      return;
    }

    const [
      totalLocales,
      localesOcupados,
      recaudacionTotal,
      facturasDelMercado,
    ] = await Promise.all([
      // Total de locales
      prisma.local.count({
        where: { mercadoId: mercadoId },
      }),

      // Locales ocupados
      prisma.local.count({
        where: {
          mercadoId: mercadoId,
          estado_local: 'OCUPADO',
        },
      }),

      // Recaudación total
      prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          estado: 'PAGADO',
          local: {
            mercadoId: mercadoId,
          },
        },
      }),

      // Facturas para calcular promedio
      prisma.factura.findMany({
        where: {
          local: {
            mercadoId: mercadoId,
          },
        },
        select: {
          monto: true,
          estado: true,
        },
      }),
    ]);

    console.log(`📊 Información del mercado: ${mercado.nombre_mercado}`);
    console.log(`🏢 Total de locales: ${totalLocales}`);
    console.log(`🏠 Locales ocupados: ${localesOcupados}`);
    console.log(`📋 Total de facturas: ${facturasDelMercado.length}`);

    // Calcular monto promedio
    const montoPromedio = facturasDelMercado.length > 0 
      ? facturasDelMercado.reduce((sum, f) => sum + Number(f.monto), 0) / facturasDelMercado.length
      : 300;

    console.log(`💰 Monto promedio por factura: $${montoPromedio.toFixed(2)}`);

    // Calcular recaudación esperada
    const totalEsperadoMensual = localesOcupados * montoPromedio;
    const totalEsperadoAnual = totalEsperadoMensual * 12;

    const resultado = {
      mercado_id: mercado.id,
      mercado_nombre: mercado.nombre_mercado,
      mercado_activo: mercado.isActive,
      total_locales: totalLocales,
      total_recaudado: Number(recaudacionTotal._sum?.monto) || 0,
      total_esperado_mensual: Math.round(totalEsperadoMensual * 100) / 100,
      total_esperado_anual: Math.round(totalEsperadoAnual * 100) / 100,
    };

    console.log('\n✅ Respuesta del endpoint:');
    console.log(JSON.stringify(resultado, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMercadoStats();
