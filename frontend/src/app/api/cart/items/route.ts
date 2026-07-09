import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { product_id, variant_id, qty = 1 } = await req.json();
  if (!product_id) return Response.json({ success: false, message: 'product_id wajib' }, { status: 400 });

  const products = await query('SELECT id, price, discount_price, stock FROM products WHERE id = ? AND is_active = true', [product_id]);
  if (products.length === 0) return Response.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });

  let priceSnapshot = Number(products[0].discount_price || products[0].price);
  let availableStock = products[0].stock;

  if (variant_id) {
    const variants = await query('SELECT price, stock FROM product_variants WHERE id = ? AND product_id = ?', [variant_id, product_id]);
    if (variants.length === 0) return Response.json({ success: false, message: 'Varian tidak ditemukan' }, { status: 404 });
    if (variants[0].price) priceSnapshot = Number(variants[0].price);
    availableStock = variants[0].stock;
  }

  if (qty > availableStock) {
    return Response.json({ success: false, message: `Stok tidak mencukupi (tersedia: ${availableStock})` }, { status: 400 });
  }

  // Get cart
  let carts = await query('SELECT id FROM carts WHERE user_id = ?', [user.id]);
  if (carts.length === 0) {
    const cartId = uuidv4();
    await execute('INSERT INTO carts (id, user_id) VALUES (?,?)', [cartId, user.id]);
    carts = [{ id: cartId }];
  }
  const cartId = carts[0].id;

  // Check existing
  let existing;
  if (variant_id) {
    existing = await query(
      'SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?',
      [cartId, product_id, variant_id]
    );
  } else {
    existing = await query(
      'SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id IS NULL',
      [cartId, product_id]
    );
  }

  if (existing.length > 0) {
    const newQty = existing[0].qty + qty;
    if (newQty > availableStock) {
      return Response.json({ success: false, message: `Stok tidak mencukupi` }, { status: 400 });
    }
    await execute('UPDATE cart_items SET qty = ? WHERE id = ?', [newQty, existing[0].id]);
  } else {
    await execute(
      'INSERT INTO cart_items (id, cart_id, product_id, variant_id, qty, price_snapshot) VALUES (?,?,?,?,?,?)',
      [uuidv4(), cartId, product_id, variant_id || null, qty, priceSnapshot]
    );
  }

  return Response.json({ success: true, message: 'Produk ditambahkan ke keranjang' }, { status: 201 });
}
