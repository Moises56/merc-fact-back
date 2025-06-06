const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMarkets() {
    try {
        const mercados = await prisma.mercado.findMany({
            orderBy: { createdAt: 'asc' }
        });
        
        console.log(`✅ Total markets found: ${mercados.length}`);
        console.log('Market details:');
        mercados.forEach(market => {
            console.log(`- ID: ${market.id}`);
            console.log(`  Name: ${market.nombre_mercado}`);
            console.log(`  Address: ${market.direccion}`);
            console.log(`  Active: ${market.isActive}`);
            console.log('----------------------------');
        });
    } catch (error) {
        console.error('❌ Error checking markets:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMarkets();
