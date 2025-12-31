import { Category, Product, Sale, FinancialEntry, User, DashboardStats } from '@/types';

export const categories: Category[] = [
  { id: '1', name: 'Électronique', description: 'Appareils électroniques et accessoires', color: '#2DD4BF' },
  { id: '2', name: 'Vêtements', description: 'Mode et textile', color: '#60A5FA' },
  { id: '3', name: 'Alimentation', description: 'Produits alimentaires', color: '#FBBF24' },
  { id: '4', name: 'Maison', description: 'Équipements pour la maison', color: '#A78BFA' },
  { id: '5', name: 'Beauté', description: 'Cosmétiques et soins', color: '#F472B6' },
];

export const products: Product[] = [
  { id: '1', name: 'iPhone 15 Pro', categoryId: '1', purchasePrice: 900, salePrice: 1199, quantity: 25, minStock: 5, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Samsung Galaxy S24', categoryId: '1', purchasePrice: 700, salePrice: 999, quantity: 18, minStock: 5, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'MacBook Pro 14"', categoryId: '1', purchasePrice: 1500, salePrice: 2199, quantity: 8, minStock: 3, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'AirPods Pro', categoryId: '1', purchasePrice: 180, salePrice: 279, quantity: 45, minStock: 10, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'T-shirt Premium', categoryId: '2', purchasePrice: 15, salePrice: 35, quantity: 150, minStock: 30, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Jean Slim', categoryId: '2', purchasePrice: 25, salePrice: 59, quantity: 80, minStock: 20, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Café Arabica 1kg', categoryId: '3', purchasePrice: 8, salePrice: 15, quantity: 3, minStock: 10, unit: 'kg', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'Huile d\'olive 1L', categoryId: '3', purchasePrice: 6, salePrice: 12, quantity: 0, minStock: 15, unit: 'L', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'Lampe LED', categoryId: '4', purchasePrice: 12, salePrice: 29, quantity: 35, minStock: 10, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', name: 'Crème hydratante', categoryId: '5', purchasePrice: 10, salePrice: 25, quantity: 60, minStock: 15, unit: 'pièce', createdAt: new Date(), updatedAt: new Date() },
];

export const sales: Sale[] = [
  { id: '1', productId: '1', quantity: 2, unitPrice: 1199, totalAmount: 2398, profit: 598, date: new Date() },
  { id: '2', productId: '4', quantity: 5, unitPrice: 279, totalAmount: 1395, profit: 495, date: new Date() },
  { id: '3', productId: '5', quantity: 10, unitPrice: 35, totalAmount: 350, profit: 200, date: new Date() },
  { id: '4', productId: '6', quantity: 4, unitPrice: 59, totalAmount: 236, profit: 136, date: new Date() },
  { id: '5', productId: '10', quantity: 8, unitPrice: 25, totalAmount: 200, profit: 120, date: new Date() },
];

export const financialEntries: FinancialEntry[] = [
  { id: '1', type: 'income', category: 'Ventes', amount: 15000, description: 'Ventes du jour', date: new Date() },
  { id: '2', type: 'income', category: 'Services', amount: 2500, description: 'Services de livraison', date: new Date() },
  { id: '3', type: 'expense', category: 'Loyer', amount: 3000, description: 'Loyer mensuel', date: new Date() },
  { id: '4', type: 'expense', category: 'Salaires', amount: 8000, description: 'Salaires employés', date: new Date() },
  { id: '5', type: 'expense', category: 'Fournitures', amount: 500, description: 'Fournitures de bureau', date: new Date() },
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
  { month: 'Jan', ventes: 45000, profit: 12000 },
  { month: 'Fév', ventes: 52000, profit: 14500 },
  { month: 'Mar', ventes: 48000, profit: 13200 },
  { month: 'Avr', ventes: 61000, profit: 17800 },
  { month: 'Mai', ventes: 55000, profit: 15600 },
  { month: 'Jun', ventes: 67000, profit: 19200 },
];

export const expensesByCategory = [
  { category: 'Salaires', amount: 45000, percentage: 45 },
  { category: 'Loyer', amount: 18000, percentage: 18 },
  { category: 'Fournitures', amount: 12000, percentage: 12 },
  { category: 'Marketing', amount: 15000, percentage: 15 },
  { category: 'Autres', amount: 10000, percentage: 10 },
];
