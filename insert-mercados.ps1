# Script para insertar mercados con sus IDs específicos
# Usar PowerShell para hacer POST requests directos

$baseUrl = "http://localhost:3000/api/mercados"

$mercados = @(
    @{
        id = "a2564f93-d208-4d63-a394-2d0cf89bd23b"
        nombre_mercado = "Mercado San Miguel"
        direccion = "Avenida Juan Gutemberg, Barrio La Plazuela, Distrito Histórico"
        latitud = 14.1057904456665
        longitud = -87.1990737318993
        descripcion = "Mercado municipal con 350 puestos comerciales"
    },
    @{
        id = "b52495e3-ff73-43a1-b0aa-f68bf82a0c3c"
        nombre_mercado = "Mercado de los Dolores"
        direccion = "Avenida Paulino Valladares, Barrio Los Dolores, Distrito Histórico"
        latitud = 14.107694716968
        longitud = -87.2063559293747
        descripcion = "Mercado municipal con 200 puestos comerciales"
    },
    @{
        id = "b9a05043-c4b4-4472-b8ec-b53095730ed6"
        nombre_mercado = "Mercado San Pablo"
        direccion = "Paseo El Manchén, El Manchen, Distrito El Picacho"
        latitud = 14.1091054673647
        longitud = -87.1890556812286
        descripcion = "Mercado municipal con 200 puestos comerciales"
    },
    @{
        id = "4604695e-b177-44b8-93c3-3fa5f90a8263"
        nombre_mercado = "Mercado Zonal Belén"
        direccion = "Sendero Costarrisence, Distrito Belén, Comayagüela"
        latitud = 14.094757164403
        longitud = -87.2230875492096
        descripcion = "Mercado municipal con 250 puestos comerciales"
    },
    @{
        id = "866595cc-c500-4eec-a625-92dee38bc244"
        nombre_mercado = "Mercado Jacaleapa"
        direccion = "Bulevar Centroamérica, Colonia Miraflores, Distrito Kennedy"
        latitud = 14.0695433778391
        longitud = -87.1837717294693
        descripcion = "Mercado municipal con 150 puestos comerciales"
    }
)

Write-Host "🌱 Iniciando inserción de mercados..." -ForegroundColor Green

foreach ($mercado in $mercados) {
    try {
        $jsonBody = $mercado | ConvertTo-Json -Depth 10
        Write-Host "Insertando: $($mercado.nombre_mercado)..." -ForegroundColor Yellow
        
        $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $jsonBody -ContentType "application/json"
        Write-Host "✅ Éxito: $($mercado.nombre_mercado) (ID: $($response.id))" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error con $($mercado.nombre_mercado): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "🎉 Proceso completado!" -ForegroundColor Green
