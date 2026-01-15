import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { useCategories } from '@/contexts/CategoryContext';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Package, ShoppingCart, Tag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface SearchResult {
  type: 'product' | 'category' | 'sale';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { products } = useProducts();
  const { sales } = useSales();
  const { categories } = useCategories();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const q = query.toLowerCase();

    // Produits triés alphabétiquement
    [...products]
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .forEach(product => {
        if (product.name.toLowerCase().includes(q)) {
          const category = categories.find(c => c.id === product.categoryId);
          results.push({
            type: 'product',
            id: product.id,
            title: product.name,
            subtitle: `${category?.name || 'Sans catégorie'} - ${formatCurrency(product.purchasePrice)}`,
            link: '/products',
          });
        }
      });

    // Catégories triées alphabétiquement
    [...categories]
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .forEach(category => {
        if (category.name.toLowerCase().includes(q) || category.description?.toLowerCase().includes(q)) {
          const productCount = products.filter(p => p.categoryId === category.id).length;
          results.push({
            type: 'category',
            id: category.id,
            title: category.name,
            subtitle: `${productCount} produit(s)`,
            link: '/products',
          });
        }
      });

    // Ventes triées par nom de produit alphabétiquement
    [...sales]
      .sort((a, b) => {
        const productA = products.find(p => p.id === a.productId);
        const productB = products.find(p => p.id === b.productId);
        return (productA?.name || '').localeCompare(productB?.name || '', 'fr');
      })
      .forEach(sale => {
        const product = products.find(p => p.id === sale.productId);
        if (product?.name.toLowerCase().includes(q)) {
          results.push({
            type: 'sale',
            id: sale.id,
            title: `Vente: ${product.name}`,
            subtitle: `${sale.quantity} × ${formatCurrency(sale.unitPrice)}`,
            link: '/sales',
          });
        }
      });

    return results.slice(0, 10);
  }, [query, categories, products, sales]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'product': return Package;
      case 'category': return Tag;
      case 'sale': return ShoppingCart;
      default: return Package;
    }
  };

  return (
    <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <Input
        type="search"
        placeholder="Rechercher produits, catégories..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value) setOpen(true);
        }}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="w-64 pl-9 bg-secondary/50 border-transparent focus:border-primary focus:bg-background"
      />
      {open && query && (
        <div className="absolute top-full left-0 mt-2 w-80 z-50 rounded-md border bg-popover p-0 shadow-md">
          <Command>
            <CommandList>
              {searchResults.length === 0 ? (
                <CommandEmpty>
                  Aucun résultat trouvé
                </CommandEmpty>
              ) : (
                <CommandGroup heading="Résultats">
                  {searchResults.map((result) => {
                    const Icon = getIcon(result.type);
                    return (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
