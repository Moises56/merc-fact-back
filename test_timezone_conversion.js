// Test script to verify timezone conversion fix
// This script tests the timezone conversion logic

function formatDateToLocalTime(date) {
  // Honduras está en UTC-6 (CST)
  // Ajustar la fecha restando 6 horas para convertir de UTC a hora local de Honduras
  const hondurasTime = new Date(date.getTime() - (6 * 60 * 60 * 1000));
  return hondurasTime;
}

// Test with the problematic timestamp
const utcDate = new Date('2025-09-03T17:54:51.000Z');
console.log('Original UTC time:', utcDate.toISOString());
console.log('UTC time formatted:', utcDate.toLocaleString());

const hondurasTime = formatDateToLocalTime(utcDate);
console.log('Honduras time (UTC-6):', hondurasTime.toISOString());
console.log('Honduras time formatted:', hondurasTime.toLocaleString());

// Expected: 17:54 UTC should become 11:54 Honduras time
const expectedHour = 11;
const actualHour = hondurasTime.getUTCHours();

console.log('\n--- Verification ---');
console.log('Expected hour (Honduras):', expectedHour);
console.log('Actual hour (converted):', actualHour);
console.log('Conversion correct:', actualHour === expectedHour ? 'YES' : 'NO');

// Test with current time
const now = new Date();
const nowHonduras = formatDateToLocalTime(now);
console.log('\n--- Current Time Test ---');
console.log('Current UTC:', now.toISOString());
console.log('Current Honduras:', nowHonduras.toISOString());
console.log('Time difference (hours):', (now.getTime() - nowHonduras.getTime()) / (1000 * 60 * 60));