import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { showRealtimeToast } from '@/hooks/use-realtime-toast';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => Promise<boolean>;
  updateProduct: (productId: string, data: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  updateStock: (productId: string, quantityChange: number) => void;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) {
      console.error('Error fetching products:', error);
      const stored = localStorage.getItem('app_products');
      if (stored) setProducts(JSON.parse(stored));
    } else {
      const mapped = data.map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.category_id || '',
        purchasePrice: Number(p.purchase_price),
        quantity: p.quantity,
        minStock: p.min_stock,
        unit: p.unit,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));
      setProducts(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
        showRealtimeToast('Produits');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchProducts]);

  const addProduct = async (product: Product) => {
    setProducts(prev => [...prev, product]);
    const { error } = await supabase.from('products').insert({
      id: product.id,
      name: product.name,
      category_id: product.categoryId || null,
      purchase_price: product.purchasePrice,
      quantity: product.quantity,
      min_stock: product.minStock,
      unit: product.unit,
    });
    if (error) console.error('Error adding product:', error);
  };

  const updateProduct = async (productId: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, ...data, updatedAt: new Date() } : p
    ));
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId || null;
    if (data.purchasePrice !== undefined) updateData.purchase_price = data.purchasePrice;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.minStock !== undefined) updateData.min_stock = data.minStock;
    if (data.unit !== undefined) updateData.unit = data.unit;

    const { error } = await supabase.from('products').update(updateData).eq('id', productId);
    if (error) console.error('Error updating product:', error);
  };

  const deleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) console.error('Error deleting product:', error);
  };

  const updateStock = async (productId: string, quantityChange: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newQuantity = product.quantity + quantityChange;
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, quantity: newQuantity, updatedAt: new Date() } : p
    ));
    const { error } = await supabase.from('products').update({ quantity: newQuantity }).eq('id', productId);
    if (error) console.error('Error updating stock:', error);
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      updateStock,
      loading,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
