import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileText, Download, Calendar as CalendarIcon, TrendingUp, ShoppingCart, DollarSign, BarChart3, Loader2, History, Trash2, Eye,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useProducts } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { useFinances } from '@/contexts/FinanceContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useReports } from '@/contexts/ReportContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatCurrencyPDF } from '@/lib/currency';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { paymentMethodLabels, Sale, FinancialEntry } from '@/types';

const reportTypes = [
  { id: 'sales', name: 'Rapport des ventes', description: 'Détail de toutes les ventes réalisées', icon: ShoppingCart, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'financial', name: 'Situation financière', description: 'Bilan des revenus et dépenses', icon: DollarSign, color: 'text-success', bgColor: 'bg-success/10' },
  { id: 'stock', name: 'État du stock', description: 'Inventaire complet des produits', icon: BarChart3, color: 'text-warning', bgColor: 'bg-warning/10' },
  { id: 'profit', name: 'Analyse des profits', description: 'Bénéfices par vente', icon: TrendingUp, color: 'text-chart-4', bgColor: 'bg-chart-4/10' },
];

const periodOptions = [
  { id: 'daily', name: 'Quotidien', description: "Rapport du jour" },
  { id: 'monthly', name: 'Mensuel', description: 'Mois en cours' },
  { id: 'semester', name: 'Semestriel', description: '6 derniers mois' },
  { id: 'annual', name: 'Annuel', description: "Année en cours" },
  { id: 'custom', name: 'Personnalisé', description: 'Choisir les dates' },
];

function getDateRange(period: string, customFrom?: Date, customTo?: Date): { start: Date; end: Date; label: string } {
  const now = new Date();
  switch (period) {
    case 'daily':
      return { start: startOfDay(now), end: endOfDay(now), label: format(now, 'dd MMMM yyyy', { locale: fr }) };
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy', { locale: fr }) };
    case 'semester':
      return { start: startOfMonth(subMonths(now, 5)), end: endOfDay(now), label: `${format(subMonths(now, 5), 'MMM yyyy', { locale: fr })} - ${format(now, 'MMM yyyy', { locale: fr })}` };
    case 'annual':
      return { start: startOfYear(now), end: endOfYear(now), label: format(now, 'yyyy') };
    case 'custom':
      if (customFrom && customTo) {
        return { start: startOfDay(customFrom), end: endOfDay(customTo), label: `${format(customFrom, 'dd/MM/yyyy')} - ${format(customTo, 'dd/MM/yyyy')}` };
      }
      return { start: startOfDay(now), end: endOfDay(now), label: 'Sélectionnez les dates' };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy', { locale: fr }) };
  }
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const { products } = useProducts();
  const { sales } = useSales();
  const { entries } = useFinances();
  const { categories } = useCategories();
  const { reports, addReport, deleteReport } = useReports();
  const { currentUser } = useAuth();

  const dateRange = useMemo(() => getDateRange(selectedPeriod, customFrom, customTo), [selectedPeriod, customFrom, customTo]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.date);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
  }, [sales, dateRange]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.date);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
  }, [entries, dateRange]);

  const generateReportContent = (type: string, salesData: Sale[], entriesData: FinancialEntry[]) => {
    const periodLabel = dateRange.label;

    let content = `RAPPORT ${reportTypes.find(r => r.id === type)?.name.toUpperCase()}\n`;
    content += `Période: ${periodLabel}\n`;
    content += `Généré par: ${currentUser?.name || 'Inconnu'}\n`;
    content += `${'='.repeat(50)}\n\n`;

    switch (type) {
      case 'sales':
        content += `VENTES\n${'-'.repeat(30)}\n`;
        if (salesData.length === 0) {
          content += 'Aucune vente pour cette période.\n';
        } else {
          salesData.forEach(sale => {
            content += `\nVente du ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}\n`;
            content += `  Paiement: ${paymentMethodLabels[sale.paymentMethod]}\n`;
            sale.items.forEach(item => {
              content += `  - ${item.productName}: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalAmount)}\n`;
            });
            content += `  Total: ${formatCurrency(sale.totalAmount)}\n`;
            content += `  Statut: ${sale.status === 'completed' ? 'Complétée' : 'Annulée'}\n`;
          });
          const totalSales = salesData.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0);
          content += `\n${'='.repeat(50)}\nTOTAL VENTES: ${formatCurrency(totalSales)}\n`;
        }
        break;

      case 'financial': {
        const incomes = entriesData.filter(e => e.type === 'income');
        const expenses = entriesData.filter(e => e.type === 'expense');
        const totalRevenue = incomes.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        content += `REVENUS\n${'-'.repeat(30)}\n`;
        if (incomes.length === 0) content += 'Aucun revenu pour cette période.\n';
        else incomes.forEach(e => { content += `${e.category}: ${formatCurrency(e.amount)} - ${e.description}\n`; });
        content += `\nDÉPENSES\n${'-'.repeat(30)}\n`;
        if (expenses.length === 0) content += 'Aucune dépense pour cette période.\n';
        else expenses.forEach(e => { content += `${e.category}: ${formatCurrency(e.amount)} - ${e.description}\n`; });
        content += `\n${'='.repeat(50)}\n`;
        content += `Revenus: ${formatCurrency(totalRevenue)}\nDépenses: ${formatCurrency(totalExpenses)}\nSolde: ${formatCurrency(totalRevenue - totalExpenses)}\n`;
        break;
      }

      case 'stock': {
        const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
        content += `INVENTAIRE\n${'-'.repeat(30)}\n`;
        products.forEach(p => {
          const cat = categories.find(c => c.id === p.categoryId);
          content += `\n${p.name} (${cat?.name || 'Sans catégorie'})\n`;
          content += `  Prix: ${formatCurrency(p.purchasePrice)} | Qté: ${p.quantity} ${p.unit}(s) | Min: ${p.minStock}\n`;
        });
        content += `\n${'='.repeat(50)}\nValeur du stock: ${formatCurrency(totalStockValue)}\n`;
        break;
      }

      case 'profit': {
        const completed = salesData.filter(s => s.status === 'completed');
        content += `ANALYSE DES BÉNÉFICES\n${'-'.repeat(30)}\n`;
        if (completed.length === 0) content += 'Aucune vente complétée pour cette période.\n';
        else {
          completed.forEach(sale => {
            content += `\nVente du ${format(new Date(sale.date), 'dd/MM/yyyy')}\n`;
            sale.items.forEach(item => {
              const margin = item.purchasePrice > 0 ? ((item.unitPrice - item.purchasePrice) / item.purchasePrice * 100).toFixed(1) : '0';
              content += `  - ${item.productName}: Marge ${margin}% | Bénéfice: ${formatCurrency(item.profit)}\n`;
            });
            content += `  Total bénéfice: ${formatCurrency(sale.totalProfit)}\n`;
          });
          const totalProfit = completed.reduce((sum, s) => sum + s.totalProfit, 0);
          content += `\n${'='.repeat(50)}\nBÉNÉFICE TOTAL: ${formatCurrency(totalProfit)}\n`;
        }
        break;
      }
    }
    return content;
  };

  const generatePDF = (type: string, salesData: Sale[], entriesData: FinancialEntry[]) => {
    const doc = new jsPDF();
    const periodLabel = dateRange.label;
    const reportTypeName = reportTypes.find(r => r.id === type)?.name || '';
    const reportColor = type === 'sales' ? [59, 130, 246] : type === 'financial' ? [34, 197, 94] : type === 'stock' ? [234, 179, 8] : [168, 85, 247];

    doc.setFillColor(reportColor[0], reportColor[1], reportColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('SALLEN TRADING AND SERVICE', 105, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.text(reportTypeName.toUpperCase(), 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periode: ${periodLabel}`, 105, 40, { align: 'center' });

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 50, 182, 14, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Date de generation: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 59);
    doc.text(`Genere par: ${currentUser?.name || 'Inconnu'}`, 140, 59);

    let yPosition = 74;

    switch (type) {
      case 'sales': {
        const completed = salesData.filter(s => s.status === 'completed');
        if (completed.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucune vente pour cette periode', 105, yPosition, { align: 'center' });
        } else {
          const salesTableData: string[][] = [];
          completed.forEach(sale => {
            sale.items.forEach((item, idx) => {
              salesTableData.push([
                idx === 0 ? format(new Date(sale.date), 'dd/MM/yy') : '',
                item.productName,
                item.quantity.toString(),
                formatCurrencyPDF(item.unitPrice),
                formatCurrencyPDF(item.totalAmount),
                formatCurrencyPDF(item.profit),
                idx === 0 ? paymentMethodLabels[sale.paymentMethod] : '',
              ]);
            });
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Date', 'Produit', 'Qte', 'Prix Unit.', 'Total', 'Benefice', 'Paiement']],
            body: salesTableData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [240, 248, 255] },
            columnStyles: { 0: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'center' } },
          });

          const totalSales = completed.reduce((sum, s) => sum + s.totalAmount, 0);
          const totalProfit = completed.reduce((sum, s) => sum + s.totalProfit, 0);
          const finalY = (doc as any).lastAutoTable.finalY + 10;

          doc.setFillColor(59, 130, 246);
          doc.roundedRect(14, finalY, 88, 25, 3, 3, 'F');
          doc.setFillColor(34, 197, 94);
          doc.roundedRect(108, finalY, 88, 25, 3, 3, 'F');
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text('TOTAL VENTES', 58, finalY + 10, { align: 'center' });
          doc.setFontSize(14);
          doc.text(formatCurrencyPDF(totalSales), 58, finalY + 20, { align: 'center' });
          doc.setFontSize(10);
          doc.text('TOTAL BENEFICES', 152, finalY + 10, { align: 'center' });
          doc.setFontSize(14);
          doc.text(formatCurrencyPDF(totalProfit), 152, finalY + 20, { align: 'center' });

          // Summary
          const summaryY = finalY + 40;
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(`Nombre de ventes: ${completed.length}`, 20, summaryY);
          doc.text(`Articles vendus: ${completed.reduce((s, sale) => s + sale.items.reduce((si, i) => si + i.quantity, 0), 0)}`, 20, summaryY + 6);
        }
        break;
      }

      case 'financial': {
        const incomes = entriesData.filter(e => e.type === 'income');
        const expenses = entriesData.filter(e => e.type === 'expense');
        const totalRevenue = incomes.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        doc.setFillColor(34, 197, 94);
        doc.roundedRect(14, yPosition - 5, 88, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text('REVENUS', 58, yPosition + 2, { align: 'center' });

        if (incomes.length > 0) {
          autoTable(doc, {
            startY: yPosition + 10,
            head: [['Date', 'Categorie', 'Description', 'Montant']],
            body: incomes.map(e => [format(new Date(e.date), 'dd/MM/yy'), e.category, e.description, formatCurrencyPDF(e.amount)]),
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { halign: 'center' }, 3: { halign: 'right' } },
          });
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        } else {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucun revenu pour cette periode', 58, yPosition + 15, { align: 'center' });
          yPosition += 25;
        }

        doc.setFillColor(239, 68, 68);
        doc.roundedRect(14, yPosition - 5, 88, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text('DEPENSES', 58, yPosition + 2, { align: 'center' });

        if (expenses.length > 0) {
          autoTable(doc, {
            startY: yPosition + 10,
            head: [['Date', 'Categorie', 'Description', 'Montant']],
            body: expenses.map(e => [format(new Date(e.date), 'dd/MM/yy'), e.category, e.description, formatCurrencyPDF(e.amount)]),
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { halign: 'center' }, 3: { halign: 'right' } },
          });
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        } else {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucune depense pour cette periode', 58, yPosition + 15, { align: 'center' });
          yPosition += 25;
        }

        const balance = totalRevenue - totalExpenses;
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(14, yPosition, 58, 22, 3, 3, 'F');
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(76, yPosition, 58, 22, 3, 3, 'F');
        doc.setFillColor(balance >= 0 ? 34 : 239, balance >= 0 ? 197 : 68, balance >= 0 ? 94 : 68);
        doc.roundedRect(138, yPosition, 58, 22, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('Revenus', 43, yPosition + 8, { align: 'center' });
        doc.text('Depenses', 105, yPosition + 8, { align: 'center' });
        doc.text('Solde', 167, yPosition + 8, { align: 'center' });
        doc.setFontSize(11);
        doc.text(formatCurrencyPDF(totalRevenue), 43, yPosition + 17, { align: 'center' });
        doc.text(formatCurrencyPDF(totalExpenses), 105, yPosition + 17, { align: 'center' });
        doc.text(formatCurrencyPDF(balance), 167, yPosition + 17, { align: 'center' });
        break;
      }

      case 'stock': {
        if (products.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucun produit enregistre', 105, yPosition, { align: 'center' });
        } else {
          const stockData = products.sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(p => {
            const cat = categories.find(c => c.id === p.categoryId);
            const status = p.quantity === 0 ? 'RUPTURE' : p.quantity <= p.minStock ? 'FAIBLE' : 'OK';
            return [p.name, cat?.name || 'Sans categorie', formatCurrencyPDF(p.purchasePrice), `${p.quantity} ${p.unit}(s)`, p.minStock.toString(), status];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Produit', 'Categorie', 'Prix Achat', 'Quantite', 'Min', 'Statut']],
            body: stockData,
            theme: 'grid',
            headStyles: { fillColor: [234, 179, 8], textColor: [40, 40, 40], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 5) {
                const status = data.cell.text[0];
                if (status === 'RUPTURE') { data.cell.styles.textColor = [239, 68, 68]; data.cell.styles.fontStyle = 'bold'; }
                else if (status === 'FAIBLE') { data.cell.styles.textColor = [234, 179, 8]; data.cell.styles.fontStyle = 'bold'; }
                else { data.cell.styles.textColor = [34, 197, 94]; }
              }
            },
          });

          const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
          const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
          const outOfStock = products.filter(p => p.quantity === 0).length;
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFillColor(59, 130, 246);
          doc.roundedRect(14, finalY, 58, 22, 3, 3, 'F');
          doc.setFillColor(234, 179, 8);
          doc.roundedRect(76, finalY, 58, 22, 3, 3, 'F');
          doc.setFillColor(34, 197, 94);
          doc.roundedRect(138, finalY, 58, 22, 3, 3, 'F');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('Total produits', 43, finalY + 8, { align: 'center' });
          doc.text(`Stock faible / Rupture`, 105, finalY + 8, { align: 'center' });
          doc.text('Valeur du stock', 167, finalY + 8, { align: 'center' });
          doc.setFontSize(13);
          doc.text(products.length.toString(), 43, finalY + 17, { align: 'center' });
          doc.text(`${lowStock} / ${outOfStock}`, 105, finalY + 17, { align: 'center' });
          doc.setFontSize(10);
          doc.text(formatCurrencyPDF(totalStockValue), 167, finalY + 17, { align: 'center' });
        }
        break;
      }

      case 'profit': {
        const completedSales = salesData.filter(s => s.status === 'completed');
        if (completedSales.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucune vente completee pour cette periode', 105, yPosition, { align: 'center' });
        } else {
          const profitData: string[][] = [];
          completedSales.forEach(sale => {
            sale.items.forEach((item, idx) => {
              const margin = item.purchasePrice > 0 ? ((item.unitPrice - item.purchasePrice) / item.purchasePrice * 100).toFixed(1) : '0';
              profitData.push([
                idx === 0 ? format(new Date(sale.date), 'dd/MM/yy') : '',
                item.productName,
                formatCurrencyPDF(item.purchasePrice),
                formatCurrencyPDF(item.unitPrice),
                `${margin}%`,
                formatCurrencyPDF(item.profit),
              ]);
            });
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Date', 'Produit', 'Prix Achat', 'Prix Vente', 'Marge', 'Benefice']],
            body: profitData,
            theme: 'grid',
            headStyles: { fillColor: [168, 85, 247], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' }, 5: { halign: 'right' } },
          });

          const totalProfit = completedSales.reduce((sum, s) => sum + s.totalProfit, 0);
          const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
          const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : '0';
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFillColor(168, 85, 247);
          doc.roundedRect(14, finalY, 120, 25, 3, 3, 'F');
          doc.setFillColor(108, 45, 187);
          doc.roundedRect(140, finalY, 56, 25, 3, 3, 'F');
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text('BENEFICE TOTAL', 74, finalY + 10, { align: 'center' });
          doc.setFontSize(16);
          doc.text(formatCurrencyPDF(totalProfit), 74, finalY + 20, { align: 'center' });
          doc.setFontSize(8);
          doc.text('Marge moyenne', 168, finalY + 10, { align: 'center' });
          doc.setFontSize(14);
          doc.text(`${avgMargin}%`, 168, finalY + 20, { align: 'center' });
        }
        break;
      }
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 15, 210, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Sallen Trading And Service - Rapport genere automatiquement', 105, pageHeight - 6, { align: 'center' });

    return doc;
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error('Veuillez sélectionner un type de rapport');
      return;
    }
    if (selectedPeriod === 'custom' && (!customFrom || !customTo)) {
      toast.error('Veuillez sélectionner les dates de début et fin');
      return;
    }

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const content = generateReportContent(selectedReport, filteredSales, filteredEntries);
    const reportTypeName = reportTypes.find(r => r.id === selectedReport)?.name || '';

    addReport({
      type: selectedReport as 'sales' | 'financial' | 'stock' | 'profit',
      period: selectedPeriod as 'daily' | 'monthly' | 'semester' | 'annual',
      name: `${reportTypeName} - ${dateRange.label}`,
      content,
      generatedAt: new Date(),
      generatedBy: currentUser?.name || 'Inconnu',
    });

    const doc = generatePDF(selectedReport, filteredSales, filteredEntries);
    doc.save(`rapport_${selectedReport}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    setIsGenerating(false);
    toast.success('Rapport PDF généré !');
  };

  const handleDeleteReport = (id: string) => {
    deleteReport(id);
    toast.success('Rapport supprimé');
  };

  const handleDownloadReport = (report: typeof reports[0]) => {
    // Re-generate the styled PDF for the report
    const doc = generatePDF(report.type, filteredSales, filteredEntries);
    doc.save(`rapport_${report.type}_${format(new Date(report.generatedAt), 'yyyy-MM-dd')}.pdf`);
    toast.success('Rapport téléchargé');
  };

  const getReportTypeInfo = (type: string) => reportTypes.find(r => r.id === type) || reportTypes[0];

  // Stats preview
  const completedFilteredSales = filteredSales.filter(s => s.status === 'completed');
  const previewTotalSales = completedFilteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const previewTotalProfit = completedFilteredSales.reduce((sum, s) => sum + s.totalProfit, 0);
  const previewIncomes = filteredEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const previewExpenses = filteredEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

  return (
    <MainLayout title="Rapports et statistiques" subtitle="Génération et historique des rapports">
      <div className="space-y-6">
        {/* Period Selection */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Période du rapport</h3>
              <p className="text-sm text-muted-foreground">Sélectionnez la période pour filtrer les données</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {periodOptions.map((period) => (
              <button key={period.id} onClick={() => setSelectedPeriod(period.id)}
                className={cn(
                  'flex flex-col items-start rounded-lg border p-3 text-left transition-all duration-200',
                  selectedPeriod === period.id ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                )}>
                <span className="font-medium text-sm text-foreground">{period.name}</span>
                <span className="text-xs text-muted-foreground">{period.description}</span>
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {selectedPeriod === 'custom' && (
            <div className="mt-4 flex flex-wrap items-end gap-4 p-4 rounded-lg border border-dashed bg-secondary/20">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !customFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customFrom ? format(customFrom, 'dd/MM/yyyy') : 'Début'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !customTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customTo ? format(customTo, 'dd/MM/yyyy') : 'Fin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customTo} onSelect={setCustomTo} disabled={(date) => customFrom ? date < customFrom : false} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              {customFrom && customTo && (
                <Badge variant="secondary" className="h-9 px-3">{dateRange.label}</Badge>
              )}
            </div>
          )}

          {/* Period preview stats */}
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Ventes ({dateRange.label})</p>
              <p className="text-lg font-bold text-foreground">{completedFilteredSales.length}</p>
              <p className="text-xs text-primary">{formatCurrency(previewTotalSales)}</p>
            </div>
            <div className="rounded-lg bg-success/5 border border-success/10 p-3">
              <p className="text-xs text-muted-foreground">Bénéfices</p>
              <p className="text-lg font-bold text-success">{formatCurrency(previewTotalProfit)}</p>
            </div>
            <div className="rounded-lg bg-chart-4/5 border border-chart-4/10 p-3">
              <p className="text-xs text-muted-foreground">Revenus</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(previewIncomes)}</p>
            </div>
            <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3">
              <p className="text-xs text-muted-foreground">Dépenses</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(previewExpenses)}</p>
            </div>
          </div>
        </Card>

        {/* Report Types */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Types de rapports</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {reportTypes.map((report) => (
              <Card key={report.id} className={cn(
                'p-6 shadow-card cursor-pointer transition-all duration-200',
                selectedReport === report.id ? 'border-primary ring-1 ring-primary shadow-glow' : 'hover:shadow-card-hover'
              )} onClick={() => setSelectedReport(report.id)}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{report.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  </div>
                  <div className={cn(
                    'h-5 w-5 rounded-full border-2 transition-colors',
                    selectedReport === report.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  )}>
                    {selectedReport === report.id && <div className="h-full w-full flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary-foreground" /></div>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Card className="p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Générer le rapport PDF</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedReport
                    ? `${reportTypes.find(r => r.id === selectedReport)?.name} — ${dateRange.label}`
                    : 'Sélectionnez un type de rapport'}
                </p>
              </div>
            </div>
            <Button variant="gradient" size="lg" disabled={!selectedReport || isGenerating || (selectedPeriod === 'custom' && (!customFrom || !customTo))} onClick={handleGenerateReport} className="w-full sm:w-auto">
              {isGenerating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Génération...</>) : (<><Download className="mr-2 h-4 w-4" />Télécharger PDF</>)}
            </Button>
          </div>
        </Card>

        {/* History */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
              <History className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Historique des rapports</h3>
              <p className="text-sm text-muted-foreground">{reports.length} rapport(s)</p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport généré</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Par</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const typeInfo = getReportTypeInfo(report.type);
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeInfo.bgColor}`}>
                              <typeInfo.icon className={`h-4 w-4 ${typeInfo.color}`} />
                            </div>
                            <span className="font-medium">{typeInfo.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{report.name.split(' - ').slice(1).join(' - ') || periodOptions.find(p => p.id === report.period)?.name}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(report.generatedAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>{report.generatedBy}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setViewingReport(report.content)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report)}><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteReport(report.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contenu du rapport</DialogTitle>
            <DialogDescription>Aperçu du rapport</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-lg border bg-secondary/20 p-4">
            <pre className="text-sm whitespace-pre-wrap font-mono">{viewingReport}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
