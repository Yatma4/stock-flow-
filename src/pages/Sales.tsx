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
  const [clientName, setClientName] = useState('');
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
    setClientName('');
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
      clientName: clientName.trim() || undefined,
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
    const ticketHTML = `
      <html>
      <head>
        <title>Ticket ${sale.id.slice(0, 8)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; width: 72mm; margin: 4mm; font-size: 12px; color: #000; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; font-weight: bold; }
          .subtitle { font-size: 10px; }
          .separator { text-align: center; letter-spacing: 2px; margin: 4px 0; }
          .item-row { display: flex; justify-content: space-between; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 4px; }
          .info { font-size: 11px; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center title">SALLEN TRADING</div>
        <div class="center subtitle">AND SERVICE</div>
        <div class="separator">--------------------------------</div>
        <div class="center bold" style="font-size:13px;">TICKET DE CAISSE</div>
        <div class="separator">--------------------------------</div>
        <div class="info">Date: ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}</div>
        <div class="info">Vendeur: ${sale.employeeName}</div>
        <div class="info">Paiement: ${paymentMethodLabels[sale.paymentMethod]}</div>
        <div class="separator">--------------------------------</div>
        ${sale.items.map(item => `
          <div style="margin: 4px 0;">
            <div>${item.productName}</div>
            <div class="item-row">
              <span>&nbsp;&nbsp;${item.quantity} x ${formatCurrencyPDF(item.unitPrice)}</span>
              <span>${formatCurrencyPDF(item.totalAmount)}</span>
            </div>
          </div>
        `).join('')}
        <div class="separator">--------------------------------</div>
        <div class="total-row">
          <span>TOTAL:</span>
          <span>${formatCurrencyPDF(sale.totalAmount)}</span>
        </div>
        <div class="separator">--------------------------------</div>
        <div class="center" style="margin-top:8px;">Merci pour votre achat !</div>
        <script>window.onload = function() { window.print(); }<\/script>
      </body>
      </html>
    `;
    
    // Use hidden iframe to avoid popup blockers
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(ticketHTML);
      iframeDoc.close();

      iframe.onload = () => {
        try {
          iframe.contentWindow?.print();
        } catch {
          // Fallback: download as PDF
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
          toast.info('Ticket téléchargé en PDF');
        }
        // Clean up iframe after a delay
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    } else {
      document.body.removeChild(iframe);
      toast.error('Impossible de générer le ticket');
    }
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Nouvelle vente
            </DialogTitle>
            <DialogDescription>Sélectionnez les produits, ajustez les quantités et choisissez le mode de paiement.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Left: Product Selection */}
              <div className="space-y-3 flex flex-col min-h-0">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Produits disponibles
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] rounded-lg border bg-card">
                  {products
                    .filter(p => p.quantity > 0)
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
                    .map((product) => {
                      const inCart = cart.find(c => c.productId === product.id);
                      return (
                        <div
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-colors border-b last:border-b-0",
                            inCart ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-secondary/50"
                          )}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                            {product.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {product.quantity} {product.unit} • {formatCurrency(product.purchasePrice)}
                            </p>
                          </div>
                          {inCart ? (
                            <Badge variant="default" className="shrink-0">{inCart.quantity}</Badge>
                          ) : (
                            <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0">
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  {products.filter(p => p.quantity > 0).filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">Aucun produit disponible</div>
                  )}
                </ScrollArea>
              </div>

              {/* Right: Cart & Payment */}
              <div className="space-y-3 flex flex-col min-h-0">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  Panier {cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}
                </Label>

                {cart.length === 0 ? (
                  <div className="flex-1 min-h-[200px] rounded-lg border border-dashed flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Cliquez sur un produit pour l'ajouter</p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 min-h-[150px] max-h-[200px] rounded-lg border">
                    <div className="divide-y">
                      {cart.map(item => (
                        <div key={item.productId} className="p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{item.productName}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.productId)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Qté (max: {item.availableStock})</Label>
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
                              <Label className="text-xs text-muted-foreground">Prix unit. (FCFA)</Label>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateCartItem(item.productId, 'unitPrice', Number(e.target.value))}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="text-xs flex justify-between">
                            <span className="text-muted-foreground">= {formatCurrency(item.unitPrice * item.quantity)}</span>
                            {isAdmin && (
                              <span className={cn((item.unitPrice - item.purchasePrice) >= 0 ? 'text-success' : 'text-destructive')}>
                                {formatCurrency((item.unitPrice - item.purchasePrice) * item.quantity)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Mode de paiement</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger className="h-9">
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
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-bold text-xl">{formatCurrency(cartTotal)}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Bénéfice:</span>
                        <span className={cn("text-sm font-semibold", cartProfit >= 0 ? "text-success" : "text-destructive")}>
                          {cartProfit >= 0 ? '+' : ''}{formatCurrency(cartProfit)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
            <Button variant="gradient" onClick={submitAdd} disabled={cart.length === 0}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Valider la vente {cart.length > 0 && `(${formatCurrency(cartTotal)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              ✓ Vente enregistrée
            </DialogTitle>
            <DialogDescription>
              Montant: <span className="font-semibold text-foreground">{receiptSale ? formatCurrency(receiptSale.totalAmount) : ''}</span> — Générez un document ou imprimez directement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={() => { if (receiptSale) generateTicketPDF(receiptSale); }}>
              <Printer className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Ticket de caisse</p>
                <p className="text-xs text-muted-foreground">Format compact pour imprimante thermique</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={() => { if (receiptSale) generateInvoicePDF(receiptSale); }}>
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Facture PDF</p>
                <p className="text-xs text-muted-foreground">Document professionnel complet</p>
              </div>
            </Button>
            <Button variant="default" className="w-full justify-start gap-3 h-auto py-3" onClick={() => {
              if (receiptSale) {
                generateTicketPDF(receiptSale);
                toast.success('Ticket généré — lancement de l\'impression');
              }
              setIsReceiptOpen(false);
            }}>
              <Printer className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Imprimer le ticket</p>
                <p className="text-xs opacity-80">Générer et imprimer directement</p>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReceiptOpen(false)}>Fermer sans imprimer</Button>
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
