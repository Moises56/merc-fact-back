const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEstados() {
  console.log('🔍 Verificando estados de facturas en la base de datos...\n');
  
  const estados = await prisma.factura.groupBy({
    by: ['estado'],
    _count: { estado: true },
  });
  
  console.log('📊 Estados únicos encontrados:');
  estados.forEach(e => {
    console.log(`- "${e.estado}": ${e._count.estado} facturas`);
  });

  // Verificar facturas específicas del local
  const localId = '00B9E8D4-1A49-4B6F-BB38-8B7726E5E9C9';
  console.log(`\n🏠 Facturas del local ${localId}:`);
  
  const facturasLocal = await prisma.factura.findMany({
    where: { localId: localId },
    select: { estado: true, monto: true, mes: true, anio: true },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Total: ${facturasLocal.length} facturas`);
  facturasLocal.forEach((f, i) => {
    console.log(`${i+1}. Estado: "${f.estado}" - Monto: $${f.monto} - Periodo: ${f.mes}/${f.anio}`);
  });

  // Estadísticas por estado para este local
  const estadosPorLocal = await prisma.factura.groupBy({
    by: ['estado'],
    where: { localId: localId },
    _count: { estado: true },
    _sum: { monto: true }
  });

  console.log('\n📈 Resumen por estado:');
  estadosPorLocal.forEach(e => {
    console.log(`- "${e.estado}": ${e._count.estado} facturas, Total: $${e._sum.monto}`);
  });
  
  await prisma.$disconnect();
}

checkEstados().catch(console.error);
