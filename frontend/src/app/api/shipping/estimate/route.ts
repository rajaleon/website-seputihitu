import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { destination_postal_code, destination_city_name, items } = await req.json();
  if (!destination_postal_code || !items?.length) {
    return Response.json({ success: false, message: 'Kode pos tujuan dan items wajib diisi' }, { status: 400 });
  }

  const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;
  if (!BITESHIP_API_KEY || BITESHIP_API_KEY.includes('demo')) {
    // Mock response untuk demo
    return Response.json({
      success: true,
      data: [
        { courier_code: 'jne', courier_name: 'JNE', service_code: 'reg', service_name: 'Reguler', price: 15000, min_day: 2, max_day: 3 },
        { courier_code: 'sicepat', courier_name: 'SiCepat', service_code: 'reg', service_name: 'Reguler', price: 12000, min_day: 1, max_day: 2 },
        { courier_code: 'jnt', courier_name: 'J&T Express', service_code: 'reg', service_name: 'Reguler', price: 13000, min_day: 2, max_day: 4 },
        { courier_code: 'anteraja', courier_name: 'Anteraja', service_code: 'reg', service_name: 'Reguler', price: 11000, min_day: 2, max_day: 3 },
      ],
    });
  }

  // Real BiteShip call
  try {
    const res = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${BITESHIP_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_postal_code: process.env.BITESHIP_ORIGIN_POSTAL_CODE || '10110',
        destination_postal_code,
        destination_city_name: destination_city_name || '',
        couriers: 'jne,sicepat,jnt,anteraja',
        items,
      }),
    });
    const data = await res.json();
    const couriers = data.pricing?.map((p: any) => ({
      courier_code: p.courier_code, courier_name: p.courier_name,
      service_code: p.service_code || p.courier_service_code,
      service_name: p.service_name || p.courier_service_name,
      price: p.price, min_day: p.min_day, max_day: p.max_day,
    })) || [];
    return Response.json({ success: true, data: couriers });
  } catch {
    return Response.json({ success: false, message: 'Gagal menghubungi Biteship' }, { status: 502 });
  }
}
