import { Category, Product, Sale, FinancialEntry, User, DashboardStats } from '@/types';

export const categories: Category[] = [
  { id: '1', name: 'Électronique', description: 'Appareils électroniques et accessoires', color: '#2DD4BF' },
  { id: '2', name: 'Vêtements', description: 'Mode et textile', color: '#60A5FA' },
  { id: '3', name: 'Alimentation', description: 'Produits alimentaires', color: '#FBBF24' },
  { id: '4', name: 'Maison', description: 'Équipements pour la maison', color: '#A78BFA' },
  { id: '5', name: 'Beauté', description: 'Cosmétiques et soins', color: '#F472B6' },
];

// Products without salePrice - price is determined during sale negotiation
export const products: Product[] = [
  { id: '1', name: 'iPhone 15 Pro', categoryId: '1', purchasePrice: 540000, quantity: 25, minStock: 5, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Samsung Galaxy S24', categoryId: '1', purchasePrice: 420000, quantity: 18, minStock: 5, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'MacBook Pro 14"', categoryId: '1', purchasePrice: 900000, quantity: 8, minStock: 3, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'AirPods Pro', categoryId: '1', purchasePrice: 108000, quantity: 45, minStock: 10, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'T-shirt Premium', categoryId: '2', purchasePrice: 9000, quantity: 150, minStock: 30, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Jean Slim', categoryId: '2', purchasePrice: 15000, quantity: 80, minStock: 20, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Café Arabica 1kg', categoryId: '3', purchasePrice: 4800, quantity: 3, minStock: 10, unit: 'kg', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'Huile d\'olive 1L', categoryId: '3', purchasePrice: 3600, quantity: 0, minStock: 15, unit: 'L', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'Lampe LED', categoryId: '4', purchasePrice: 7200, quantity: 35, minStock: 10, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', name: 'Crème hydratante', categoryId: '5', purchasePrice: 6000, quantity: 60, minStock: 15, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
];

// Sales now include the negotiated salePrice and employee info
export const sales: Sale[] = [
  { id: '1', productId: '1', quantity: 2, unitPrice: 720000, totalAmount: 1440000, profit: 360000, date: new Date(), employeeId: '1', employeeName: 'Administrateur', status: 'completed' },
  { id: '2', productId: '4', quantity: 5, unitPrice: 167400, totalAmount: 837000, profit: 297000, date: new Date(), employeeId: '2', employeeName: 'Employé 1', status: 'completed' },
  { id: '3', productId: '5', quantity: 10, unitPrice: 21000, totalAmount: 210000, profit: 120000, date: new Date(), employeeId: '2', employeeName: 'Employé 1', status: 'completed' },
  { id: '4', productId: '6', quantity: 4, unitPrice: 35400, totalAmount: 141600, profit: 81600, date: new Date(), employeeId: '1', employeeName: 'Administrateur', status: 'completed' },
  { id: '5', productId: '10', quantity: 8, unitPrice: 15000, totalAmount: 120000, profit: 72000, date: new Date(), employeeId: '2', employeeName: 'Employé 1', status: 'completed' },
];

export const financialEntries: FinancialEntry[] = [
  { id: '1', type: 'income', category: 'Ventes', amount: 9000000, description: 'Ventes du jour', date: new Date() },
  { id: '2', type: 'income', category: 'Services', amount: 1500000, description: 'Services de livraison', date: new Date() },
  { id: '3', type: 'expense', category: 'Loyer', amount: 1800000, description: 'Loyer mensuel', date: new Date() },
  { id: '4', type: 'expense', category: 'Salaires', amount: 4800000, description: 'Salaires employés', date: new Date() },
  { id: '5', type: 'expense', category: 'Fournitures', amount: 300000, description: 'Fournitures de bureau', date: new Date() },
];

export const currentUser: User = {
  id: '1',
  name: 'Jean Dupont',
  email: 'jean.dupont@example.com',
  role: 'admin',
};

export const getDashboardStats = (): DashboardStats => {
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
  const totalRevenue = financialEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = financialEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const todaySales = sales.reduce((sum, s) => sum + s.totalAmount, 0);

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
  { month: 'Jan', ventes: 27000000, profit: 7200000 },
  { month: 'Fév', ventes: 31200000, profit: 8700000 },
  { month: 'Mar', ventes: 28800000, profit: 7920000 },
  { month: 'Avr', ventes: 36600000, profit: 10680000 },
  { month: 'Mai', ventes: 33000000, profit: 9360000 },
  { month: 'Jun', ventes: 40200000, profit: 11520000 },
];

export const expensesByCategory = [
  { category: 'Salaires', amount: 27000000, percentage: 45 },
  { category: 'Loyer', amount: 10800000, percentage: 18 },
  { category: 'Fournitures', amount: 7200000, percentage: 12 },
  { category: 'Marketing', amount: 9000000, percentage: 15 },
  { category: 'Autres', amount: 6000000, percentage: 10 },
];
