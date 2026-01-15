import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { useProducts } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { useFinances } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, Activity, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { sales } = useSales();
  const { entries } = useFinances();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
  const totalRevenue = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const todaySales = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0);

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
          <StatCard title="Valeur du stock" value={formatCurrency(totalStockValue)} icon={Package} trend={{ value: 12, isPositive: true }} variant="primary" index={0} />
          <StatCard title="Ventes totales" value={formatCurrency(todaySales)} icon={ShoppingCart} trend={{ value: 8, isPositive: true }} variant="success" index={1} />
          {isAdmin ? (
            <StatCard title="Bénéfice net" value={formatCurrency(netProfit)} icon={netProfit >= 0 ? TrendingUp : TrendingDown} trend={{ value: 15, isPositive: netProfit >= 0 }} variant={netProfit >= 0 ? 'success' : 'danger'} index={2} />
          ) : (
            <StatCard title="Bénéfice net" value="Accès restreint" icon={Lock} variant="default" index={2} />
          )}
          <StatCard title="Alertes stock" value={lowStockProducts + outOfStockProducts} icon={AlertTriangle} variant={lowStockProducts + outOfStockProducts > 0 ? 'warning' : 'default'} index={3} onClick={() => navigate('/products?filter=lowstock')} />
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
