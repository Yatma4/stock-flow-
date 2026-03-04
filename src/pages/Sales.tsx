import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSales } from '@/contexts/SalesContext';
import { useProducts } from '@/contexts/ProductContext';
import { Plus, Search, Calendar, TrendingUp, ShoppingCart, DollarSign, XCircle, User, CalendarDays, Filter, Trash2, FileText, Printer, X } from 'lucide-react';
import { format, isToday, isYesterday, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Sale, SaleItem, PaymentMethod, paymentMethodLabels } from '@/types';
import { formatCurrency, formatCurrencyPDF } from '@/lib/currency';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  availableStock: number;
}

export default function Sales() {
  const { sales, addSale, cancelSale, deleteCancelledSale } = useSales();
  const { products, updateStock } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [productSearch, setProductSearch] = useState('');
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const location = useLocation();
  const highlightId = location.state?.highlightId;

  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  const filterSalesByDate = (sale: Sale) => {
    const saleDate = new Date(sale.date);
    switch (dateFilter) {
      case 'today': return isToday(saleDate);
      case 'yesterday': return isYesterday(saleDate);
      case 'week':
        const weekAgo = subDays(new Date(), 7);
        return isWithinInterval(saleDate, { start: startOfDay(weekAgo), end: endOfDay(new Date()) });
      case 'custom':
        if (!customDate) return true;
        return isWithinInterval(saleDate, { start: startOfDay(customDate), end: endOfDay(customDate) });
      default: return true;
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const itemNames = sale.items.map(i => i.productName.toLowerCase()).join(' ');
      const matchesSearch = itemNames.includes(searchQuery.toLowerCase()) ||
        sale.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = filterSalesByDate(sale);
      return matchesSearch && matchesDate;
    });
  }, [sales, searchQuery, dateFilter, customDate]);

  const filteredCompletedSales = filteredSales.filter(s => s.status === 'completed');
  const totalSales = filteredCompletedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = filteredCompletedSales.reduce((sum, s) => sum + s.totalProfit, 0);
  const totalItems = filteredCompletedSales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0);

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartProfit = cart.reduce((sum, item) => sum + (item.unitPrice - item.purchasePrice) * item.quantity, 0);

  const handleAdd = () => {
    setCart([]);
    setPaymentMethod('cash');
    setProductSearch('');
    setIsAddOpen(true);
  };

  const addToCart = (product: typeof products[0]) => {
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error(`Stock insuffisant pour ${product.name}`);
        return;
      }
      setCart(prev => prev.map(c =>
        c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.purchasePrice,
        purchasePrice: product.purchasePrice,
        availableStock: product.quantity,
      }]);
    }
  };

  const updateCartItem = (productId: string, field: 'quantity' | 'unitPrice', value: number) => {
    setCart(prev => prev.map(c =>
      c.productId === productId ? { ...c, [field]: value } : c
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.productId !== productId));
  };

  const submitAdd = () => {
    if (cart.length === 0) {
      toast.error('Ajoutez au moins un produit au panier');
      return;
    }

    for (const item of cart) {
      if (item.quantity <= 0) {
        toast.error(`Quantité invalide pour ${item.productName}`);
        return;
      }
      if (item.unitPrice <= 0) {
        toast.error(`Prix invalide pour ${item.productName}`);
        return;
      }
      if (item.quantity > item.availableStock) {
        toast.error(`Stock insuffisant pour ${item.productName}`);
        return;
      }
    }

    if (!currentUser) {
      toast.error('Vous devez être connecté');
      return;
    }

    const saleId = crypto.randomUUID();
    const saleItems: SaleItem[] = cart.map(item => ({
      id: crypto.randomUUID(),
      saleId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchasePrice: item.purchasePrice,
      totalAmount: item.unitPrice * item.quantity,
      profit: (item.unitPrice - item.purchasePrice) * item.quantity,
    }));

    const newSale: Sale = {
      id: saleId,
      items: saleItems,
      totalAmount: cartTotal,
      totalProfit: cartProfit,
      paymentMethod,
      date: new Date(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      status: 'completed',
    };

    addSale(newSale);
    
    // Update stock for each item
    cart.forEach(item => {
      updateStock(item.productId, -item.quantity);
    });

    setIsAddOpen(false);
    toast.success(`Vente enregistrée - ${cart.length} produit(s) - ${formatCurrency(cartTotal)}`);

    addNotification({
      title: 'Nouvelle vente',
      message: `${currentUser.name} a enregistré une vente de ${formatCurrency(cartTotal)} (${paymentMethodLabels[paymentMethod]})`,
      type: 'success',
      linkTo: '/sales',
      linkItemId: saleId,
    });

    // Show receipt dialog
    setReceiptSale(newSale);
    setIsReceiptOpen(true);
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
      toast.error("Veuillez indiquer le motif de l'annulation");
      return;
    }
    if (!saleToCancel || !currentUser) return;

    cancelSale(saleToCancel.id, cancelReason, currentUser.name);
    saleToCancel.items.forEach(item => {
      updateStock(item.productId, item.quantity);
    });

    setIsCancelOpen(false);
    setSaleToCancel(null);
    toast.success('Vente annulée');

    addNotification({
      title: 'Vente annulée',
      message: `${currentUser.name} a annulé une vente de ${formatCurrency(saleToCancel.totalAmount)}. Motif: ${cancelReason}`,
      type: 'warning',
      linkTo: '/sales',
      linkItemId: saleToCancel.id,
    });
  };

  const handleDeleteCancelledSale = (sale: Sale) => {
    if (sale.status !== 'cancelled') return;
    setSaleToDelete(sale);
    setIsDeleteOpen(true);
  };

  const confirmDeleteCancelledSale = () => {
    if (!saleToDelete) return;
    deleteCancelledSale(saleToDelete.id);
    setIsDeleteOpen(false);
    setSaleToDelete(null);
    toast.success('Vente supprimée');
  };

  const generateTicketPDF = (sale: Sale) => {
    const doc = new jsPDF({ format: [80, 200], unit: 'mm' });
    let y = 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALLEN TRADING', 40, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('AND SERVICE', 40, y, { align: 'center' });
    y += 6;
    doc.text('--------------------------------', 40, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET DE CAISSE', 40, y, { align: 'center' });
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}`, 5, y);
    y += 4;
    doc.text(`Vendeur: ${sale.employeeName}`, 5, y);
    y += 4;
    doc.text(`Paiement: ${paymentMethodLabels[sale.paymentMethod]}`, 5, y);
    y += 4;
    doc.text('--------------------------------', 40, y, { align: 'center' });
    y += 5;

    sale.items.forEach(item => {
      doc.text(item.productName, 5, y);
      y += 4;
      doc.text(`  ${item.quantity} x ${formatCurrencyPDF(item.unitPrice)}`, 5, y);
      doc.text(formatCurrencyPDF(item.totalAmount), 75, y, { align: 'right' });
      y += 5;
    });

    doc.text('--------------------------------', 40, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL:', 5, y);
    doc.text(formatCurrencyPDF(sale.totalAmount), 75, y, { align: 'right' });
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Merci pour votre achat !', 40, y, { align: 'center' });

    doc.save(`ticket_${sale.id.slice(0, 8)}.pdf`);
  };

  const generateInvoicePDF = (sale: Sale) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('SALLEN TRADING AND SERVICE', 105, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.text('FACTURE', 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Info
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 48, 182, 22, 3, 3, 'F');
    doc.text(`N° Facture: FAC-${sale.id.slice(0, 8).toUpperCase()}`, 20, 56);
    doc.text(`Date: ${format(new Date(sale.date), 'dd MMMM yyyy', { locale: fr })}`, 20, 63);
    doc.text(`Vendeur: ${sale.employeeName}`, 120, 56);
    doc.text(`Paiement: ${paymentMethodLabels[sale.paymentMethod]}`, 120, 63);

    // Table
    autoTable(doc, {
      startY: 78,
      head: [['Produit', 'Qte', 'Prix Unit.', 'Total']],
      body: sale.items.map(item => [
        item.productName,
        item.quantity.toString(),
        formatCurrencyPDF(item.unitPrice),
        formatCurrencyPDF(item.totalAmount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(108, finalY, 88, 25, 3, 3, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', 152, finalY + 10, { align: 'center' });
    doc.setFontSize(16);
    doc.text(formatCurrencyPDF(sale.totalAmount), 152, finalY + 20, { align: 'center' });

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Merci pour votre confiance - Sallen Trading and Service', 105, 280, { align: 'center' });

    doc.save(`facture_FAC-${sale.id.slice(0, 8).toUpperCase()}.pdf`);
  };

  return (
    <MainLayout title="Gestion des ventes" subtitle="Enregistrement et suivi des ventes">
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
          {isAdmin && (
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
          )}
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
                  <Button variant={dateFilter === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter('custom')}>
                    <Filter className="h-4 w-4 mr-1" />
                    {customDate ? format(customDate, 'dd/MM/yyyy') : 'Date précise'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDate}
                    onSelect={(date) => { setCustomDate(date); setDateFilter('custom'); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {dateFilter !== 'all' && (
              <Badge variant="secondary" className="ml-auto">{filteredSales.length} vente(s)</Badge>
            )}
          </div>
        </Card>

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
                <TableHead className="font-semibold">Produits</TableHead>
                <TableHead className="font-semibold">Vendeur</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Paiement</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                {isAdmin && <TableHead className="font-semibold text-right">Bénéfice</TableHead>}
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Aucune vente trouvée
                  </TableCell>
                </TableRow>
              ) : filteredSales.map((sale) => {
                const isHighlighted = highlightId === sale.id;
                const firstItem = sale.items[0];
                return (
                  <TableRow key={sale.id} className={cn('transition-colors', isHighlighted && 'bg-primary/10 animate-pulse', sale.status === 'cancelled' && 'opacity-60')}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                          {sale.items.length}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            {firstItem?.productName || 'Vente'}
                            {sale.items.length > 1 && <span className="text-muted-foreground"> +{sale.items.length - 1}</span>}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {sale.items.reduce((sum, i) => sum + i.quantity, 0)} article(s)
                          </p>
                        </div>
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
                    <TableCell>
                      <Badge variant="outline">{paymentMethodLabels[sale.paymentMethod]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          sale.status === 'completed'
                            ? 'bg-success/10 text-success border-success/30'
                            : 'bg-muted text-muted-foreground border-muted'
                        )}>
                          {sale.status === 'completed' ? `+${formatCurrency(sale.totalProfit)}` : '-'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      {sale.status === 'completed' ? (
                        <Badge variant="default" className="bg-success/20 text-success border-success/30">Complétée</Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">Annulée</Badge>
                          {sale.cancelReason && (
                            <p className="text-xs text-muted-foreground max-w-32 truncate" title={sale.cancelReason}>{sale.cancelReason}</p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {sale.status === 'completed' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => generateTicketPDF(sale)} title="Ticket">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => generateInvoicePDF(sale)} title="Facture">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleCancel(sale)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {sale.status === 'cancelled' && isAdmin && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCancelledSale(sale)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* New Sale Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouvelle vente</DialogTitle>
            <DialogDescription>Sélectionnez les produits et le mode de paiement.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Product Search */}
            <div className="space-y-2">
              <Label>Rechercher un produit</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                <Input
                  placeholder="Rechercher..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-40 rounded-lg border">
                {products
                  .filter(p => p.quantity > 0)
                  .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
                  .map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-secondary/50 border-b last:border-b-0"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                        {product.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} dispo • {formatCurrency(product.purchasePrice)}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                {products.filter(p => p.quantity > 0).filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">Aucun produit</div>
                )}
              </ScrollArea>
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="space-y-2">
                <Label>Panier ({cart.length} produit(s))</Label>
                <div className="rounded-lg border divide-y">
                  {cart.map(item => (
                    <div key={item.productId} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.productName}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Quantité (max: {item.availableStock})</Label>
                          <Input
                            type="number"
                            min={1}
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={(e) => updateCartItem(item.productId, 'quantity', Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Prix unitaire (FCFA)</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateCartItem(item.productId, 'unitPrice', Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Sous-total: {formatCurrency(item.unitPrice * item.quantity)}</span>
                        {isAdmin && (
                          <span className={cn((item.unitPrice - item.purchasePrice) >= 0 ? 'text-success' : 'text-destructive')}>
                            Bénéfice: {formatCurrency((item.unitPrice - item.purchasePrice) * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Total */}
            {cart.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Total vente:</span>
                  <span className="font-bold text-right text-lg">{formatCurrency(cartTotal)}</span>
                  {isAdmin && (
                    <>
                      <span className="text-muted-foreground">Bénéfice total:</span>
                      <span className={cn("font-semibold text-right", cartProfit >= 0 ? "text-success" : "text-destructive")}>
                        {cartProfit >= 0 ? '+' : ''}{formatCurrency(cartProfit)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
            <Button variant="gradient" onClick={submitAdd} disabled={cart.length === 0}>
              Enregistrer la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Vente enregistrée ✓</DialogTitle>
            <DialogDescription>Souhaitez-vous générer un document ?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => { if (receiptSale) generateTicketPDF(receiptSale); setIsReceiptOpen(false); }}>
              <Printer className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Ticket de caisse</p>
                <p className="text-xs text-muted-foreground">Format compact pour imprimante</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => { if (receiptSale) generateInvoicePDF(receiptSale); setIsReceiptOpen(false); }}>
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Facture</p>
                <p className="text-xs text-muted-foreground">Document professionnel complet</p>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReceiptOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Sale Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Annuler la vente</DialogTitle>
            <DialogDescription>Le stock sera restauré automatiquement.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Motif de l'annulation</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex: Erreur de saisie, retour client..." className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmCancel}>Confirmer l'annulation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la vente annulée</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDeleteCancelledSale}>
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
