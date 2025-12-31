import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { expensesByCategory } from '@/data/mockData';

const COLORS = [
  'hsl(173, 58%, 39%)',
  'hsl(152, 69%, 31%)',
  'hsl(38, 92%, 50%)',
  'hsl(220, 70%, 50%)',
  'hsl(280, 65%, 60%)',
];

export function ExpensesChart() {
  const total = expensesByCategory.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Répartition des dépenses</h3>
        <p className="text-sm text-muted-foreground">Par catégorie ce mois</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="amount"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(214, 20%, 90%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px hsl(220 25% 10% / 0.1)',
                }}
                formatter={(value: number) => [`${value.toLocaleString()} €`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {expensesByCategory.map((expense, index) => (
            <div key={expense.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-foreground">{expense.category}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {expense.amount.toLocaleString()} €
                </p>
                <p className="text-xs text-muted-foreground">{expense.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 p-4">
        <span className="text-sm font-medium text-muted-foreground">Total des dépenses</span>
        <span className="text-lg font-bold text-foreground">{total.toLocaleString()} €</span>
      </div>
    </div>
  );
}
