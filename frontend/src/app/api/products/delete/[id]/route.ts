import { NextRequest } from 'next/server';
import { execute, query } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  try {
    // Cek apakah produk ada
    const products = await query('SELECT id FROM products WHERE id = ?', [params.id]);
    if (products.length === 0) {
      return Response.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Hapus semua referensi terkait
    await execute('DELETE FROM wishlists WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM cart_items WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM product_images WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM product_reviews WHERE product_id = ?', [params.id]);
    await execute('DELETE FROM product_variants WHERE product_id = ?', [params.id]);
    // Hapus referensi di order_items (set product_id null atau hapus)
    await execute('DELETE FROM order_items WHERE product_id = ?', [params.id]);
    // Hapus produk
    await execute('DELETE FROM products WHERE id = ?', [params.id]);

    return Response.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err: any) {
    console.error('[DELETE product]', err);
    // Jika masih gagal karena constraint, nonaktifkan saja
    try {
      await execute('UPDATE products SET is_active = false WHERE id = ?', [params.id]);
      return Response.json({ success: true, message: 'Produk dinonaktifkan (tidak bisa dihapus karena terkait pesanan)' });
    } catch {
      return Response.json({ success: false, message: 'Gagal menghapus produk: ' + (err.message || '') }, { status: 500 });
    }
  }
}
