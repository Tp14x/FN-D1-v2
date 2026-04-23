const getCorsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
});

export async function onRequestOptions() {
  return new Response('', {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const cors = getCorsHeaders(env.ALLOWED_ORIGIN);

  try {
    const url = new URL(request.url);
    const requestingUserId = url.searchParams.get('userId');

    if (requestingUserId && requestingUserId === env.ADMIN_USER_ID) {
      const existing = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
        .bind(requestingUserId).first();

      if (!existing) {
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO users (user_id, name, phone, department, role, status, picture_url, created_at, updated_at)
          VALUES (?, 'Admin', '', 'Admin', 'admin', 'active', null, ?, ?)
        `).bind(requestingUserId, now, now).run();
      }
    }

    const { results } = await env.DB.prepare('SELECT * FROM users').all();
    const userMap = {};
    for (const u of results) {
      userMap[u.user_id] = {
        name: u.name,
        phone: u.phone,
        department: u.department,
        role: u.role,
        status: u.status,
        pictureUrl: u.picture_url,
        updatedAt: u.updated_at
      };
    }

    return new Response(JSON.stringify(userMap), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
}
