import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Quote, QuoteItem, QuoteStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { showRealtimeToast } from '@/hooks/use-realtime-toast';

interface QuoteContextType {
  quotes: Quote[];
  addQuote: (quote: Quote) => void;
  updateQuote: (quoteId: string, data: Partial<Quote>) => void;
  deleteQuote: (quoteId: string) => void;
  loading: boolean;
}

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    const { data: quotesData, error } = await supabase
      .from('quotes')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      setLoading(false);
      return;
    }

    const quoteIds = quotesData.map(q => q.id);
    let allItems: QuoteItem[] = [];

    if (quoteIds.length > 0) {
      const { data: itemsData } = await supabase
        .from('quote_items')
        .select('*')
        .in('quote_id', quoteIds);

      if (itemsData) {
        allItems = itemsData.map(item => ({
          id: item.id,
          quoteId: item.quote_id,
          productId: item.product_id || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalAmount: Number(item.total_amount),
        }));
      }
    }

    const mapped: Quote[] = quotesData.map(q => ({
      id: q.id,
      quoteNumber: q.quote_number,
      clientName: q.client_name,
      clientPhone: q.client_phone || undefined,
      clientEmail: q.client_email || undefined,
      clientAddress: q.client_address || undefined,
      items: allItems.filter(item => item.quoteId === q.id),
      totalAmount: Number(q.total_amount),
      status: q.status as QuoteStatus,
      validUntil: q.valid_until ? new Date(q.valid_until) : undefined,
      notes: q.notes || undefined,
      createdBy: q.created_by,
      date: new Date(q.date),
      createdAt: new Date(q.created_at),
      updatedAt: new Date(q.updated_at),
    }));

    setQuotes(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuotes();
    const channel = supabase
      .channel('quotes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        fetchQuotes();
        showRealtimeToast('Devis');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_items' }, () => {
        fetchQuotes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchQuotes]);

  const addQuote = async (quote: Quote) => {
    setQuotes(prev => [quote, ...prev]);

    const { error: quoteError } = await supabase.from('quotes').insert({
      id: quote.id,
      quote_number: quote.quoteNumber,
      client_name: quote.clientName,
      client_phone: quote.clientPhone || null,
      client_email: quote.clientEmail || null,
      client_address: quote.clientAddress || null,
      total_amount: quote.totalAmount,
      status: quote.status,
      valid_until: quote.validUntil ? quote.validUntil.toISOString().split('T')[0] : null,
      notes: quote.notes || null,
      created_by: quote.createdBy,
      date: quote.date.toISOString(),
    });

    if (quoteError) { console.error('Error adding quote:', quoteError); return; }

    if (quote.items.length > 0) {
      await supabase.from('quote_items').insert(
        quote.items.map(item => ({
          id: item.id,
          quote_id: quote.id,
          product_id: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_amount: item.totalAmount,
        }))
      );
    }
  };

  const updateQuote = async (quoteId: string, data: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, ...data, updatedAt: new Date() } : q));
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.clientName !== undefined) updateData.client_name = data.clientName;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    await supabase.from('quotes').update(updateData).eq('id', quoteId);
  };

  const deleteQuote = async (quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
    await supabase.from('quotes').delete().eq('id', quoteId);
  };

  return (
    <QuoteContext.Provider value={{ quotes, addQuote, updateQuote, deleteQuote, loading }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuotes() {
  const context = useContext(QuoteContext);
  if (!context) throw new Error('useQuotes must be used within a QuoteProvider');
  return context;
}
