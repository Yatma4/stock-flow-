import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { sales as initialSales, products } from '@/data/mockData';
import { Plus, Search, Calendar, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Sale } from '@/types';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
  });

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.quantity, 0);

  const filteredSales = sales.filter((sale) => {
    const product = products.find((p) => p.id === sale.productId);
    return product?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAdd = () => {
    setFormData({ productId: products[0]?.id || '', quantity: 1 });
    setIsAddOpen(true);
  };

  const submitAdd = () => {
    if (!formData.productId || formData.quantity <= 0) {
      toast.error('Veuillez sélectionner un produit et une quantité valide');
      return;
    }
    
    const product = products.find(p => p.id === formData.productId);
    if (!product) {
      toast.error('Produit non trouvé');
      return;
    }

    const newSale: Sale = {
      id: Date.now().toString(),
      productId: formData.productId,
      quantity: formData.quantity,
      unitPrice: product.salePrice,
      totalAmount: product.salePrice * formData.quantity,
      profit: (product.salePrice - product.purchasePrice) * formData.quantity,
      date: new Date(),
    };

    setSales([newSale, ...sales]);
    setIsAddOpen(false);
    toast.success(`Vente de ${formData.quantity} ${product.name} enregistrée`);
  };

  return (
    <MainLayout
      title="Gestion des ventes"
      subtitle="Enregistrement et suivi des ventes"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventes totales</p>
                <p className="text-2xl font-bold text-foreground">{totalSales.toLocaleString()} €</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bénéfice total</p>
                <p className="text-2xl font-bold text-success">{totalProfit.toLocaleString()} €</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <DollarSign className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Articles vendus</p>
                <p className="text-2xl font-bold text-foreground">{totalItems} unités</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une vente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="gradient" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle vente
          </Button>
        </div>

        {/* Sales Table */}
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Produit</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-right">Quantité</TableHead>
                <TableHead className="font-semibold text-right">Prix unitaire</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold text-right">Bénéfice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => {
                const product = products.find((p) => p.id === sale.productId);

                return (
                  <TableRow key={sale.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                          {product?.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{product?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(sale.date, 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{sale.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {sale.unitPrice.toLocaleString()} €
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {sale.totalAmount.toLocaleString()} €
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/30">
                        +{sale.profit.toLocaleString()} €
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Sale Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle vente</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle vente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produit</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.salePrice} €
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>
            {formData.productId && (
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix unitaire:</span>
                  <span className="font-medium">
                    {products.find(p => p.id === formData.productId)?.salePrice.toLocaleString()} €
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-foreground">
                    {((products.find(p => p.id === formData.productId)?.salePrice || 0) * formData.quantity).toLocaleString()} €
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annuler
            </Button>
            <Button variant="gradient" onClick={submitAdd}>
              Enregistrer la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
