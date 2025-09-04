// Script para probar la corrección del formato de IP

const formatIpAddress = (rawIp) => {
  // Eliminar el prefijo ::ffff: que aparece cuando una IPv4 se mapea a formato IPv6
  return rawIp?.replace(/^::ffff:/, '') || rawIp;
};

// Ejemplos de IPs para probar
const testIps = [
  '::ffff:192.168.200.27',  // IPv4 mapeada a IPv6
  '192.168.200.27',         // IPv4 normal
  '2001:0db8:85a3:0000:0000:8a2e:0370:7334', // IPv6 normal
  null,                     // Valor nulo
  undefined,                // Valor indefinido
  '',                       // Cadena vacía
];

console.log('=== PRUEBA DE CORRECCIÓN DE FORMATO DE IP ===');
console.log('Este script demuestra cómo se corrige el formato de las direcciones IP');
console.log('eliminando el prefijo ::ffff: de las IPv4 mapeadas a formato IPv6.');
console.log('\nResultados:');

testIps.forEach((ip, index) => {
  const formattedIp = formatIpAddress(ip);
  console.log(`${index + 1}. IP original: "${ip}" -> IP formateada: "${formattedIp}"`);
});

console.log('\n=== EXPLICACIÓN DEL PROBLEMA ===');
console.log('El problema de las IPs idénticas ocurre porque:');
console.log('1. El servidor recibe direcciones IPv4 mapeadas al formato IPv6 (::ffff:192.168.x.x)');
console.log('2. Esto es común en servidores que soportan tanto IPv4 como IPv6');
console.log('3. La solución implementada elimina el prefijo ::ffff: para mostrar la IPv4 original');

console.log('\n=== EXPLICACIÓN DEL USER AGENT ===');
console.log('El User-Agent es una cadena que identifica el navegador y sistema operativo del cliente:');
console.log('Ejemplo: "Mozilla/5.0 (Linux; Android 14; SM-S908U Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36"');
console.log('\nEste ejemplo indica:');
console.log('- Sistema operativo: Android 14');
console.log('- Dispositivo: Samsung Galaxy S23 Ultra (SM-S908U)');
console.log('- Navegador: Chrome 139 dentro de una WebView de Android');
console.log('- Motor de renderizado: WebKit/537.36');

console.log('\n=== LIMITACIONES PARA CAPTURAR LA DIRECCIÓN MAC ===');
console.log('No es posible capturar la dirección MAC desde una aplicación web por estas razones:');
console.log('1. Restricciones de seguridad: Los navegadores no permiten acceso a información de hardware');
console.log('2. Aislamiento: Las aplicaciones web están aisladas del hardware por el sandbox del navegador');
console.log('3. Privacidad: Permitir acceso a la MAC comprometería la privacidad del usuario');
console.log('\nAlternativas para identificar dispositivos:');
console.log('1. Fingerprinting: Combinar User-Agent, resolución, fuentes instaladas, etc.');
console.log('2. Tokens de dispositivo: Almacenar identificadores en localStorage o cookies');
console.log('3. Autenticación de dos factores: Usar códigos enviados al dispositivo');