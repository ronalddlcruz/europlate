/**
 * GET  /api/state  → { user, state }
 * PATCH /api/state → { ok: true }
 * Requiere: Authorization: Bearer <jwt>
 */
const jwt     = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );
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
    const supabase = getSupabase();

    // ── GET: obtener estado ───────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', payload.id)
        .eq('estado', 'Activo')
        .limit(1);

      if (uErr || !users || !users.length) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Usuario no activo' }) };
      }

      const { data: stateRows } = await supabase
        .from('app_state')
        .select('data')
        .eq('id', 'main')
        .limit(1);

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

      const { error: upsertErr } = await supabase
        .from('app_state')
        .upsert({ id: 'main', data: state, updated_at: new Date().toISOString(), updated_by: payload.email });

      if (upsertErr) throw upsertErr;

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
