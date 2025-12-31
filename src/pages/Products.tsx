import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { products, categories } from '@/data/mockData';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return { label: 'Rupture', variant: 'destructive' as const };
    if (quantity <= minStock) return { label: 'Stock faible', variant: 'warning' as const };
    return { label: 'En stock', variant: 'success' as const };
  };

  const getProfit = (salePrice: number, purchasePrice: number) => {
    const profit = salePrice - purchasePrice;
    const margin = ((profit / purchasePrice) * 100).toFixed(1);
    return { profit, margin };
  };

  return (
    <MainLayout
      title="Gestion des produits"
      subtitle={`${products.length} produits dans l'inventaire`}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="gradient">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Produit</TableHead>
                <TableHead className="font-semibold">Catégorie</TableHead>
                <TableHead className="font-semibold text-right">Prix d'achat</TableHead>
                <TableHead className="font-semibold text-right">Prix de vente</TableHead>
                <TableHead className="font-semibold text-right">Marge</TableHead>
                <TableHead className="font-semibold text-right">Quantité</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const status = getStockStatus(product.quantity, product.minStock);
                const { profit, margin } = getProfit(product.salePrice, product.purchasePrice);

                return (
                  <TableRow key={product.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-semibold text-sm"
                          style={{ backgroundColor: category?.color || 'hsl(var(--primary))' }}
                        >
                          {product.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Stock min: {product.minStock} {product.unit}(s)
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${category?.color}15`,
                          color: category?.color,
                          borderColor: `${category?.color}30`,
                        }}
                        className="border"
                      >
                        {category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.purchasePrice.toLocaleString()} €
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.salePrice.toLocaleString()} €
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium text-success">+{profit.toLocaleString()} €</p>
                        <p className="text-xs text-muted-foreground">{margin}%</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.quantity} {product.unit}(s)
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border',
                          status.variant === 'success' && 'bg-success/10 text-success border-success/30',
                          status.variant === 'warning' && 'bg-warning/10 text-warning border-warning/30',
                          status.variant === 'destructive' && 'bg-destructive/10 text-destructive border-destructive/30'
                        )}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
