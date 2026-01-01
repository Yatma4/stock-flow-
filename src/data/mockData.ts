import { DashboardStats } from '@/types';

// Empty initial data - all data is now managed via contexts with localStorage persistence
export const categories: never[] = [];
export const products: never[] = [];
export const sales: never[] = [];
export const financialEntries: never[] = [];

export const getDashboardStats = (
  products: { purchasePrice: number; quantity: number; minStock: number }[],
  financialEntries: { type: 'income' | 'expense'; amount: number }[],
  sales: { totalAmount: number; status: string }[]
): DashboardStats => {
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
  const totalRevenue = financialEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = financialEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const todaySales = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0);

  return {
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalStockValue,
    totalRevenue,
    totalExpenses,
    netProfit,
    todaySales,
  };
};

export const salesByMonth = [
  { month: 'Jan', ventes: 0, profit: 0 },
  { month: 'Fév', ventes: 0, profit: 0 },
  { month: 'Mar', ventes: 0, profit: 0 },
  { month: 'Avr', ventes: 0, profit: 0 },
  { month: 'Mai', ventes: 0, profit: 0 },
  { month: 'Jun', ventes: 0, profit: 0 },
];

export const expensesByCategory = [
  { category: 'Salaires', amount: 0, percentage: 0 },
  { category: 'Loyer', amount: 0, percentage: 0 },
  { category: 'Fournitures', amount: 0, percentage: 0 },
  { category: 'Marketing', amount: 0, percentage: 0 },
  { category: 'Autres', amount: 0, percentage: 0 },
];
