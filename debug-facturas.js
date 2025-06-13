const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFacturas() {
  console.log('🔍 Verificando facturas en la base de datos...\n');

  // 1. Contar todas las facturas
  const totalFacturas = await prisma.factura.count();
  console.log(`📊 Total de facturas: ${totalFacturas}`);

  // 2. Facturas por estado
  const facturasPorEstado = await prisma.factura.groupBy({
    by: ['estado'],
    _count: { estado: true },
  });
  
  console.log('\n📈 Facturas por estado:');
  facturasPorEstado.forEach(grupo => {
    console.log(`  - ${grupo.estado}: ${grupo._count.estado}`);
  });

  // 3. Facturas del mercado específico
  const mercadoId = 'a2564f93-d208-4d63-a394-2d0cf89bd23b';
  const facturasDelMercado = await prisma.factura.findMany({
    where: {
      local: {
        mercadoId: mercadoId,
      },
    },
    include: {
      local: {
        select: {
          numero_local: true,
          mercado: {
            select: {
              nombre_mercado: true,
            },
          },
        },
      },
    },
  });

  console.log(`\n🏪 Facturas del mercado "${facturasDelMercado[0]?.local?.mercado?.nombre_mercado || 'N/A'}": ${facturasDelMercado.length}`);
  
  if (facturasDelMercado.length > 0) {
    console.log('\n📋 Detalle de facturas:');
    facturasDelMercado.forEach((factura, index) => {
      console.log(`  ${index + 1}. Local ${factura.local.numero_local} - ${factura.estado} - $${factura.monto} - ${factura.mes}/${factura.año}`);
    });  console.log(`\n🔍 Verificando estado exacto de facturas...`);
  const primeraFactura = await prisma.factura.findFirst();
  if (primeraFactura) {
    console.log(`Estado de la primera factura: "${primeraFactura.estado}"`);
    console.log(`Tipo de estado: ${typeof primeraFactura.estado}`);
    console.log(`Longitud del string: ${primeraFactura.estado.length}`);
  }

  // 4. Facturas PAGADAS del mercado
  const facturasPagadas = facturasDelMercado.filter(f => f.estado === 'PAGADO');
  const totalRecaudado = facturasPagadas.reduce((sum, f) => sum + Number(f.monto), 0);
    
    console.log(`\n💰 Facturas PAGADAS: ${facturasPagadas.length}`);
    console.log(`💵 Total recaudado: $${totalRecaudado}`);
  }

  await prisma.$disconnect();
}

debugFacturas().catch(console.error);
