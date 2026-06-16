import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    try {
      setCartLoading(true);
      const { data } = await cartAPI.get();
      setCart(data.data);
    } catch {} finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCart();
    else setCart({ items: [], total: 0, item_count: 0 });
  }, [user]);

  const addToCart = async (product_id, quantity = 1) => {
    try {
      await cartAPI.add({ product_id, quantity });
      await fetchCart();
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const removeFromCart = async (product_id) => {
    try {
      await cartAPI.remove(product_id);
      await fetchCart();
      toast.success('Removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [], total: 0, item_count: 0 });
    } catch {}
  };

  return (
    <CartContext.Provider value={{ cart, cartLoading, addToCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
