import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { getDashboardStats } from '@/data/mockData';
import {
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

export default function Dashboard() {
  const stats = getDashboardStats();

  return (
    <MainLayout
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Valeur du stock"
            value={`${stats.totalStockValue.toLocaleString()} €`}
            icon={Package}
            trend={{ value: 12, isPositive: true }}
            variant="primary"
          />
          <StatCard
            title="Ventes du jour"
            value={`${stats.todaySales.toLocaleString()} €`}
            icon={ShoppingCart}
            trend={{ value: 8, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Bénéfice net"
            value={`${stats.netProfit.toLocaleString()} €`}
            icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown}
            trend={{ value: 15, isPositive: stats.netProfit >= 0 }}
            variant={stats.netProfit >= 0 ? 'success' : 'danger'}
          />
          <StatCard
            title="Alertes stock"
            value={stats.lowStockProducts + stats.outOfStockProducts}
            icon={AlertTriangle}
            variant={stats.lowStockProducts + stats.outOfStockProducts > 0 ? 'warning' : 'default'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SalesChart />
          <ExpensesChart />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentSales />
          <AlertCard />
        </div>
      </div>
    </MainLayout>
  );
}
