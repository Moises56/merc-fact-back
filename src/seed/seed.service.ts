import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seedMercados() {
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

    const results: Array<{
      success: boolean;
      mercado: string;
      id?: string;
      error?: string;
    }> = [];
    for (const mercado of mercados) {
      try {
        const created = await this.prisma.mercado.create({
          data: mercado
        });        results.push({
          success: true,
          mercado: created.nombre_mercado,
          id: created.id,
        });
      } catch (error) {
        results.push({
          success: false,
          mercado: mercado.nombre_mercado,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return results;
  }
}
