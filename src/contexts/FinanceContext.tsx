import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { FinancialEntry } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface FinanceContextType {
  entries: FinancialEntry[];
  addEntry: (entry: FinancialEntry) => void;
  updateEntry: (entryId: string, data: Partial<FinancialEntry>) => void;
  deleteEntry: (entryId: string) => void;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase.from('financial_entries').select('*').order('date', { ascending: false });
    if (error) {
      console.error('Error fetching entries:', error);
      const stored = localStorage.getItem('app_finances');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEntries(parsed.map((e: FinancialEntry) => ({ ...e, date: new Date(e.date) })));
      }
    } else {
      setEntries(data.map(e => ({
        id: e.id,
        type: e.type as 'income' | 'expense',
        category: e.category,
        amount: Number(e.amount),
        description: e.description,
        date: new Date(e.date),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
    const channel = supabase
      .channel('finances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_entries' }, () => {
        fetchEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEntries]);

  const addEntry = async (entry: FinancialEntry) => {
    setEntries(prev => [entry, ...prev]);
    const { error } = await supabase.from('financial_entries').insert({
      id: entry.id,
      type: entry.type,
      category: entry.category,
      amount: entry.amount,
      description: entry.description,
      date: entry.date.toISOString(),
    });
    if (error) console.error('Error adding entry:', error);
  };

  const updateEntry = async (entryId: string, data: Partial<FinancialEntry>) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...data } : e));
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = data.date.toISOString();
    
    const { error } = await supabase.from('financial_entries').update(updateData).eq('id', entryId);
    if (error) console.error('Error updating entry:', error);
  };

  const deleteEntry = async (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    const { error } = await supabase.from('financial_entries').delete().eq('id', entryId);
    if (error) console.error('Error deleting entry:', error);
  };

  return (
    <FinanceContext.Provider value={{
      entries,
      addEntry,
      updateEntry,
      deleteEntry,
      loading,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinances() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinances must be used within a FinanceProvider');
  }
  return context;
}
