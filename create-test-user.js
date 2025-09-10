const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔐 Creando usuario de prueba...');
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { username: 'mougrindec' }
    });
    
    if (existingUser) {
      console.log('⚠️ El usuario mougrindec ya existe');
      console.log('📋 Datos del usuario existente:');
      console.log(`- ID: ${existingUser.id}`);
      console.log(`- Username: ${existingUser.username}`);
      console.log(`- Role: ${existingUser.role}`);
      console.log(`- Activo: ${existingUser.isActive}`);
      return;
    }
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        username: 'mougrindec',
        password: hashedPassword,
        nombre: 'Usuario',
        apellido: 'Prueba',
        email: 'mougrindec@test.com',
        role: 'USER',
        isActive: true
      }
    });
    
    console.log('✅ Usuario de prueba creado exitosamente:');
    console.log(`- ID: ${newUser.id}`);
    console.log(`- Username: ${newUser.username}`);
    console.log(`- Email: ${newUser.email}`);
    console.log(`- Role: ${newUser.role}`);
    console.log(`- Contraseña: admin123`);
    
  } catch (error) {
    console.error('❌ Error al crear usuario de prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();