import { ArrowUpRight } from 'lucide-react';
import { sales, products } from '@/data/mockData';

export function RecentSales() {
  const recentSales = sales.slice(0, 5);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ventes récentes</h3>
          <p className="text-sm text-muted-foreground">Les 5 dernières transactions</p>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Voir tout
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {recentSales.map((sale) => {
          const product = products.find((p) => p.id === sale.productId);
          return (
            <div
              key={sale.id}
              className="flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                  {product?.name.charAt(0)}
                </div>
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
                <p className="text-xs text-success font-medium">
                  +{sale.profit.toLocaleString()} € profit
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
