import { useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuotes } from '@/contexts/QuoteContext';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, FileText, Trash2, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Quote, QuoteItem, QuoteStatus, quoteStatusLabels } from '@/types';
import { formatCurrency, formatCurrencyPDF } from '@/lib/currency';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteCartItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function Quotes() {
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
  const { products } = useProducts();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<QuoteCartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(30);

  const filteredQuotes = quotes.filter(q =>
    q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleAdd = () => {
    setCart([]);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientAddress('');
    setNotes('');
    setValidDays(30);
    setProductSearch('');
    setIsAddOpen(true);
  };

  const addProductToCart = (product: typeof products[0]) => {
    setCart(prev => [...prev, {
      productId: product.id,
      description: product.name,
      quantity: 1,
      unitPrice: product.purchasePrice,
    }]);
  };

  const addCustomItem = () => {
    setCart(prev => [...prev, {
      description: '',
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const updateCartItem = (index: number, field: string, value: string | number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const submitAdd = () => {
    if (!clientName.trim()) { toast.error('Nom du client requis'); return; }
    if (cart.length === 0) { toast.error('Ajoutez au moins un article'); return; }
    for (const item of cart) {
      if (!item.description.trim()) { toast.error('Description requise pour tous les articles'); return; }
      if (item.quantity <= 0 || item.unitPrice <= 0) { toast.error('Quantité et prix invalides'); return; }
    }
    if (!currentUser) return;

    const quoteId = crypto.randomUUID();
    const quoteNumber = `DEV-${Date.now().toString(36).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const quoteItems: QuoteItem[] = cart.map(item => ({
      id: crypto.randomUUID(),
      quoteId,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.unitPrice * item.quantity,
    }));

    const newQuote: Quote = {
      id: quoteId,
      quoteNumber,
      clientName,
      clientPhone: clientPhone || undefined,
      clientEmail: clientEmail || undefined,
      clientAddress: clientAddress || undefined,
      items: quoteItems,
      totalAmount: cartTotal,
      status: 'draft',
      validUntil,
      notes: notes || undefined,
      createdBy: currentUser.name,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addQuote(newQuote);
    setIsAddOpen(false);
    toast.success(`Devis ${quoteNumber} créé`);
  };

  const handleStatusChange = (quoteId: string, status: QuoteStatus) => {
    updateQuote(quoteId, { status });
    toast.success(`Statut mis à jour: ${quoteStatusLabels[status]}`);
  };

  const generateQuotePDF = (quote: Quote) => {
    const doc = new jsPDF();

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('SALLEN TRADING AND SERVICE', 105, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.text('DEVIS', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`N° ${quote.quoteNumber}`, 105, 40, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // Client info
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 52, 182, 30, 3, 3, 'F');
    doc.setFontSize(9);
    doc.text(`Client: ${quote.clientName}`, 20, 60);
    if (quote.clientPhone) doc.text(`Tel: ${quote.clientPhone}`, 20, 66);
    if (quote.clientEmail) doc.text(`Email: ${quote.clientEmail}`, 20, 72);
    if (quote.clientAddress) doc.text(`Adresse: ${quote.clientAddress}`, 110, 60);
    doc.text(`Date: ${format(new Date(quote.date), 'dd MMMM yyyy', { locale: fr })}`, 110, 66);
    if (quote.validUntil) doc.text(`Valide jusqu'au: ${format(new Date(quote.validUntil), 'dd/MM/yyyy')}`, 110, 72);

    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Qte', 'Prix Unit.', 'Total']],
      body: quote.items.map(item => [
        item.description,
        item.quantity.toString(),
        formatCurrencyPDF(item.unitPrice),
        formatCurrencyPDF(item.totalAmount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(108, finalY, 88, 25, 3, 3, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', 152, finalY + 10, { align: 'center' });
    doc.setFontSize(16);
    doc.text(formatCurrencyPDF(quote.totalAmount), 152, finalY + 20, { align: 'center' });

    if (quote.notes) {
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.text(`Notes: ${quote.notes}`, 14, finalY + 40);
    }

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Sallen Trading and Service - Devis non contractuel', 105, 280, { align: 'center' });

    doc.save(`devis_${quote.quoteNumber}.pdf`);
    toast.success('Devis PDF téléchargé');
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'sent': return 'bg-primary/20 text-primary';
      case 'accepted': return 'bg-success/20 text-success';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      case 'expired': return 'bg-warning/20 text-warning';
    }
  };

  return (
    <MainLayout title="Devis" subtitle="Gestion des devis clients">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total devis</p>
                <p className="text-2xl font-bold text-foreground">{quotes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acceptés</p>
                <p className="text-2xl font-bold text-success">{quotes.filter(q => q.status === 'accepted').length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-foreground">{quotes.filter(q => q.status === 'draft' || q.status === 'sent').length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un devis..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Button variant="gradient" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </div>

        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">N° Devis</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-right">Montant</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun devis</TableCell>
                </TableRow>
              ) : filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quote.clientName}</p>
                      {quote.clientPhone && <p className="text-xs text-muted-foreground">{quote.clientPhone}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(quote.date), 'dd MMM yyyy', { locale: fr })}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(quote.totalAmount)}</TableCell>
                  <TableCell>
                    <Select value={quote.status} onValueChange={(v) => handleStatusChange(quote.id, v as QuoteStatus)}>
                      <SelectTrigger className={cn("w-32 h-8 text-xs", getStatusColor(quote.status))}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(quoteStatusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => generateQuotePDF(quote)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setQuoteToDelete(quote); setIsDeleteOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Quote Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouveau devis</DialogTitle>
            <DialogDescription>Créez un devis pour votre client.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du client *</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom complet" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Numéro" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@exemple.com" />
              </div>
              <div className="space-y-2">
                <Label>Validité (jours)</Label>
                <Input type="number" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Adresse du client" />
            </div>

            {/* Add from products */}
            <div className="space-y-2">
              <Label>Ajouter depuis les produits</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                <Input placeholder="Rechercher..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-9" />
              </div>
              {productSearch && (
                <ScrollArea className="h-32 rounded-lg border">
                  {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                    <div key={product.id} onClick={() => { addProductToCart(product); setProductSearch(''); }}
                      className="flex items-center gap-3 p-2 cursor-pointer hover:bg-secondary/50 border-b last:border-b-0 text-sm">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatCurrency(product.purchasePrice)}</span>
                    </div>
                  ))}
                </ScrollArea>
              )}
              <Button variant="outline" size="sm" onClick={addCustomItem}>
                <Plus className="h-3 w-3 mr-1" /> Article personnalisé
              </Button>
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="space-y-2">
                <Label>Articles ({cart.length})</Label>
                <div className="rounded-lg border divide-y">
                  {cart.map((item, index) => (
                    <div key={index} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Input value={item.description} onChange={(e) => updateCartItem(index, 'description', e.target.value)} placeholder="Description" className="flex-1 h-8 text-sm mr-2" />
                        <Button variant="ghost" size="sm" onClick={() => removeFromCart(index)}><X className="h-3 w-3" /></Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Quantité</Label>
                          <Input type="number" min={1} value={item.quantity} onChange={(e) => updateCartItem(index, 'quantity', Number(e.target.value))} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Prix unitaire</Label>
                          <Input type="number" value={item.unitPrice} onChange={(e) => updateCartItem(index, 'unitPrice', Number(e.target.value))} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Sous-total</Label>
                          <p className="h-8 flex items-center text-sm font-medium">{formatCurrency(item.unitPrice * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, remarques..." />
            </div>

            {cart.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
            <Button variant="gradient" onClick={submitAdd} disabled={cart.length === 0 || !clientName.trim()}>Créer le devis</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le devis</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => { if (quoteToDelete) { deleteQuote(quoteToDelete.id); setIsDeleteOpen(false); toast.success('Devis supprimé'); } }}>
              <Trash2 className="h-4 w-4 mr-1" /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
