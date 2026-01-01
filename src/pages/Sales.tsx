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
import { sales as initialSales, products } from '@/data/mockData';
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
  const [sales, setSales] = useState<Sale[]>(initialSales);
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
  }, [sales, searchQuery, dateFilter, customDate]);

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

    setSales([newSale, ...sales]);
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

    const updatedSales = sales.map(s => 
      s.id === saleToCancel.id 
        ? { 
            ...s, 
            status: 'cancelled' as const,
            cancelReason: cancelReason,
            cancelledAt: new Date(),
            cancelledBy: currentUser.name,
          } 
        : s
    );

    setSales(updatedSales);
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
              {filteredSales.map((sale) => {
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
                          {product?.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{product?.name}</span>
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
                        {format(sale.date, 'dd MMM yyyy', { locale: fr })}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle vente</DialogTitle>
            <DialogDescription>
              Sélectionnez un produit et entrez le prix négocié avec le client.
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
                      {product.name} - Stock: {product.quantity} {product.unit}(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProduct && (
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-sm text-muted-foreground">Prix d'achat:</p>
                <p className="font-semibold">{formatCurrency(selectedProduct.purchasePrice)}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.quantity || 999}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Disponible: {selectedProduct.quantity} {selectedProduct.unit}(s)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salePrice">Prix de vente négocié (FCFA)</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                placeholder="Entrez le prix après négociation"
                value={formData.salePrice || ''}
                onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
              />
            </div>
            
            {formData.productId && formData.salePrice > 0 && (
              <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bénéfice:</span>
                  <span className={`font-bold ${calculatedProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {calculatedProfit >= 0 ? '+' : ''}{formatCurrency(calculatedProfit)}
                  </span>
                </div>
                {calculatedProfit < 0 && (
                  <p className="text-xs text-destructive">
                    Attention: Vous vendez à perte!
                  </p>
                )}
              </div>
            )}

            {currentUser && (
              <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                <p className="text-xs text-muted-foreground">Vendeur:</p>
                <p className="font-medium text-primary">{currentUser.name}</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la vente</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif de l'annulation (retour article, erreur, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {saleToCancel && (
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-sm text-muted-foreground">Vente concernée:</p>
                <p className="font-semibold">
                  {products.find(p => p.id === saleToCancel.productId)?.name} - 
                  {saleToCancel.quantity} unité(s) - {formatCurrency(saleToCancel.totalAmount)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Motif de l'annulation *</Label>
              <Textarea
                id="cancelReason"
                placeholder="Ex: Retour client - produit défectueux"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Fermer
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