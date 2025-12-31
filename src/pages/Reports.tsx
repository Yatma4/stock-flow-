import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';

const reportTypes = [
  {
    id: 'sales',
    name: 'Rapport des ventes',
    description: 'Détail de toutes les ventes réalisées',
    icon: ShoppingCart,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'financial',
    name: 'Situation financière',
    description: 'Bilan des revenus et dépenses',
    icon: DollarSign,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'stock',
    name: 'État du stock',
    description: 'Inventaire complet des produits',
    icon: BarChart3,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'profit',
    name: 'Analyse des profits',
    description: 'Marges et bénéfices par produit',
    icon: TrendingUp,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
];

const periods = [
  { id: 'daily', name: 'Quotidien', description: 'Rapport du jour' },
  { id: 'monthly', name: 'Mensuel', description: 'Rapport du mois' },
  { id: 'semester', name: 'Semestriel', description: 'Rapport sur 6 mois' },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const handleGenerateReport = () => {
    if (!selectedReport) return;
    // In a real app, this would generate and download a PDF
    alert(`Génération du rapport ${selectedReport} pour la période ${selectedPeriod}`);
  };

  return (
    <MainLayout
      title="Rapports et statistiques"
      subtitle="Génération de rapports détaillés en PDF"
    >
      <div className="space-y-6">
        {/* Period Selection */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Période de rapport</h3>
              <p className="text-sm text-muted-foreground">
                Sélectionnez la période pour générer vos rapports
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`flex flex-col items-start rounded-lg border p-4 text-left transition-all duration-200 ${
                  selectedPeriod === period.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                }`}
              >
                <span className="font-medium text-foreground">{period.name}</span>
                <span className="text-sm text-muted-foreground">{period.description}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Report Types */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Types de rapports</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {reportTypes.map((report) => (
              <Card
                key={report.id}
                className={`p-6 shadow-card cursor-pointer transition-all duration-200 ${
                  selectedReport === report.id
                    ? 'border-primary ring-1 ring-primary shadow-glow'
                    : 'hover:shadow-card-hover'
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{report.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 transition-colors ${
                      selectedReport === report.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {selectedReport === report.id && (
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
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
                <h4 className="font-semibold text-foreground">Générer le rapport</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedReport
                    ? `${reportTypes.find((r) => r.id === selectedReport)?.name} - ${
                        periods.find((p) => p.id === selectedPeriod)?.name
                      }`
                    : 'Sélectionnez un type de rapport'}
                </p>
              </div>
            </div>
            <Button
              variant="gradient"
              size="lg"
              disabled={!selectedReport}
              onClick={handleGenerateReport}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger en PDF
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
