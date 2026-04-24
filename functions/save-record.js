const getCorsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
});

export async function onRequestOptions() {
  return new Response('', {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // แก้ไข: จัดการ CORS อย่างปลอดภัย
  const allowedOrigin = env.ALLOWED_ORIGIN || '*'; 
  const cors = getCorsHeaders(allowedOrigin);

  try {
    const record = await request.json();
    
    // Validation: ตรวจสอบข้อมูลจำเป็น
    if (!record.car || !record.mileage) {
       return new Response(JSON.stringify({ success: false, error: 'Missing required fields: car or mileage' }), { 
         status: 400, 
         headers: cors 
       });
    }

    const id = Date.now().toString();
    const timestamp = new Date().toISOString();

    // บันทึกข้อมูลลง Database
    await env.DB.prepare(`
      INSERT INTO records
      (id, user_id, name, phone, car, mileage, reason, route_text,
      total_distance, total_time, has_photo, photo_data, return_status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
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
      record.photoBase64 || null, // เก็บรูปถ้ามี
      timestamp
    ).run();

    return new Response(JSON.stringify({ success: true, id }), { 
      status: 200, 
      headers: cors 
    });

  } catch (e) {
    console.error("Save Record Error:", e);
    return new Response(JSON.stringify({ success: false, error: "Internal Server Error" }), { 
      status: 500, 
      headers: cors 
    });
  }
}
