/**
 * GET  /api/state  → { user, state }
 * PATCH /api/state  → { ok: true }
 *
 * All requests require: Authorization: Bearer <jwt>
 */
const jwt    = require('jsonwebtoken');
const { Pool } = require('pg');

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

function extractToken(event) {
  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  return auth.replace(/^Bearer\s+/i, '').trim();
}

function verifyJWT(token) {
  if (!token) throw Object.assign(new Error('No token'), { status: 401 });
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw Object.assign(new Error('Token inválido o expirado'), { status: 401 });
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // ── Auth ──────────────────────────────────────────────────────────────
  let payload;
  try {
    payload = verifyJWT(extractToken(event));
  } catch (e) {
    return { statusCode: e.status || 401, headers: CORS_HEADERS, body: JSON.stringify({ error: e.message }) };
  }

  try {
    const pool = getPool();

    // ── GET: fetch current state ─────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      // Refresh user from DB (in case it was updated or deactivated)
      const { rows: userRows } = await pool.query(
        'SELECT id, email, name, role FROM users WHERE id = $1 AND estado = $2 LIMIT 1',
        [payload.id, 'Activo']
      );
      if (!userRows.length) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Usuario no activo' }) };
      }

      const { rows: stateRows } = await pool.query(
        'SELECT data FROM app_state WHERE id = $1',
        ['main']
      );

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          user:  userRows[0],
          state: stateRows.length ? stateRows[0].data : null,
        }),
      };
    }

    // ── PATCH: save full state ───────────────────────────────────────────
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

      // Upsert: insert or update on conflict
      await pool.query(
        `INSERT INTO app_state (id, data, updated_at, updated_by, version)
         VALUES ('main', $1, NOW(), $2, 1)
         ON CONFLICT (id) DO UPDATE
           SET data       = EXCLUDED.data,
               updated_at = NOW(),
               updated_by = EXCLUDED.updated_by,
               version    = app_state.version + 1`,
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
    console.error('[state] DB error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};
