import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, LogOut, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function UserSwitcher() {
  const { currentUser, users, switchUser, logout } = useAuth();
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSelectUser = (userId: string) => {
    if (userId === currentUser?.id) return;
    setSelectedUserId(userId);
    setCode('');
    setError('');
    setIsSwitchOpen(true);
  };

  const handleSwitch = () => {
    if (!selectedUserId) return;
    
    const success = switchUser(selectedUserId, code);
    if (success) {
      setIsSwitchOpen(false);
      const user = users.find(u => u.id === selectedUserId);
      toast.success(`Connecté en tant que ${user?.name}`);
    } else {
      setError('Code d\'accès incorrect');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!currentUser) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentUser.role === 'admin' ? 'Administrateur' : currentUser.role === 'assistant' ? 'Assistant' : 'Employé'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
            Changer d'utilisateur
          </DropdownMenuLabel>
          {users.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              disabled={user.id === currentUser.id}
              className="flex items-center gap-2"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-secondary text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role === 'admin' ? 'Admin' : 'Employé'}
                </p>
              </div>
              {user.id === currentUser.id && (
                <span className="text-xs text-primary">Actuel</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSwitchOpen} onOpenChange={setIsSwitchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Changer d'utilisateur
            </DialogTitle>
            <DialogDescription>
              Entrez le code d'accès de {users.find(u => u.id === selectedUserId)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="switch-code">Code d'accès</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="switch-code"
                  type="password"
                  placeholder="••••"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  className="pl-10 text-center text-xl tracking-[0.5em]"
                  maxLength={6}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSwitchOpen(false)}>
              Annuler
            </Button>
            <Button variant="gradient" onClick={handleSwitch} disabled={!code}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
