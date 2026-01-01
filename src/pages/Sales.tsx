import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { useSales } from '@/contexts/SalesContext';
import { useProducts } from '@/contexts/ProductContext';
import { Plus, Search, Calendar, TrendingUp, ShoppingCart, DollarSign, XCircle, User, CalendarDays, Filter } from 'lucide-react';
import { format, isToday, isYesterday, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Sale } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export default function Sales() {
  const { sales, addSale, cancelSale } = useSales();
  const { products, updateStock } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    salePrice: 0,
  });
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const location = useLocation();
  const highlightId = location.state?.highlightId;

  // Clear highlight state after animation
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  // Filter sales by date
  const filterSalesByDate = (sale: Sale) => {
    const saleDate = new Date(sale.date);
    
    switch (dateFilter) {
      case 'today':
        return isToday(saleDate);
      case 'yesterday':
        return isYesterday(saleDate);
      case 'week':
        const weekAgo = subDays(new Date(), 7);
        return isWithinInterval(saleDate, { start: startOfDay(weekAgo), end: endOfDay(new Date()) });
      case 'custom':
        if (!customDate) return true;
        return isWithinInterval(saleDate, { start: startOfDay(customDate), end: endOfDay(customDate) });
      default:
        return true;
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const product = products.find((p) => p.id === sale.productId);
      const matchesSearch = product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = filterSalesByDate(sale);
      return matchesSearch && matchesDate;
    });
  }, [sales, searchQuery, dateFilter, customDate, products]);

  // Stats based on filtered sales
  const filteredCompletedSales = filteredSales.filter(s => s.status === 'completed');
  const totalSales = filteredCompletedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = filteredCompletedSales.reduce((sum, s) => sum + s.profit, 0);
  const totalItems = filteredCompletedSales.reduce((sum, s) => sum + s.quantity, 0);

  const selectedProduct = products.find(p => p.id === formData.productId);
  const calculatedProfit = selectedProduct 
    ? (formData.salePrice - selectedProduct.purchasePrice) * formData.quantity 
    : 0;
  const calculatedTotal = formData.salePrice * formData.quantity;

  const handleAdd = () => {
    setFormData({ productId: products[0]?.id || '', quantity: 1, salePrice: 0 });
    setIsAddOpen(true);
  };

  const submitAdd = () => {
    if (!formData.productId || formData.quantity <= 0) {
      toast.error('Veuillez sélectionner un produit et une quantité valide');
      return;
    }
    
    if (formData.salePrice <= 0) {
      toast.error('Veuillez entrer le prix de vente négocié');
      return;
    }

    if (!currentUser) {
      toast.error('Vous devez être connecté pour effectuer une vente');
      return;
    }
    
    const product = products.find(p => p.id === formData.productId);
    if (!product) {
      toast.error('Produit non trouvé');
      return;
    }

    if (formData.quantity > product.quantity) {
      toast.error(`Stock insuffisant. Disponible: ${product.quantity} ${product.unit}(s)`);
      return;
    }

    const profit = (formData.salePrice - product.purchasePrice) * formData.quantity;
    
    const newSale: Sale = {
      id: Date.now().toString(),
      productId: formData.productId,
      quantity: formData.quantity,
      unitPrice: formData.salePrice,
      totalAmount: formData.salePrice * formData.quantity,
      profit: profit,
      date: new Date(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      status: 'completed',
    };

    addSale(newSale);
    updateStock(formData.productId, -formData.quantity);
    setIsAddOpen(false);
    
    toast.success(`Vente de ${formData.quantity} ${product.name} enregistrée - Bénéfice: ${formatCurrency(profit)}`);
    
    addNotification({
      title: 'Nouvelle vente',
      message: `${currentUser.name} a vendu ${formData.quantity} ${product.name} pour ${formatCurrency(calculatedTotal)}`,
      type: 'success',
      linkTo: '/sales',
      linkItemId: newSale.id,
    });
  };

  const handleCancel = (sale: Sale) => {
    if (sale.status === 'cancelled') {
      toast.error('Cette vente est déjà annulée');
      return;
    }
    setSaleToCancel(sale);
    setCancelReason('');
    setIsCancelOpen(true);
  };

  const confirmCancel = () => {
    if (!cancelReason.trim()) {
      toast.error('Veuillez indiquer le motif de l\'annulation');
      return;
    }

    if (!saleToCancel || !currentUser) return;

    cancelSale(saleToCancel.id, cancelReason, currentUser.name);
    // Restore stock
    updateStock(saleToCancel.productId, saleToCancel.quantity);
    
    setIsCancelOpen(false);
    setSaleToCancel(null);
    
    const product = products.find(p => p.id === saleToCancel.productId);
    toast.success(`Vente annulée: ${product?.name}`);
    
    addNotification({
      title: 'Vente annulée',
      message: `${currentUser.name} a annulé la vente de ${saleToCancel.quantity} ${product?.name}. Motif: ${cancelReason}`,
      type: 'warning',
      linkTo: '/sales',
      linkItemId: saleToCancel.id,
    });
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
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</p>
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
                <p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)}</p>
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

        {/* Date Filter */}
        <Card className="p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-medium">Filtrer par date:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'today', label: "Aujourd'hui" },
                { id: 'yesterday', label: 'Hier' },
                { id: 'week', label: '7 derniers jours' },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant={dateFilter === filter.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilter(filter.id as typeof dateFilter);
                    if (filter.id !== 'custom') setCustomDate(undefined);
                  }}
                >
                  {filter.label}
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateFilter('custom')}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    {customDate ? format(customDate, 'dd/MM/yyyy') : 'Date précise'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDate}
                    onSelect={(date) => {
                      setCustomDate(date);
                      setDateFilter('custom');
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {dateFilter !== 'all' && (
              <Badge variant="secondary" className="ml-auto">
                {filteredSales.length} vente(s) trouvée(s)
              </Badge>
            )}
          </div>
        </Card>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une vente ou un vendeur..."
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
                <TableHead className="font-semibold">Vendeur</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-right">Quantité</TableHead>
                <TableHead className="font-semibold text-right">Prix unitaire</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold text-right">Bénéfice</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucune vente trouvée. Enregistrez votre première vente !
                  </TableCell>
                </TableRow>
              ) : filteredSales.map((sale) => {
                const product = products.find((p) => p.id === sale.productId);
                const isHighlighted = highlightId === sale.id;

                return (
                  <TableRow 
                    key={sale.id} 
                    className={cn(
                      'transition-colors',
                      isHighlighted && 'bg-primary/10 animate-pulse',
                      sale.status === 'cancelled' && 'opacity-60'
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                          {product?.name.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-foreground">{product?.name || 'Produit supprimé'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{sale.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(sale.date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{sale.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        sale.status === 'completed' 
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-muted text-muted-foreground border-muted'
                      )}>
                        {sale.status === 'completed' ? `+${formatCurrency(sale.profit)}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {sale.status === 'completed' ? (
                        <Badge variant="default" className="bg-success/20 text-success border-success/30">
                          Complétée
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                            Annulée
                          </Badge>
                          {sale.cancelReason && (
                            <p className="text-xs text-muted-foreground max-w-32 truncate" title={sale.cancelReason}>
                              {sale.cancelReason}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {sale.status === 'completed' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancel(sale)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      )}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle vente</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle vente avec le prix négocié.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value);
                  setFormData({ 
                    ...formData, 
                    productId: value,
                    salePrice: product?.purchasePrice || 0,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.quantity > 0).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.quantity} {product.unit}(s) disponibles)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                <p className="text-muted-foreground">Prix d'achat: <span className="font-medium text-foreground">{formatCurrency(selectedProduct.purchasePrice)}</span></p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Prix de vente unitaire (FCFA)</Label>
              <Input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                placeholder="Entrez le prix de vente négocié"
              />
            </div>

            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.quantity || 1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>

            {selectedProduct && formData.salePrice > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Total vente:</span>
                  <span className="font-semibold text-right">{formatCurrency(calculatedTotal)}</span>
                  <span className="text-muted-foreground">Bénéfice:</span>
                  <span className={cn("font-semibold text-right", calculatedProfit >= 0 ? "text-success" : "text-destructive")}>
                    {calculatedProfit >= 0 ? '+' : ''}{formatCurrency(calculatedProfit)}
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

      {/* Cancel Sale Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Annuler la vente</DialogTitle>
            <DialogDescription>
              Indiquez le motif de l'annulation. Le stock sera restauré automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Motif de l'annulation</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Erreur de saisie, retour client..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
