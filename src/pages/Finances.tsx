import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useFinances } from '@/contexts/FinanceContext';
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FinancialEntry } from '@/types';
import { formatCurrency } from '@/lib/currency';

const incomeCategories = ['Ventes', 'Services', 'Investissements', 'Autres revenus'];
const expenseCategories = ['Achats stock', 'Salaires', 'Loyer', 'Électricité', 'Marketing', 'Fournitures', 'Autres dépenses'];

export default function Finances() {
  const { entries, addEntry } = useFinances();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: 0,
  });

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'income' && entry.type === 'income') ||
      (activeTab === 'expense' && entry.type === 'expense');
    return matchesSearch && matchesTab;
  });

  const handleAdd = () => {
    setFormData({ type: 'income', category: '', description: '', amount: 0 });
    setIsAddOpen(true);
  };

  const submitAdd = () => {
    if (!formData.category || !formData.description || formData.amount <= 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const newEntry: FinancialEntry = {
      id: Date.now().toString(),
      ...formData,
      date: new Date(),
    };

    addEntry(newEntry);
    setIsAddOpen(false);
    toast.success(`${formData.type === 'income' ? 'Revenu' : 'Dépense'} ajouté(e) avec succès`);
  };

  return (
    <MainLayout
      title="Gestion financière"
      subtitle="Suivi des revenus et dépenses"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 shadow-card border-l-4 border-l-success">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <ArrowUpCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-card border-l-4 border-l-destructive">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <ArrowDownCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dépenses totales</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </Card>
          <Card
            className={cn(
              'p-5 shadow-card border-l-4',
              balance >= 0 ? 'border-l-primary' : 'border-l-destructive'
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg',
                  balance >= 0 ? 'bg-primary/10' : 'bg-destructive/10'
                )}
              >
                <Wallet
                  className={cn('h-6 w-6', balance >= 0 ? 'text-primary' : 'text-destructive')}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde net</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    balance >= 0 ? 'text-primary' : 'text-destructive'
                  )}
                >
                  {balance >= 0 ? '+' : ''}
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="all">Tout</TabsTrigger>
              <TabsTrigger value="income" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenus
              </TabsTrigger>
              <TabsTrigger value="expense" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Dépenses
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="gradient" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Catégorie</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune entrée financière. Ajoutez votre première entrée !
                  </TableCell>
                </TableRow>
              ) : filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell>
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        entry.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                      )}
                    >
                      {entry.type === 'income' ? (
                        <ArrowUpCircle className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        entry.type === 'income'
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-destructive/10 text-destructive border-destructive/30'
                      )}
                    >
                      {entry.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {entry.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(entry.date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-semibold',
                        entry.type === 'income' ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {entry.type === 'income' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une entrée</DialogTitle>
            <DialogDescription>
              Enregistrez un nouveau revenu ou une nouvelle dépense.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => 
                  setFormData({ ...formData, type: value, category: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Revenu</SelectItem>
                  <SelectItem value="expense">Dépense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {(formData.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Ex: Vente de produits électroniques"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annuler
            </Button>
            <Button variant="gradient" onClick={submitAdd}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
