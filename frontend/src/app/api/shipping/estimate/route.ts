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
        { courier_code: 'jne', courier_name: 'JNE', service_code: 'yes', service_name: 'YES (1 hari)', price: 25000, min_day: 1, max_day: 1 },
        { courier_code: 'sicepat', courier_name: 'SiCepat', service_code: 'reg', service_name: 'Reguler', price: 12000, min_day: 1, max_day: 2 },
        { courier_code: 'sicepat', courier_name: 'SiCepat', service_code: 'best', service_name: 'BEST (Same Day)', price: 22000, min_day: 0, max_day: 1 },
        { courier_code: 'jnt', courier_name: 'J&T Express', service_code: 'reg', service_name: 'Reguler', price: 13000, min_day: 2, max_day: 4 },
        { courier_code: 'anteraja', courier_name: 'Anteraja', service_code: 'reg', service_name: 'Reguler', price: 11000, min_day: 2, max_day: 3 },
        { courier_code: 'pos', courier_name: 'POS Indonesia', service_code: 'reg', service_name: 'Paket Kilat', price: 14000, min_day: 3, max_day: 5 },
        { courier_code: 'tiki', courier_name: 'TIKI', service_code: 'reg', service_name: 'Reguler', price: 13500, min_day: 2, max_day: 4 },
        { courier_code: 'ninja', courier_name: 'Ninja Xpress', service_code: 'reg', service_name: 'Standard', price: 12500, min_day: 1, max_day: 3 },
        { courier_code: 'lion', courier_name: 'Lion Parcel', service_code: 'reg', service_name: 'REGPACK', price: 11500, min_day: 2, max_day: 4 },
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
        couriers: 'jne,sicepat,jnt,anteraja,pos,tiki,lion,ninja,idx,spx',
        items,
      }),
    });
    const data = await res.json();
    
    if (!res.ok) {
      console.error('[BiteShip rates error]', res.status, data);
      return Response.json({ success: false, message: 'BiteShip error', detail: data }, { status: 502 });
    }
    
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
