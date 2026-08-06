/**
 * POST /api/auth
 * Body: { email, password }
 * Returns: { token, user: { id, email, name, role }, state }
 */
const bcrypt  = require('bcryptjs');
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

exports.handler = async (event) => {
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
    const supabase = getSupabase();

    // 1. Buscar usuario
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('estado', 'Activo')
      .ilike('email', email.trim())
      .limit(1);

    if (userErr) throw userErr;
    if (!users || users.length === 0) {
      return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
    }

    const user = users[0];

    // 2. Verificar contraseña
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
    }

    // 3. Emitir JWT (7 días)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Obtener estado de la app
    const { data: stateRows } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 'main')
      .limit(1);

    const state = stateRows && stateRows.length ? stateRows[0].data : null;

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
    console.error('[auth] error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};
