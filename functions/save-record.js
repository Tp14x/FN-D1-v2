const getCorsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
});

export async function onRequestOptions() {
  return new Response('', {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const cors = getCorsHeaders(env.ALLOWED_ORIGIN);

  try {
    const record = await request.json();
    const id = Date.now().toString();

    await env.DB.prepare(`
      INSERT INTO records
        (id, user_id, name, phone, car, mileage, reason, route_text,
         total_distance, total_time, has_photo, return_status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      id,
      record.userId || null,
      record.mappedName || record.name || 'ไม่ระบุชื่อ',
      record.phone || '-',
      record.car || '-',
      record.mileage || '0',
      record.reason || '',
      record.routeText || '',
      record.totalDistance || 0,
      record.totalTime || 0,
      record.hasPhoto ? 1 : 0,
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({ success: true, id }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: cors });
  }
}
