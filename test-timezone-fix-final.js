const axios = require('axios');

async function testTimezoneFix() {
  try {
    console.log('🔧 Probando la corrección de timezone...');
    
    // Verificar que el servidor esté corriendo
    try {
      await axios.get('http://localhost:3000');
    } catch (error) {
      console.log('❌ El servidor no está corriendo en el puerto 3000');
      console.log('   Asegúrate de que el servidor esté iniciado con: npm run start:dev');
      return;
    }
    
    // Autenticación
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'mougrindec',
      contrasena: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Autenticación exitosa');
    
    // Registrar hora antes de la consulta
    const beforeConsultation = new Date();
    console.log('⏰ Hora antes de consulta (UTC):', beforeConsultation.toISOString());
    console.log('⏰ Hora antes de consulta (Honduras):', new Date(beforeConsultation.getTime() - (6 * 60 * 60 * 1000)).toISOString().replace('Z', ' (hora local)'));
    
    // Realizar consulta EC
    const consultaResponse = await axios.get('http://localhost:3000/consultaEC/amnistia', {
      params: {
        claveCatastral: '21-1448-003'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Consulta EC realizada, status:', consultaResponse.status);
    
    // Esperar un momento para asegurar que el log se guarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Obtener logs recientes
    const logsResponse = await axios.get('http://localhost:3000/api/user-stats/recent-logs', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 10 }
    });
    
    console.log('📊 Logs obtenidos:', logsResponse.data.length || 0);
    
    // Buscar el log más reciente de tipo EC
    const logs = logsResponse.data;
    const logsArray = Array.isArray(logs) ? logs : (logs.data || logs.logs || []);
    
    const recentECLog = logsArray.find(log => 
      log.consultaType === 'EC' && 
      new Date(log.createdAt).getTime() >= (beforeConsultation.getTime() - 60000) // Dentro del último minuto
    );
    
    if (!recentECLog) {
      console.log('❌ No se encontró log reciente de tipo EC');
      return;
    }
    
    console.log('\n📋 ANÁLISIS DEL LOG:');
    console.log('   - ID del log:', recentECLog.id);
    console.log('   - Tipo de consulta:', recentECLog.consultaType);
    console.log('   - Timestamp guardado:', recentECLog.createdAt);
    
    // Analizar el timestamp
    const logTimestamp = new Date(recentECLog.createdAt);
    const currentTime = new Date();
    
    console.log('\n🕐 ANÁLISIS DE TIMEZONE:');
    console.log('   - Hora actual (UTC):', currentTime.toISOString());
    console.log('   - Hora actual (Honduras):', new Date(currentTime.getTime() - (6 * 60 * 60 * 1000)).toISOString().replace('Z', ' (hora local)'));
    console.log('   - Timestamp del log:', logTimestamp.toISOString());
    
    // Calcular diferencias
    const timeDifferenceMinutes = Math.abs(logTimestamp.getTime() - beforeConsultation.getTime()) / (1000 * 60);
    const hondurasTime = new Date(beforeConsultation.getTime() - (6 * 60 * 60 * 1000));
    const logVsHondurasTime = Math.abs(logTimestamp.getTime() - hondurasTime.getTime()) / (1000 * 60);
    
    console.log('\n📊 RESULTADOS:');
    console.log('   - Diferencia con hora UTC actual:', timeDifferenceMinutes.toFixed(2), 'minutos');
    console.log('   - Diferencia con hora Honduras actual:', logVsHondurasTime.toFixed(2), 'minutos');
    
    if (timeDifferenceMinutes < 5) {
      console.log('\n✅ CORRECCIÓN EXITOSA: El timestamp se está guardando correctamente');
      console.log('   El log muestra una hora que corresponde aproximadamente a UTC');
    } else if (logVsHondurasTime < 5) {
      console.log('\n⚠️  PROBLEMA PERSISTE: El timestamp aún se guarda en hora local de Honduras');
      console.log('   La diferencia con UTC es de', timeDifferenceMinutes.toFixed(2), 'minutos');
    } else {
      console.log('\n❓ RESULTADO INESPERADO: Hay una diferencia significativa');
      console.log('   Revisar la lógica de corrección de timezone');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

testTimezoneFix();