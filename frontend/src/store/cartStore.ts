import { create } from 'zustand';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  slug: string;
  thumbnail_url?: string;
  variant_name?: string;
  qty: number;
  price_snapshot: number;
  is_selected: boolean;
  stock: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (product_id: string, qty?: number, variant_id?: string) => Promise<void>;
  updateItem: (id: string, qty?: number, is_selected?: boolean) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  totalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  isLoading: false,

  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ items: data.data.items, subtotal: data.data.subtotal });
    } catch {
      // silent — user mungkin belum login
    }
  },

  addItem: async (product_id, qty = 1, variant_id) => {
    try {
      await api.post('/cart/items', { product_id, qty, variant_id });
      toast.success('Produk ditambahkan ke keranjang');
      await get().fetchCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan ke keranjang');
    }
  },

  updateItem: async (id, qty, is_selected) => {
    try {
      await api.patch(`/cart/items/${id}`, { qty, is_selected });
      await get().fetchCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui keranjang');
    }
  },

  removeItem: async (id) => {
    try {
      await api.delete(`/cart/items/${id}`);
      toast.success('Item dihapus dari keranjang');
      await get().fetchCart();
    } catch {
      toast.error('Gagal menghapus item');
    }
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
