import { AlertTriangle, Package } from 'lucide-react';
import { products, categories } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function AlertCard() {
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

  if (allAlerts.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <Package className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Alertes de stock</h3>
            <p className="text-sm text-muted-foreground">État du stock</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 text-center">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Package className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">Tout est en ordre !</p>
            <p className="text-xs text-muted-foreground">Aucune alerte de stock</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Alertes de stock</h3>
          <p className="text-sm text-muted-foreground">
            {allAlerts.length} produit(s) nécessitent attention
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {allAlerts.map((alert) => {
          const category = categories.find((c) => c.id === alert.product.categoryId);
          return (
            <div
              key={alert.product.id}
              className={cn(
                'flex items-center justify-between rounded-lg border p-3 transition-colors',
                alert.type === 'out'
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-warning/30 bg-warning/5'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    alert.type === 'out' ? 'bg-destructive/10' : 'bg-warning/10'
                  )}
                >
                  {alert.type === 'out' ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Package className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {alert.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{category?.name}</p>
                </div>
              </div>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  alert.type === 'out'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-warning/10 text-warning'
                )}
              >
                {alert.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
