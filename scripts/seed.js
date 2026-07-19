/**
 * Europlate — Script de inicialización de base de datos
 *
 * Uso:
 *   1. Copia .env.example a .env y configura DATABASE_URL y JWT_SECRET
 *   2. node scripts/seed.js
 *
 * Qué hace:
 *   - Crea las tablas (si no existen)
 *   - Inserta los 3 usuarios iniciales con contraseñas hasheadas
 *   - Inicializa la fila de app_state vacía
 */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Client } = require('pg');
const bcrypt     = require('bcryptjs');
const fs         = require('fs');
const path       = require('path');

const SALT_ROUNDS = 10;

const INITIAL_USERS = [
  { name: 'Administrador',  email: 'admin@europlate.pe',    password: 'Admin2024!',  role: 'admin'    },
  { name: 'Vendedor Demo',  email: 'ventas@europlate.pe',   password: 'Ventas2024!', role: 'vendedor' },
  { name: 'Operador Demo',  email: 'operador@europlate.pe', password: 'Oper2024!',   role: 'operador' },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌  DATABASE_URL no está definida. Copia .env.example a .env y configúrala.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✔  Conectado a la base de datos');

  // 1. Crear tablas
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await client.query(schema);
  console.log('✔  Esquema aplicado (tablas creadas o ya existentes)');

  // 2. Insertar usuarios
  for (const u of INITIAL_USERS) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await client.query(
      `INSERT INTO users (email, name, password_hash, role, estado)
       VALUES ($1, $2, $3, $4, 'Activo')
       ON CONFLICT (email) DO UPDATE
         SET name          = EXCLUDED.name,
             password_hash = EXCLUDED.password_hash,
             role          = EXCLUDED.role,
             updated_at    = NOW()`,
      [u.email, u.name, hash, u.role]
    );
    console.log(`✔  Usuario: ${u.email}  (contraseña: ${u.password})`);
  }

  // 3. Inicializar app_state (vacío; el primer login lo poblará)
  await client.query(
    `INSERT INTO app_state (id, data, version)
     VALUES ('main', '{}', 1)
     ON CONFLICT (id) DO NOTHING`
  );
  console.log('✔  app_state inicializado');

  await client.end();

  console.log('\n════════════════════════════════════════════');
  console.log('  Setup completo. Credenciales iniciales:');
  console.log('════════════════════════════════════════════');
  INITIAL_USERS.forEach(u => {
    console.log(`  ${u.email.padEnd(28)} ${u.password}`);
  });
  console.log('\n  ⚠  Cambia las contraseñas después de hacer login.');
  console.log('════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Error durante el seed:', err.message);
  process.exit(1);
});
