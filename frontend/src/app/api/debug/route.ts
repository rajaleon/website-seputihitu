import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  // Cek env vars (masked)
  const mask = (s: string | undefined) => s ? s.substring(0, 10) + '...' + s.substring(s.length - 4) : 'NOT SET';

  return Response.json({
    success: true,
    env: {
      DATABASE_URL: mask(process.env.DATABASE_URL),
      BITESHIP_API_KEY: mask(process.env.BITESHIP_API_KEY),
      BITESHIP_ORIGIN_POSTAL_CODE: process.env.BITESHIP_ORIGIN_POSTAL_CODE || 'NOT SET',
      JWT_SECRET: mask(process.env.JWT_SECRET),
      MIDTRANS_SERVER_KEY: mask(process.env.MIDTRANS_SERVER_KEY),
      STORE_PHONE: process.env.STORE_PHONE || 'NOT SET',
      STORE_ADDRESS: process.env.STORE_ADDRESS || 'NOT SET',
    }
  });
}
