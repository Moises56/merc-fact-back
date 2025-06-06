import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de mercados...');

  // Datos de mercados a restaurar
  const mercados = [
    {
      id: "a2564f93-d208-4d63-a394-2d0cf89bd23b",
      nombre_mercado: "Mercado San Miguel",
      direccion: "Avenida Juan Gutemberg, Barrio La Plazuela, Distrito Histórico",
      latitud: 14.1057904456665,
      longitud: -87.1990737318993,
      descripcion: "Mercado municipal con 350 puestos comerciales",
      isActive: true,
      createdAt: new Date("2025-06-04T21:12:46.550Z"),
      updatedAt: new Date("2025-06-04T21:12:46.550Z")
    },
    {
      id: "b52495e3-ff73-43a1-b0aa-f68bf82a0c3c",
      nombre_mercado: "Mercado de los Dolores",
      direccion: "Avenida Paulino Valladares, Barrio Los Dolores, Distrito Histórico",
      latitud: 14.107694716968,
      longitud: -87.2063559293747,
      descripcion: "Mercado municipal con 200 puestos comerciales",
      isActive: true,
      createdAt: new Date("2025-06-04T21:12:09.492Z"),
      updatedAt: new Date("2025-06-04T21:12:09.492Z")
    },
    {
      id: "b9a05043-c4b4-4472-b8ec-b53095730ed6",
      nombre_mercado: "Mercado San Pablo",
      direccion: "Paseo El Manchén, El Manchen, Distrito El Picacho",
      latitud: 14.1091054673647,
      longitud: -87.1890556812286,
      descripcion: "Mercado municipal con 200 puestos comerciales",
      isActive: true,
      createdAt: new Date("2025-06-04T21:11:26.399Z"),
      updatedAt: new Date("2025-06-04T21:11:26.399Z")
    },
    {
      id: "4604695e-b177-44b8-93c3-3fa5f90a8263",
      nombre_mercado: "Mercado Zonal Belén",
      direccion: "Sendero Costarrisence, Distrito Belén, Comayagüela",
      latitud: 14.094757164403,
      longitud: -87.2230875492096,
      descripcion: "Mercado municipal con 250 puestos comerciales",
      isActive: true,
      createdAt: new Date("2025-06-04T21:10:43.081Z"),
      updatedAt: new Date("2025-06-04T21:10:43.081Z")
    },
    {
      id: "866595cc-c500-4eec-a625-92dee38bc244",
      nombre_mercado: "Mercado Jacaleapa",
      direccion: "Bulevar Centroamérica, Colonia Miraflores, Distrito Kennedy",
      latitud: 14.0695433778391,
      longitud: -87.1837717294693,
      descripcion: "Mercado municipal con 150 puestos comerciales",
      isActive: true,
      createdAt: new Date("2025-06-04T21:09:50.867Z"),
      updatedAt: new Date("2025-06-04T21:09:50.867Z")
    }
  ];

  // Insertar mercados uno por uno
  for (const mercado of mercados) {
    try {
      const created = await prisma.mercado.create({
        data: mercado
      });
      console.log(`✅ Mercado creado: ${created.nombre_mercado} (ID: ${created.id})`);
    } catch (error) {
      console.error(`❌ Error creando mercado ${mercado.nombre_mercado}:`, error);
    }
  }

  console.log('🎉 Seeding completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
