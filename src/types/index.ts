export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
}

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

export type PaymentMethod = 'cash' | 'mobile_money' | 'bank_transfer' | 'check';

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement bancaire',
  check: 'Chèque',
};

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  totalAmount: number;
  profit: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
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
  period: 'daily' | 'monthly' | 'semester' | 'annual';
  name: string;
  content: string;
  generatedAt: Date;
  generatedBy: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Rejeté',
  expired: 'Expiré',
};

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  items: QuoteItem[];
  totalAmount: number;
  status: QuoteStatus;
  validUntil?: Date;
  notes?: string;
  createdBy: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
