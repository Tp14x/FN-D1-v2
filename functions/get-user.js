const getCorsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
});

export async function onRequest(context) {
  const { request, env } = context;
  const cors = getCorsHeaders(env.ALLOWED_ORIGIN);

  if (request.method === 'OPTIONS') return new Response('', { status: 200, headers: cors });
  if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });

  try {
    const url = new URL(request.url);
    const requestingUserId = url.searchParams.get('userId');

    // ถ้าเป็น Admin และยังไม่มีใน DB → สร้างให้อัตโนมัติ
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

    // ดึงข้อมูล users ทั้งหมด
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
