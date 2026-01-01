export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
}

// Product no longer has salePrice - price is negotiated during sale
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  purchasePrice: number;
  quantity: number;
  minStock: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number; // This is the negotiated sale price
  totalAmount: number;
  profit: number; // Calculated as (unitPrice - purchasePrice) * quantity
  date: Date;
  employeeId: string;
  employeeName: string;
  status: 'completed' | 'cancelled';
  cancelReason?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
}

export interface FinancialEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  todaySales: number;
}

export interface Report {
  id: string;
  type: 'sales' | 'financial' | 'stock' | 'profit';
  period: 'daily' | 'monthly' | 'semester';
  name: string;
  content: string;
  generatedAt: Date;
  generatedBy: string;
}
