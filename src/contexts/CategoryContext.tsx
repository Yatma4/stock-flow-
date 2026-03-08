import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Category } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { showRealtimeToast } from '@/hooks/use-realtime-toast';

interface CategoryContextType {
  categories: Category[];
  addCategory: (category: Category) => Promise<boolean>;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      console.error('Error fetching categories:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('app_categories');
      if (stored) setCategories(JSON.parse(stored));
    } else {
      const mapped = data.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        color: c.color,
      }));
      setCategories(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
    const channel = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
        showRealtimeToast('Catégories');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCategories]);

  const addCategory = async (category: Category) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        description: category.description || null,
        color: category.color,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Error adding category:', error);
      return false;
    }

    setCategories(prev => [
      ...prev,
      {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        color: data.color,
      },
    ]);

    return true;
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    const { error } = await supabase.from('categories').update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.color !== undefined && { color: data.color }),
    }).eq('id', id);
    if (error) console.error('Error updating category:', error);
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) console.error('Error deleting category:', error);
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
