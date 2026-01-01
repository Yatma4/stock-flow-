import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Shield, User, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function Users() {
  const { users, addUser, updateUser, deleteUser, updateUserCode, getUserCode, currentUser } = useAuth();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isChangeCodeOpen, setIsChangeCodeOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'employee',
    code: '',
  });
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleAdd = () => {
    setFormData({ name: '', email: '', role: 'employee', code: '' });
    setIsAddOpen(true);
  };

  const handleEdit = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        code: '',
      });
      setIsEditOpen(true);
    }
  };

  const handleDelete = (userId: string) => {
    setSelectedUserId(userId);
    setIsDeleteOpen(true);
  };

  const handleChangeCode = (userId: string) => {
    setSelectedUserId(userId);
    setNewCode('');
    setConfirmCode('');
    setIsChangeCodeOpen(true);
  };

  const submitAdd = () => {
    if (!formData.name || !formData.email) {
      toast.error('Veuillez remplir le nom et l\'email');
      return;
    }
    if (!formData.code || formData.code.length < 4) {
      toast.error('Le code d\'accès doit contenir au moins 4 caractères');
      return;
    }
    
    // Check if name already exists
    if (users.some(u => u.name.toLowerCase() === formData.name.toLowerCase())) {
      toast.error('Un utilisateur avec ce nom existe déjà');
      return;
    }
    
    const newUser = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };
    
    addUser(newUser, formData.code);
    setIsAddOpen(false);
    toast.success(`Utilisateur "${formData.name}" ajouté avec succès`);
  };

  const submitEdit = () => {
    if (!selectedUserId) return;
    if (!formData.name || !formData.email) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    // Check if name already exists (exclude current user)
    if (users.some(u => u.id !== selectedUserId && u.name.toLowerCase() === formData.name.toLowerCase())) {
      toast.error('Un utilisateur avec ce nom existe déjà');
      return;
    }
    
    updateUser(selectedUserId, {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    });
    setIsEditOpen(false);
    toast.success(`Utilisateur "${formData.name}" modifié avec succès`);
  };

  const confirmDelete = () => {
    if (!selectedUserId) return;
    
    // Prevent deleting yourself
    if (selectedUserId === currentUser?.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    
    deleteUser(selectedUserId);
    setIsDeleteOpen(false);
    toast.success(`Utilisateur supprimé`);
  };

  const submitChangeCode = () => {
    if (!selectedUserId) return;
    
    if (!newCode || newCode.length < 4) {
      toast.error('Le nouveau code doit contenir au moins 4 caractères');
      return;
    }
    
    if (newCode !== confirmCode) {
      toast.error('Les codes ne correspondent pas');
      return;
    }
    
    updateUserCode(selectedUserId, newCode);
    setIsChangeCodeOpen(false);
    toast.success('Code d\'accès modifié avec succès');
  };

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
          <Button variant="gradient" onClick={handleAdd}>
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
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="hover:bg-secondary/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{user.name}</span>
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(vous)</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
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
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        title="Modifier le code d'accès"
                        onClick={() => handleChangeCode(user.id)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        title="Modifier"
                        onClick={() => handleEdit(user.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Supprimer"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser?.id}
                      >
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

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Créez un nouveau compte utilisateur avec les permissions appropriées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom d'utilisateur</Label>
              <Input
                id="name"
                placeholder="Ex: Jean Dupont"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Ce nom sera utilisé pour se connecter
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'employee') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employé</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code d'accès</Label>
              <Input
                id="code"
                type="password"
                placeholder="Minimum 4 caractères"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                maxLength={6}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom d'utilisateur</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'employee') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employé</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Change Code Dialog */}
      <Dialog open={isChangeCodeOpen} onOpenChange={setIsChangeCodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le code d'accès</DialogTitle>
            <DialogDescription>
              Définissez un nouveau code d'accès pour {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-code">Nouveau code</Label>
              <Input
                id="new-code"
                type="password"
                placeholder="Minimum 4 caractères"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-code">Confirmer le code</Label>
              <Input
                id="confirm-code"
                type="password"
                placeholder="Répétez le code"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeCodeOpen(false)}>
              Annuler
            </Button>
            <Button variant="gradient" onClick={submitChangeCode}>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer "{selectedUser?.name}" ? Cette action est irréversible.
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
    </MainLayout>
  );
}
