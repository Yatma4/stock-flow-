import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFinances } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FinancialEntry } from '@/types';

const expenseCategories = ['Loyer', 'Transport', 'Fournitures', 'Salaires', 'Maintenance', 'Autre'];
const incomeCategories = ['Vente', 'Service', 'Commission', 'Autre'];

export default function Expenses() {
  const { entries, addEntry, updateEntry, deleteEntry } = useFinances();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: '',
    category: '',
  });

  const filtered = entries.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'all' || e.type === tab;
    return matchesSearch && matchesTab;
  });

  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    setFormData({ type: 'expense', description: '', amount: '', category: '' });
    setIsAddOpen(true);
  };

  const handleEdit = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setFormData({
      type: entry.type,
      description: entry.description,
      amount: String(entry.amount),
      category: entry.category,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    if (!formData.description.trim()) {
      toast.error('Veuillez saisir une description');
      return false;
    }
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return false;
    }
    if (!formData.category) {
      toast.error('Veuillez sélectionner une catégorie');
      return false;
    }
    return true;
  };

  const submitAdd = () => {
    if (!validateForm()) return;
    const entry: FinancialEntry = {
      id: crypto.randomUUID(),
      type: formData.type,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: new Date(),
    };
    addEntry(entry);
    setIsAddOpen(false);
    toast.success(formData.type === 'expense' ? 'Dépense ajoutée' : 'Recette ajoutée');
  };

  const submitEdit = () => {
    if (!selectedEntry || !validateForm()) return;
    updateEntry(selectedEntry.id, {
      type: formData.type,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
    });
    setIsEditOpen(false);
    toast.success('Entrée modifiée avec succès');
  };

  const confirmDelete = () => {
    if (!selectedEntry) return;
    deleteEntry(selectedEntry.id);
    setIsDeleteOpen(false);
    toast.success('Entrée supprimée');
  };

  const categories = formData.type === 'expense' ? expenseCategories : incomeCategories;

  const renderFormFields = () => (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={formData.type}
          onValueChange={(v) => setFormData({ ...formData, type: v as 'income' | 'expense', category: '' })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Dépense</SelectItem>
            <SelectItem value="income">Recette</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          placeholder="Ex: Achat de fournitures"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label>Montant (FCFA)</Label>
        <Input
          type="number"
          placeholder="0"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Catégorie</Label>
        <Select
          value={formData.category}
          onValueChange={(v) => setFormData({ ...formData, category: v })}
        >
          <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <MainLayout title="Dépenses & Recettes" subtitle="Suivi des mouvements financiers">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Recettes</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(totalIncome)}</p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Dépenses</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters + Add button */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Tout</TabsTrigger>
              <TabsTrigger value="income">Recettes</TabsTrigger>
              <TabsTrigger value="expense">Dépenses</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="gradient" onClick={handleAdd} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune entrée trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.category}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.type === 'income'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {entry.type === 'income' ? 'Recette' : 'Dépense'}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${
                      entry.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle entrée</DialogTitle>
            <DialogDescription>Ajouter une dépense ou une recette</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
            <Button variant="gradient" onClick={submitAdd}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'entrée</DialogTitle>
            <DialogDescription>Modifiez les informations de cette entrée</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
            <Button variant="gradient" onClick={submitEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer "{selectedEntry?.description}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
