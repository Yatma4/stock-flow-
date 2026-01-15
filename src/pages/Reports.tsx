import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Loader2,
  History,
  Trash2,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useProducts } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { useFinances } from '@/contexts/FinanceContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useReports } from '@/contexts/ReportContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatCurrencyPDF } from '@/lib/currency';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const reportTypes = [
  { id: 'sales', name: 'Rapport des ventes', description: 'Détail de toutes les ventes réalisées', icon: ShoppingCart, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'financial', name: 'Situation financière', description: 'Bilan des revenus et dépenses', icon: DollarSign, color: 'text-success', bgColor: 'bg-success/10' },
  { id: 'stock', name: 'État du stock', description: 'Inventaire complet des produits', icon: BarChart3, color: 'text-warning', bgColor: 'bg-warning/10' },
  { id: 'profit', name: 'Analyse des profits', description: 'Bénéfices par vente', icon: TrendingUp, color: 'text-chart-4', bgColor: 'bg-chart-4/10' },
];

const periods = [
  { id: 'daily', name: 'Quotidien', description: 'Rapport du jour' },
  { id: 'monthly', name: 'Mensuel', description: 'Rapport du mois' },
  { id: 'semester', name: 'Semestriel', description: 'Rapport sur 6 mois' },
  { id: 'annual', name: 'Annuel', description: 'Rapport de l\'annee' },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const { products } = useProducts();
  const { sales } = useSales();
  const { entries } = useFinances();
  const { categories } = useCategories();
  const { reports, addReport, deleteReport } = useReports();
  const { currentUser } = useAuth();

  const generateReportContent = (type: string) => {
    const date = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const periodName = periods.find(p => p.id === selectedPeriod)?.name || '';

    let content = `RAPPORT ${reportTypes.find(r => r.id === type)?.name.toUpperCase()}\n`;
    content += `Date: ${date}\nPériode: ${periodName}\n`;
    content += `Généré par: ${currentUser?.name || 'Inconnu'}\n`;
    content += `${'='.repeat(50)}\n\n`;

    switch (type) {
      case 'sales':
        content += `VENTES\n${'-'.repeat(30)}\n`;
        sales.forEach(sale => {
          const product = products.find(p => p.id === sale.productId);
          content += `\n${product?.name || 'Produit supprimé'}\n`;
          content += `  Quantité: ${sale.quantity}\n`;
          content += `  Prix unitaire: ${formatCurrency(sale.unitPrice)}\n`;
          content += `  Total: ${formatCurrency(sale.totalAmount)}\n`;
          content += `  Bénéfice: ${formatCurrency(sale.profit)}\n`;
          content += `  Statut: ${sale.status === 'completed' ? 'Complétée' : 'Annulée'}\n`;
        });
        const totalSales = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0);
        content += `\n${'='.repeat(50)}\n`;
        content += `TOTAL VENTES: ${formatCurrency(totalSales)}\n`;
        break;

      case 'financial':
        const totalRevenue = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        content += `REVENUS\n${'-'.repeat(30)}\n`;
        entries.filter(e => e.type === 'income').forEach(e => {
          content += `${e.category}: ${formatCurrency(e.amount)} - ${e.description}\n`;
        });
        content += `\nDÉPENSES\n${'-'.repeat(30)}\n`;
        entries.filter(e => e.type === 'expense').forEach(e => {
          content += `${e.category}: ${formatCurrency(e.amount)} - ${e.description}\n`;
        });
        content += `\n${'='.repeat(50)}\n`;
        content += `Revenus: ${formatCurrency(totalRevenue)}\n`;
        content += `Dépenses: ${formatCurrency(totalExpenses)}\n`;
        content += `Solde: ${formatCurrency(totalRevenue - totalExpenses)}\n`;
        break;

      case 'stock':
        const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
        content += `INVENTAIRE DES PRODUITS\n${'-'.repeat(30)}\n`;
        products.forEach(p => {
          const cat = categories.find(c => c.id === p.categoryId);
          content += `\n${p.name}\n`;
          content += `  Catégorie: ${cat?.name || 'Sans catégorie'}\n`;
          content += `  Prix d achat: ${formatCurrency(p.purchasePrice)}\n`;
          content += `  Quantité: ${p.quantity} ${p.unit}(s)\n`;
          content += `  Stock min: ${p.minStock}\n`;
          content += `  Statut: ${p.quantity === 0 ? 'RUPTURE' : p.quantity <= p.minStock ? 'FAIBLE' : 'OK'}\n`;
        });
        content += `\n${'='.repeat(50)}\n`;
        content += `Total produits: ${products.length}\n`;
        content += `Valeur du stock: ${formatCurrency(totalStockValue)}\n`;
        break;

      case 'profit':
        content += `ANALYSE DES BÉNÉFICES\n${'-'.repeat(30)}\n`;
        sales.filter(s => s.status === 'completed').forEach(sale => {
          const product = products.find(p => p.id === sale.productId);
          const margin = product ? ((sale.unitPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1) : '0';
          content += `\n${product?.name || 'Produit supprimé'}\n`;
          content += `  Prix d achat: ${formatCurrency(product?.purchasePrice || 0)}\n`;
          content += `  Prix de vente: ${formatCurrency(sale.unitPrice)}\n`;
          content += `  Marge: ${margin}%\n`;
          content += `  Bénéfice: ${formatCurrency(sale.profit)}\n`;
        });
        const totalProfit = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.profit, 0);
        content += `\n${'='.repeat(50)}\n`;
        content += `BÉNÉFICE TOTAL: ${formatCurrency(totalProfit)}\n`;
        break;
    }

    return content;
  };

  const generatePDF = (type: string) => {
    const doc = new jsPDF();
    const date = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const periodName = periods.find(p => p.id === selectedPeriod)?.name || '';
    const reportTypeName = reportTypes.find(r => r.id === type)?.name || '';
    const reportColor = type === 'sales' ? [59, 130, 246] : type === 'financial' ? [34, 197, 94] : type === 'stock' ? [234, 179, 8] : [168, 85, 247];

    // Header with gradient effect
    doc.setFillColor(reportColor[0], reportColor[1], reportColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('SALLEN TRADING AND SERVICE', 105, 18, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(reportTypeName.toUpperCase(), 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`${periodName} - ${date}`, 105, 40, { align: 'center' });

    // Info box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 50, 182, 18, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Date de generation: ${date}`, 20, 58);
    doc.text(`Periode: ${periodName}`, 90, 58);
    doc.text(`Genere par: ${currentUser?.name || 'Inconnu'}`, 150, 58);

    let yPosition = 78;

    switch (type) {
      case 'sales':
        if (sales.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucune vente enregistree', 105, yPosition, { align: 'center' });
        } else {
          const salesData = sales.map(sale => {
            const product = products.find(p => p.id === sale.productId);
            return [
              product?.name || 'Produit supprime',
              sale.quantity.toString(),
              formatCurrencyPDF(sale.unitPrice),
              formatCurrencyPDF(sale.totalAmount),
              formatCurrencyPDF(sale.profit),
              sale.status === 'completed' ? 'Completee' : 'Annulee'
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Produit', 'Qte', 'Prix Unit.', 'Total', 'Benefice', 'Statut']],
            body: salesData,
            theme: 'grid',
            headStyles: { 
              fillColor: [59, 130, 246], 
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            styles: { 
              fontSize: 9,
              cellPadding: 4
            },
            alternateRowStyles: {
              fillColor: [240, 248, 255]
            },
            columnStyles: {
              0: { halign: 'left' },
              1: { halign: 'center' },
              2: { halign: 'right' },
              3: { halign: 'right' },
              4: { halign: 'right' },
              5: { halign: 'center' }
            },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 5) {
                const status = data.cell.text[0];
                if (status === 'Annulee') {
                  data.cell.styles.textColor = [239, 68, 68];
                  data.cell.styles.fontStyle = 'bold';
                } else {
                  data.cell.styles.textColor = [34, 197, 94];
                }
              }
            }
          });

          const totalSales = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0);
          const totalProfit = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.profit, 0);
          
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          
          // Summary box
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
        }
        break;

      case 'financial':
        const incomes = entries.filter(e => e.type === 'income');
        const expenses = entries.filter(e => e.type === 'expense');
        const totalRevenue = incomes.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Revenus section
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(14, yPosition - 5, 88, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text('REVENUS', 58, yPosition + 2, { align: 'center' });

        if (incomes.length > 0) {
          autoTable(doc, {
            startY: yPosition + 10,
            head: [['Categorie', 'Description', 'Montant']],
            body: incomes.map(e => [e.category, e.description, formatCurrencyPDF(e.amount)]),
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [240, 255, 240] },
            columnStyles: { 2: { halign: 'right' } }
          });
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        } else {
          yPosition += 20;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucun revenu enregistre', 58, yPosition, { align: 'center' });
          yPosition += 15;
        }

        // Depenses section
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(14, yPosition - 5, 88, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text('DEPENSES', 58, yPosition + 2, { align: 'center' });

        if (expenses.length > 0) {
          autoTable(doc, {
            startY: yPosition + 10,
            head: [['Categorie', 'Description', 'Montant']],
            body: expenses.map(e => [e.category, e.description, formatCurrencyPDF(e.amount)]),
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [255, 240, 240] },
            columnStyles: { 2: { halign: 'right' } }
          });
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        } else {
          yPosition += 20;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucune depense enregistree', 58, yPosition, { align: 'center' });
          yPosition += 15;
        }

        // Summary boxes
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

      case 'stock':
        if (products.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucun produit enregistre', 105, yPosition, { align: 'center' });
        } else {
          const stockData = products
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              const status = p.quantity === 0 ? 'RUPTURE' : p.quantity <= p.minStock ? 'FAIBLE' : 'OK';
              return [
                p.name,
                cat?.name || 'Sans categorie',
                formatCurrencyPDF(p.purchasePrice),
                `${p.quantity} ${p.unit}(s)`,
                p.minStock.toString(),
                status
              ];
            });

          autoTable(doc, {
            startY: yPosition,
            head: [['Produit', 'Categorie', 'Prix Achat', 'Quantite', 'Min', 'Statut']],
            body: stockData,
            theme: 'grid',
            headStyles: { 
              fillColor: [234, 179, 8], 
              textColor: [40, 40, 40],
              fontStyle: 'bold',
              halign: 'center'
            },
            styles: { fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [255, 252, 235] },
            columnStyles: {
              2: { halign: 'right' },
              3: { halign: 'center' },
              4: { halign: 'center' },
              5: { halign: 'center' }
            },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 5) {
                const status = data.cell.text[0];
                if (status === 'RUPTURE') {
                  data.cell.styles.textColor = [239, 68, 68];
                  data.cell.styles.fontStyle = 'bold';
                  data.cell.styles.fillColor = [254, 226, 226];
                } else if (status === 'FAIBLE') {
                  data.cell.styles.textColor = [234, 179, 8];
                  data.cell.styles.fontStyle = 'bold';
                  data.cell.styles.fillColor = [254, 249, 195];
                } else {
                  data.cell.styles.textColor = [34, 197, 94];
                  data.cell.styles.fillColor = [220, 252, 231];
                }
              }
            }
          });

          const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
          const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
          const outOfStock = products.filter(p => p.quantity === 0).length;
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          
          // Stats boxes
          doc.setFillColor(59, 130, 246);
          doc.roundedRect(14, finalY, 44, 22, 3, 3, 'F');
          doc.setFillColor(234, 179, 8);
          doc.roundedRect(62, finalY, 44, 22, 3, 3, 'F');
          doc.setFillColor(239, 68, 68);
          doc.roundedRect(110, finalY, 44, 22, 3, 3, 'F');
          doc.setFillColor(34, 197, 94);
          doc.roundedRect(158, finalY, 38, 22, 3, 3, 'F');
          
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('Produits', 36, finalY + 8, { align: 'center' });
          doc.text('Stock faible', 84, finalY + 8, { align: 'center' });
          doc.text('Rupture', 132, finalY + 8, { align: 'center' });
          doc.text('Valeur', 177, finalY + 8, { align: 'center' });
          
          doc.setFontSize(11);
          doc.text(products.length.toString(), 36, finalY + 17, { align: 'center' });
          doc.text(lowStock.toString(), 84, finalY + 17, { align: 'center' });
          doc.text(outOfStock.toString(), 132, finalY + 17, { align: 'center' });
          doc.setFontSize(9);
          doc.text(formatCurrencyPDF(totalStockValue), 177, finalY + 17, { align: 'center' });
        }
        break;

      case 'profit':
        const completedSales = sales.filter(s => s.status === 'completed');
        if (completedSales.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucune vente completee', 105, yPosition, { align: 'center' });
        } else {
          const profitData = completedSales.map(sale => {
            const product = products.find(p => p.id === sale.productId);
            const margin = product && product.purchasePrice > 0 
              ? ((sale.unitPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1) 
              : '0';
            return [
              product?.name || 'Produit supprime',
              formatCurrencyPDF(product?.purchasePrice || 0),
              formatCurrencyPDF(sale.unitPrice),
              `${margin}%`,
              formatCurrencyPDF(sale.profit)
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Produit', 'Prix Achat', 'Prix Vente', 'Marge', 'Benefice']],
            body: profitData,
            theme: 'grid',
            headStyles: { 
              fillColor: [168, 85, 247], 
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            styles: { fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [250, 245, 255] },
            columnStyles: {
              1: { halign: 'right' },
              2: { halign: 'right' },
              3: { halign: 'center' },
              4: { halign: 'right' }
            },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 4) {
                const value = parseFloat(data.cell.text[0].replace(/[^\d.-]/g, ''));
                if (value > 0) {
                  data.cell.styles.textColor = [34, 197, 94];
                  data.cell.styles.fontStyle = 'bold';
                } else if (value < 0) {
                  data.cell.styles.textColor = [239, 68, 68];
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            }
          });

          const totalProfit = completedSales.reduce((sum, s) => sum + s.profit, 0);
          const avgMargin = completedSales.reduce((sum, s) => {
            const product = products.find(p => p.id === s.productId);
            if (product && product.purchasePrice > 0) {
              return sum + ((s.unitPrice - product.purchasePrice) / product.purchasePrice * 100);
            }
            return sum;
          }, 0) / completedSales.length;
          
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          
          // Profit summary
          doc.setFillColor(168, 85, 247);
          doc.roundedRect(14, finalY, 88, 28, 3, 3, 'F');
          doc.setFillColor(59, 130, 246);
          doc.roundedRect(108, finalY, 88, 28, 3, 3, 'F');
          
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text('BENEFICE TOTAL', 58, finalY + 10, { align: 'center' });
          doc.setFontSize(16);
          doc.text(formatCurrencyPDF(totalProfit), 58, finalY + 22, { align: 'center' });
          
          doc.setFontSize(10);
          doc.text('MARGE MOYENNE', 152, finalY + 10, { align: 'center' });
          doc.setFontSize(16);
          doc.text(`${avgMargin.toFixed(1)}%`, 152, finalY + 22, { align: 'center' });
        }
        break;
    }

    // Footer
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

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const content = generateReportContent(selectedReport);
    const reportTypeName = reportTypes.find(r => r.id === selectedReport)?.name || '';
    const periodName = periods.find(p => p.id === selectedPeriod)?.name || '';

    addReport({
      type: selectedReport as 'sales' | 'financial' | 'stock' | 'profit',
      period: selectedPeriod as 'daily' | 'monthly' | 'semester' | 'annual',
      name: `${reportTypeName} - ${periodName}`,
      content: content,
      generatedAt: new Date(),
      generatedBy: currentUser?.name || 'Inconnu',
    });

    const doc = generatePDF(selectedReport);
    doc.save(`rapport_${selectedReport}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    setIsGenerating(false);
    toast.success('Rapport PDF généré et sauvegardé !');
  };

  const handleDeleteReport = (id: string) => {
    deleteReport(id);
    toast.success('Rapport supprimé');
  };

  const handleDownloadReport = (report: typeof reports[0]) => {
    const doc = new jsPDF();
    const date = format(new Date(report.generatedAt), 'dd MMMM yyyy', { locale: fr });
    const periodName = periods.find(p => p.id === report.period)?.name || '';
    const reportTypeName = reportTypes.find(r => r.id === report.type)?.name || '';

    // Recreate PDF from stored data
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('SALLEN TRADING AND SERVICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text(reportTypeName.toUpperCase(), 105, 32, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${date}`, 14, 45);
    doc.text(`Période: ${periodName}`, 14, 52);
    doc.text(`Généré par: ${report.generatedBy}`, 14, 59);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 65, 196, 65);

    // Add content as text (simplified for historical reports)
    const lines = report.content.split('\n');
    let yPosition = 75;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    lines.forEach(line => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 14, yPosition);
      yPosition += 5;
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Sallen Trading And Service - Rapport généré automatiquement', 105, pageHeight - 10, { align: 'center' });

    doc.save(`rapport_${report.type}_${format(new Date(report.generatedAt), 'yyyy-MM-dd')}.pdf`);
    toast.success('Rapport PDF téléchargé');
  };

  const getReportTypeInfo = (type: string) => {
    return reportTypes.find(r => r.id === type) || reportTypes[0];
  };

  return (
    <MainLayout title="Rapports et statistiques" subtitle="Génération et historique des rapports">
      <div className="space-y-6">
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Période de rapport</h3>
              <p className="text-sm text-muted-foreground">Sélectionnez la période pour générer vos rapports</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {periods.map((period) => (
              <button key={period.id} onClick={() => setSelectedPeriod(period.id)}
                className={`flex flex-col items-start rounded-lg border p-4 text-left transition-all duration-200 ${selectedPeriod === period.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-secondary/50'}`}>
                <span className="font-medium text-foreground">{period.name}</span>
                <span className="text-sm text-muted-foreground">{period.description}</span>
              </button>
            ))}
          </div>
        </Card>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Types de rapports</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {reportTypes.map((report) => (
              <Card key={report.id} className={`p-6 shadow-card cursor-pointer transition-all duration-200 ${selectedReport === report.id ? 'border-primary ring-1 ring-primary shadow-glow' : 'hover:shadow-card-hover'}`} onClick={() => setSelectedReport(report.id)}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{report.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 transition-colors ${selectedReport === report.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                    {selectedReport === report.id && <div className="h-full w-full flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary-foreground" /></div>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Générer le rapport PDF</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedReport ? `${reportTypes.find((r) => r.id === selectedReport)?.name} - ${periods.find((p) => p.id === selectedPeriod)?.name}` : 'Sélectionnez un type de rapport'}
                </p>
              </div>
            </div>
            <Button variant="gradient" size="lg" disabled={!selectedReport || isGenerating} onClick={handleGenerateReport} className="w-full sm:w-auto">
              {isGenerating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Génération...</>) : (<><Download className="mr-2 h-4 w-4" />Télécharger PDF</>)}
            </Button>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
              <History className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Historique des rapports</h3>
              <p className="text-sm text-muted-foreground">{reports.length} rapport(s) généré(s)</p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport généré pour le moment</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Date de génération</TableHead>
                    <TableHead>Généré par</TableHead>
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
                        <TableCell>
                          <Badge variant="outline">
                            {periods.find(p => p.id === report.period)?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(report.generatedAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>{report.generatedBy}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setViewingReport(report.content)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteReport(report.id)}>
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
          )}
        </Card>
      </div>

      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contenu du rapport</DialogTitle>
            <DialogDescription>Aperçu du rapport généré</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-lg border bg-secondary/20 p-4">
            <pre className="text-sm whitespace-pre-wrap font-mono">{viewingReport}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
