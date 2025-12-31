import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const users = [
  { id: '1', name: 'Jean Dupont', email: 'jean.dupont@example.com', role: 'admin' as const, status: 'active' },
  { id: '2', name: 'Marie Martin', email: 'marie.martin@example.com', role: 'employee' as const, status: 'active' },
  { id: '3', name: 'Pierre Bernard', email: 'pierre.bernard@example.com', role: 'employee' as const, status: 'active' },
  { id: '4', name: 'Sophie Petit', email: 'sophie.petit@example.com', role: 'employee' as const, status: 'inactive' },
];

export default function Users() {
  return (
    <MainLayout
      title="Gestion des utilisateurs"
      subtitle="Gérez les accès et permissions des utilisateurs"
    >
      <div className="space-y-6">
        {/* Role Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 shadow-card border-l-4 border-l-primary">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Administrateur</h4>
                <p className="text-sm text-muted-foreground">
                  Accès complet à toutes les fonctionnalités
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-card border-l-4 border-l-success">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <User className="h-6 w-6 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Employé</h4>
                <p className="text-sm text-muted-foreground">
                  Accès limité aux ventes uniquement
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button variant="gradient">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Utilisateur</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Rôle</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border',
                        user.role === 'admin'
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-success/10 text-success border-success/30'
                      )}
                    >
                      {user.role === 'admin' ? (
                        <Shield className="mr-1 h-3 w-3" />
                      ) : (
                        <User className="mr-1 h-3 w-3" />
                      )}
                      {user.role === 'admin' ? 'Administrateur' : 'Employé'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border',
                        user.status === 'active'
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-muted text-muted-foreground border-muted'
                      )}
                    >
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
    </MainLayout>
  );
}
