import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { FinancialEntry } from '@/types';

interface FinanceContextType {
  entries: FinancialEntry[];
  addEntry: (entry: FinancialEntry) => void;
  updateEntry: (entryId: string, data: Partial<FinancialEntry>) => void;
  deleteEntry: (entryId: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FinancialEntry[]>(() => {
    const stored = localStorage.getItem('app_finances');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((e: FinancialEntry) => ({
        ...e,
        date: new Date(e.date),
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('app_finances', JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry: FinancialEntry) => {
    setEntries(prev => [entry, ...prev]);
  };

  const updateEntry = (entryId: string, data: Partial<FinancialEntry>) => {
    setEntries(prev => prev.map(e => 
      e.id === entryId ? { ...e, ...data } : e
    ));
  };

  const deleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  return (
    <FinanceContext.Provider value={{
      entries,
      addEntry,
      updateEntry,
      deleteEntry,
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
