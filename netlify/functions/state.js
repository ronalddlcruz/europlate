/**
 * GET  /api/state  → { user, state }
 * PATCH /api/state → { ok: true }
 * Requiere: Authorization: Bearer <jwt>
 */
const jwt     = require('jsonwebtoken');
const { Pool } = require('pg');

let pool;
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no est\u00e1 definida');
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

const CORS_HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
};

function extractToken(event) {
  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  return auth.replace(/^Bearer\s+/i, '').trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Verificar JWT
  let payload;
  try {
    const token = extractToken(event);
    if (!token) throw new Error('No token');
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    const db = getPool();

    // ── GET: obtener estado ───────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const { rows: users } = await db.query(
        `SELECT id, email, name, role
         FROM users
         WHERE id = $1 AND estado = 'Activo'
         LIMIT 1`,
        [payload.id]
      );

      if (!users.length) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Usuario no activo' }) };
      }

      const { rows: stateRows } = await db.query(
        `SELECT data FROM app_state WHERE id = 'main' LIMIT 1`
      );

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          user:  users[0],
          state: stateRows && stateRows.length ? stateRows[0].data : null,
        }),
      };
    }

    // ── PATCH: guardar estado ─────────────────────────────────────────────
    if (event.httpMethod === 'PATCH') {
      let state;
      try {
        ({ state } = JSON.parse(event.body || '{}'));
      } catch {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'JSON inválido' }) };
      }
      if (!state || typeof state !== 'object') {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'state requerido' }) };
      }

      await db.query(
        `INSERT INTO app_state (id, data, updated_at, updated_by)
         VALUES ('main', $1::jsonb, NOW(), $2)
         ON CONFLICT (id) DO UPDATE
           SET data = EXCLUDED.data,
               updated_at = EXCLUDED.updated_at,
               updated_by = EXCLUDED.updated_by`,
        [JSON.stringify(state), payload.email]
      );

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: true }),
      };
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    console.error('[state] error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};
