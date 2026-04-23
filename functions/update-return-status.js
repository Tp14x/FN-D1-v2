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
    const { carPlate, returnedAt, durationText, returnLocation } = await request.json();

    await env.DB.prepare(`
      UPDATE records
      SET return_status = 'returned', returned_at = ?, duration_text = ?, return_location = ?
      WHERE car = ? AND return_status = 'pending'
      ORDER BY timestamp DESC LIMIT 1
    `).bind(
      returnedAt || new Date().toISOString(),
      durationText || null,
      returnLocation ? JSON.stringify(returnLocation) : null,
      carPlate
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: cors });
  }
}
