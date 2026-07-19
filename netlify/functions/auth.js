/**
 * POST /api/auth
 * Body: { email, password }
 * Returns: { token, user: { id, email, name, role }, state }
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Pool } = require('pg');

// Pool is reused across warm invocations
let _pool;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false }
    });
  }
  return _pool;
}

const CORS_HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let email, password;
  try {
    ({ email, password } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!email || !password) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Email y contraseña requeridos' }) };
  }

  try {
    const pool = getPool();

    // 1. Find user
    const { rows: userRows } = await pool.query(
      'SELECT * FROM users WHERE lower(email) = lower($1) AND estado = $2 LIMIT 1',
      [email.trim(), 'Activo']
    );

    if (!userRows.length) {
      return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
    }

    const user = userRows[0];

    // 2. Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
    }

    // 3. Issue JWT (7 days)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Fetch shared app state
    const { rows: stateRows } = await pool.query(
      'SELECT data FROM app_state WHERE id = $1',
      ['main']
    );
    const state = stateRows.length ? stateRows[0].data : null;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        state,
      }),
    };
  } catch (err) {
    console.error('[auth] DB error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};
