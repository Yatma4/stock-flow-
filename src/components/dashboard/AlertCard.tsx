import { AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { products, categories } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function AlertCard() {
  const navigate = useNavigate();
  
  const lowStockProducts = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.minStock
  );
  const outOfStockProducts = products.filter((p) => p.quantity === 0);

  const allAlerts = [
    ...outOfStockProducts.map((p) => ({
      product: p,
      type: 'out' as const,
      message: 'Rupture de stock',
    })),
    ...lowStockProducts.map((p) => ({
      product: p,
      type: 'low' as const,
      message: `Stock faible: ${p.quantity} ${p.unit}(s)`,
    })),
  ];

  const handleAlertClick = (productId: string) => {
    navigate(`/products?highlight=${productId}`);
  };

  if (allAlerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="rounded-xl border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="h-5 w-5 text-success" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Alertes de stock</h3>
            <p className="text-sm text-muted-foreground">État du stock</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, type: "spring" }}
          >
            <motion.div 
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Package className="h-6 w-6 text-success" />
            </motion.div>
            <p className="text-sm font-medium text-foreground">Tout est en ordre !</p>
            <p className="text-xs text-muted-foreground">Aucune alerte de stock</p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="rounded-xl border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div 
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="h-5 w-5 text-warning" />
        </motion.div>
        <div>
          <h3 className="font-semibold text-foreground">Alertes de stock</h3>
          <p className="text-sm text-muted-foreground">
            {allAlerts.length} produit(s) nécessitent attention
          </p>
        </div>
        <motion.span
          className="ml-auto px-2 py-1 text-xs font-medium rounded-full bg-warning/10 text-warning"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {allAlerts.length} alertes
        </motion.span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {allAlerts.map((alert, index) => {
            const category = categories.find((c) => c.id === alert.product.categoryId);
            return (
              <motion.div
                key={alert.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                onClick={() => handleAlertClick(alert.product.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer',
                  alert.type === 'out'
                    ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                    : 'border-warning/30 bg-warning/5 hover:bg-warning/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      alert.type === 'out' ? 'bg-destructive/10' : 'bg-warning/10'
                    )}
                    animate={alert.type === 'out' ? { 
                      scale: [1, 1.15, 1],
                    } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {alert.type === 'out' ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Package className="h-4 w-4 text-warning" />
                    )}
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {alert.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{category?.name}</p>
                  </div>
                </div>
                <motion.span
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    alert.type === 'out'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning'
                  )}
                  animate={alert.type === 'out' ? { opacity: [1, 0.6, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {alert.message}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
