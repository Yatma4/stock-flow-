import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Sale, SaleItem, PaymentMethod } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { showRealtimeToast } from '@/hooks/use-realtime-toast';

interface SalesContextType {
  sales: Sale[];
  addSale: (sale: Sale) => void;
  cancelSale: (saleId: string, reason: string, cancelledBy: string) => void;
  deleteCancelledSale: (saleId: string) => void;
  deleteCancelledSales: () => void;
  loading: boolean;
}

const SalesContext = createContext<SalesContextType | null>(null);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      setLoading(false);
      return;
    }

    // Fetch all sale items
    const saleIds = salesData.map(s => s.id);
    let allItems: SaleItem[] = [];
    
    if (saleIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .in('sale_id', saleIds);
      
      if (!itemsError && itemsData) {
        allItems = itemsData.map(item => ({
          id: item.id,
          saleId: item.sale_id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          purchasePrice: Number(item.purchase_price),
          totalAmount: Number(item.total_amount),
          profit: Number(item.profit),
        }));
      }
    }

    const mapped: Sale[] = salesData.map(s => ({
      id: s.id,
      items: allItems.filter(item => item.saleId === s.id),
      totalAmount: Number(s.total_amount),
      totalProfit: Number(s.total_profit),
      paymentMethod: s.payment_method as PaymentMethod,
      date: new Date(s.date),
      employeeId: s.employee_id,
      employeeName: s.employee_name,
      clientName: (s as any).client_name || undefined,
      status: s.status as 'completed' | 'cancelled',
      cancelReason: s.cancel_reason || undefined,
      cancelledAt: s.cancelled_at ? new Date(s.cancelled_at) : undefined,
      cancelledBy: s.cancelled_by || undefined,
    }));

    setSales(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSales();
    const channel = supabase
      .channel('sales-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        fetchSales();
        showRealtimeToast('Ventes');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sale_items' }, () => {
        fetchSales();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSales]);

  const addSale = async (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    
    // Insert sale header
    const { error: saleError } = await supabase.from('sales').insert({
      id: sale.id,
      total_amount: sale.totalAmount,
      total_profit: sale.totalProfit,
      payment_method: sale.paymentMethod,
      employee_id: sale.employeeId,
      employee_name: sale.employeeName,
      client_name: sale.clientName || null,
      status: sale.status,
      date: sale.date.toISOString(),
    } as any);
    
    if (saleError) {
      console.error('Error adding sale:', saleError);
      return;
    }

    // Insert sale items
    if (sale.items.length > 0) {
      const { error: itemsError } = await supabase.from('sale_items').insert(
        sale.items.map(item => ({
          id: item.id,
          sale_id: sale.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          purchase_price: item.purchasePrice,
          total_amount: item.totalAmount,
          profit: item.profit,
        }))
      );
      if (itemsError) console.error('Error adding sale items:', itemsError);
    }
  };

  const cancelSale = async (saleId: string, reason: string, cancelledBy: string) => {
    const now = new Date();
    setSales(prev => prev.map(s =>
      s.id === saleId ? {
        ...s,
        status: 'cancelled' as const,
        cancelReason: reason,
        cancelledAt: now,
        cancelledBy,
      } : s
    ));
    
    const { error } = await supabase.from('sales').update({
      status: 'cancelled',
      cancel_reason: reason,
      cancelled_at: now.toISOString(),
      cancelled_by: cancelledBy,
    }).eq('id', saleId);
    if (error) console.error('Error cancelling sale:', error);
  };

  const deleteCancelledSale = async (saleId: string) => {
    setSales(prev => prev.filter(s => !(s.id === saleId && s.status === 'cancelled')));
    const { error } = await supabase.from('sales').delete().eq('id', saleId);
    if (error) console.error('Error deleting sale:', error);
  };

  const deleteCancelledSales = async () => {
    const cancelledIds = sales.filter(s => s.status === 'cancelled').map(s => s.id);
    setSales(prev => prev.filter(s => s.status !== 'cancelled'));
    if (cancelledIds.length > 0) {
      const { error } = await supabase.from('sales').delete().in('id', cancelledIds);
      if (error) console.error('Error deleting cancelled sales:', error);
    }
  };

  return (
    <SalesContext.Provider value={{
      sales,
      addSale,
      cancelSale,
      deleteCancelledSale,
      deleteCancelledSales,
      loading,
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
