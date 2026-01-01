import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, adminOnly: true },
  { name: 'Produits', href: '/products', icon: Package, adminOnly: true },
  { name: 'Ventes', href: '/sales', icon: ShoppingCart, adminOnly: false },
  { name: 'Finances', href: '/finances', icon: Wallet, adminOnly: true },
  { name: 'Rapports', href: '/reports', icon: FileText, adminOnly: true },
  { name: 'Utilisateurs', href: '/users', icon: Users, adminOnly: true },
  { name: 'Paramètres', href: '/settings', icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const isAdmin = currentUser?.role === 'admin';

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">StockFlow</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg p-2',
              collapsed ? 'justify-center' : ''
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
              {currentUser?.name.charAt(0) || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {currentUser?.name || 'Utilisateur'}
                </p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {isAdmin ? 'Administrateur' : 'Employé'}
                </p>
              </div>
            )}
            {!collapsed && (
              <button 
                onClick={handleLogout}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-sidebar-foreground" />
          )}
        </button>
      </div>
    </aside>
  );
}