import { NextRequest } from 'next/server';
import { execute } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  try {
    // Hapus data terkait dulu (cascade seharusnya handle, tapi just in case)
    await execute('DELETE FROM cart_items WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM product_images WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM product_variants WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM product_reviews WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM products WHERE id = ?', [params.id]);

    return Response.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err: any) {
    console.error('[DELETE product]', err);
    return Response.json({ success: false, message: err.message || 'Gagal menghapus produk' }, { status: 500 });
  }
}
