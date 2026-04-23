const getCorsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
});

export async function onRequestOptions() {
  return new Response('', {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const cors = getCorsHeaders(env.ALLOWED_ORIGIN);

  context.waitUntil((async () => {
    try {
      const loginData = await request.clone().json();
      const userId = loginData.userId || null;
      if (userId) {
        await env.DB.prepare(
          'UPDATE users SET updated_at = ? WHERE user_id = ?'
        ).bind(new Date().toISOString(), userId).run();
      }
    } catch (_) {}
  })());

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
}

export async function onRequestGet(context) {
  const { env } = context;
  const cors = getCorsHeaders(env.ALLOWED_ORIGIN);
  return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: cors });
}
