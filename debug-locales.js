const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugLocales() {
  console.log('🏪 Verificando estado de locales...\n');

  const mercadoId = 'a2564f93-d208-4d63-a394-2d0cf89bd23b';

  // 1. Información del mercado
  const mercado = await prisma.mercado.findUnique({
    where: { id: mercadoId },
    select: { nombre_mercado: true, isActive: true },
  });

  console.log(`📍 Mercado: ${mercado?.nombre_mercado}`);
  console.log(`✅ Activo: ${mercado?.isActive}\n`);

  // 2. Estados de locales
  const localesPorEstado = await prisma.local.groupBy({
    by: ['estado_local'],
    where: { mercadoId },
    _count: { estado_local: true },
  });

  console.log('📊 Locales por estado:');
  localesPorEstado.forEach(grupo => {
    console.log(`  - ${grupo.estado_local}: ${grupo._count.estado_local}`);
  });

  // 3. Locales con facturas
  const localesConFacturas = await prisma.local.findMany({
    where: {
      mercadoId,
      facturas: {
        some: {},
      },
    },
    include: {
      _count: {
        select: { facturas: true },
      },
      facturas: {
        select: { monto: true, estado: true },
        take: 3,
      },
    },
  });

  console.log(`\n🧾 Locales con facturas: ${localesConFacturas.length}`);
  localesConFacturas.forEach(local => {
    console.log(`  - Local ${local.numero_local} (Estado: ${local.estado_local})`);
    console.log(`    └── ${local._count.facturas} facturas`);
    local.facturas.forEach(factura => {
      console.log(`        • $${factura.monto} - ${factura.estado}`);
    });
  });

  // 4. Promedio de monto por local
  const promedioMonto = await prisma.factura.aggregate({
    _avg: { monto: true },
    where: {
      local: { mercadoId },
      estado: 'PAGADO',
    },
  });

  console.log(`\n💰 Promedio de facturas pagadas: $${Number(promedioMonto._avg?.monto) || 0}`);

  await prisma.$disconnect();
}

debugLocales().catch(console.error);
