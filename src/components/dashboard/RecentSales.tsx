import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { sales, products } from '@/data/mockData';
import { motion } from 'framer-motion';

export function RecentSales() {
  const recentSales = sales.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="rounded-xl border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ShoppingBag className="h-5 w-5 text-primary" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ventes récentes</h3>
            <p className="text-sm text-muted-foreground">Les 5 dernières transactions</p>
          </div>
        </div>
        <motion.button 
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          whileHover={{ x: 2 }}
        >
          Voir tout
          <ArrowUpRight className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="space-y-3">
        {recentSales.map((sale, index) => {
          const product = products.find((p) => p.id === sale.productId);
          return (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ 
                x: 4, 
                backgroundColor: 'hsl(210, 20%, 96%)',
                transition: { duration: 0.2 }
              }}
              className="flex items-center justify-between rounded-lg border border-transparent p-3 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold"
                  whileHover={{ scale: 1.1 }}
                >
                  {product?.name.charAt(0)}
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-foreground">{product?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.quantity} unité(s) × {sale.unitPrice.toLocaleString()} €
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {sale.totalAmount.toLocaleString()} €
                </p>
                <motion.p 
                  className="text-xs text-success font-medium"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  +{sale.profit.toLocaleString()} € profit
                </motion.p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
