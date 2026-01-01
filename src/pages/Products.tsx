import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { products as initialProducts } from '@/data/mockData';
import { useCategories } from '@/contexts/CategoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Filter, Edit, Trash2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/currency';

export default function Products() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedRef = useRef<HTMLTableRowElement>(null);
  
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    purchasePrice: 0,
    quantity: 0,
    minStock: 5,
    unit: 'pièce',
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#2DD4BF',
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Handle highlighted product or lowstock filter from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    const filterParam = searchParams.get('filter');
    
    if (filterParam === 'lowstock') {
      setStockFilter('lowstock');
      setSearchParams({});
    }
    
    if (highlightId) {
      setHighlightedProductId(highlightId);
      // Clear the URL param after reading
      setSearchParams({});
      // Scroll to the highlighted product after a short delay
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedProductId(null);
      }, 3000);
    }
  }, [searchParams, setSearchParams]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.categoryId === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'lowstock' && (product.quantity === 0 || product.quantity <= product.minStock));
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return { label: 'Rupture', variant: 'destructive' as const };
    if (quantity <= minStock) return { label: 'Stock faible', variant: 'warning' as const };
    return { label: 'En stock', variant: 'success' as const };
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      purchasePrice: 0,
      quantity: 0,
      minStock: 5,
      unit: 'pièce',
    });
    setIsAddOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      purchasePrice: product.purchasePrice,
      quantity: product.quantity,
      minStock: product.minStock,
      unit: product.unit,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const submitAdd = () => {
    if (!formData.name || !formData.categoryId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const newProduct: Product = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts([...products, newProduct]);
    setIsAddOpen(false);
    toast.success(`Produit "${formData.name}" ajouté avec succès`);
  };

  const submitEdit = () => {
    if (!selectedProduct) return;
    if (!formData.name || !formData.categoryId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setProducts(products.map(p =>
      p.id === selectedProduct.id ? { ...p, ...formData, updatedAt: new Date() } : p
    ));
    setIsEditOpen(false);
    toast.success(`Produit "${formData.name}" modifié avec succès`);
  };

  const confirmDelete = () => {
    if (!selectedProduct) return;
    setProducts(products.filter(p => p.id !== selectedProduct.id));
    setIsDeleteOpen(false);
    toast.success(`Produit "${selectedProduct.name}" supprimé`);
  };

  const handleAddCategory = () => {
    if (!categoryForm.name) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryForm);
      toast.success(`Catégorie "${categoryForm.name}" modifiée`);
    } else {
      addCategory({
        id: Date.now().toString(),
        ...categoryForm,
      });
      toast.success(`Catégorie "${categoryForm.name}" ajoutée`);
    }
    setCategoryForm({ name: '', description: '', color: '#2DD4BF' });
    setEditingCategory(null);
    setIsCategoryOpen(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
    });
    setIsCategoryOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const hasProducts = products.some(p => p.categoryId === categoryId);
    if (hasProducts) {
      toast.error('Impossible de supprimer une catégorie contenant des produits');
      return;
    }
    deleteCategory(categoryId);
    toast.success('Catégorie supprimée');
  };

  return (
    <MainLayout
      title="Gestion des produits"
      subtitle={`${products.length} produits dans l'inventaire`}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', description: '', color: '#2DD4BF' });
                setIsCategoryOpen(true);
              }}>
                <Tag className="mr-2 h-4 w-4" />
                Gérer catégories
              </Button>
            )}
            <Button variant="gradient" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Produit</TableHead>
                <TableHead className="font-semibold">Catégorie</TableHead>
                <TableHead className="font-semibold text-right">Prix d'achat</TableHead>
                <TableHead className="font-semibold text-right">Quantité</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const status = getStockStatus(product.quantity, product.minStock);
                const isHighlighted = product.id === highlightedProductId;

                return (
                  <TableRow 
                    key={product.id}
                    ref={isHighlighted ? highlightedRef : undefined}
                    className={cn(
                      "hover:bg-secondary/30 transition-all cursor-pointer",
                      isHighlighted && "bg-warning/20 ring-2 ring-warning animate-pulse"
                    )}
                    onClick={() => handleEdit(product)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-semibold text-sm"
                          style={{ backgroundColor: category?.color || 'hsl(var(--primary))' }}
                        >
                          {product.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Stock min: {product.minStock} {product.unit}(s)
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `${category?.color}15`,
                          color: category?.color,
                          borderColor: `${category?.color}30`,
                        }}
                      >
                        {category?.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.quantity} {product.unit}(s)
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          status.variant === 'success' && 'bg-success/10 text-success border-success/30',
                          status.variant === 'warning' && 'bg-warning/10 text-warning border-warning/30',
                          status.variant === 'destructive' && 'bg-destructive/10 text-destructive border-destructive/30'
                        )}
                      >
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(product);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product);
                          }}
                        >
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
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un produit</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau produit à votre inventaire. Le prix de vente sera défini lors de la vente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit</Label>
              <Input
                id="name"
                placeholder="Ex: iPhone 15 Pro"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Prix d'achat (FCFA)</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock minimum</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                />
              </div>
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

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
            <DialogDescription>
              Modifiez les informations du produit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du produit</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-purchasePrice">Prix d'achat (FCFA)</Label>
              <Input
                id="edit-purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantité</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minStock">Stock minimum</Label>
                <Input
                  id="edit-minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button variant="gradient" onClick={submitEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer "{selectedProduct?.name}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Gérer les catégories'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Modifiez les informations de la catégorie' 
                : 'Ajoutez ou modifiez vos catégories de produits'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom de la catégorie</Label>
              <Input
                id="cat-name"
                placeholder="Ex: Électronique"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                placeholder="Ex: Appareils et accessoires"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-color">Couleur</Label>
              <div className="flex gap-2">
                <Input
                  id="cat-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            
            {!editingCategory && categories.length > 0 && (
              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground mb-2 block">Catégories existantes</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCategory(cat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCategoryOpen(false);
              setEditingCategory(null);
            }}>
              {editingCategory ? 'Annuler' : 'Fermer'}
            </Button>
            <Button variant="gradient" onClick={handleAddCategory}>
              {editingCategory ? 'Enregistrer' : 'Ajouter catégorie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
