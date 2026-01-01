import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { getDashboardStats } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = getDashboardStats();

  return (
    <MainLayout title="Tableau de bord" subtitle="Vue d'ensemble de votre activité">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
          <motion.div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium" animate={{ boxShadow: ['0 0 0 0 hsl(173 58% 39% / 0)', '0 0 0 8px hsl(173 58% 39% / 0)'] }} transition={{ duration: 2, repeat: Infinity }}>
            <motion.span animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Activity className="h-4 w-4" />
            </motion.span>
            Données en temps réel
          </motion.div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Valeur du stock" value={formatCurrency(stats.totalStockValue)} icon={Package} trend={{ value: 12, isPositive: true }} variant="primary" index={0} />
          <StatCard title="Ventes du jour" value={formatCurrency(stats.todaySales)} icon={ShoppingCart} trend={{ value: 8, isPositive: true }} variant="success" index={1} />
          <StatCard title="Bénéfice net" value={formatCurrency(stats.netProfit)} icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown} trend={{ value: 15, isPositive: stats.netProfit >= 0 }} variant={stats.netProfit >= 0 ? 'success' : 'danger'} index={2} />
          <StatCard title="Alertes stock" value={stats.lowStockProducts + stats.outOfStockProducts} icon={AlertTriangle} variant={stats.lowStockProducts + stats.outOfStockProducts > 0 ? 'warning' : 'default'} index={3} onClick={() => navigate('/products?filter=lowstock')} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SalesChart />
          <ExpensesChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentSales />
          <AlertCard />
        </div>
      </div>
    </MainLayout>
  );
}
