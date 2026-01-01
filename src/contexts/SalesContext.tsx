import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale } from '@/types';

interface SalesContextType {
  sales: Sale[];
  addSale: (sale: Sale) => void;
  updateSale: (saleId: string, data: Partial<Sale>) => void;
  cancelSale: (saleId: string, reason: string, cancelledBy: string) => void;
  deleteCancelledSale: (saleId: string) => void;
  deleteCancelledSales: () => void;
}

const SalesContext = createContext<SalesContextType | null>(null);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>(() => {
    const stored = localStorage.getItem('app_sales');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Restore date objects
      return parsed.map((s: Sale) => ({
        ...s,
        date: new Date(s.date),
        cancelledAt: s.cancelledAt ? new Date(s.cancelledAt) : undefined,
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('app_sales', JSON.stringify(sales));
  }, [sales]);

  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
  };

  const updateSale = (saleId: string, data: Partial<Sale>) => {
    setSales(prev => prev.map(s => 
      s.id === saleId ? { ...s, ...data } : s
    ));
  };

  const cancelSale = (saleId: string, reason: string, cancelledBy: string) => {
    setSales(prev => prev.map(s => 
      s.id === saleId ? { 
        ...s, 
        status: 'cancelled' as const,
        cancelReason: reason,
        cancelledAt: new Date(),
        cancelledBy,
      } : s
    ));
  };

  const deleteCancelledSale = (saleId: string) => {
    setSales(prev => prev.filter(s => !(s.id === saleId && s.status === 'cancelled')));
  };

  const deleteCancelledSales = () => {
    setSales(prev => prev.filter(s => s.status !== 'cancelled'));
  };

  return (
    <SalesContext.Provider value={{
      sales,
      addSale,
      updateSale,
      cancelSale,
      deleteCancelledSale,
      deleteCancelledSales,
    }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
