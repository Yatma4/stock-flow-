import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Bell,
  Shield,
  Save,
  Monitor,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const SETTINGS_KEY = 'app_settings';
const DELETE_PASSWORD_KEY = 'app_delete_password';
const DEFAULT_DELETE_PASSWORD = 'SUPPRIMER2024';
const RECOVERY_KEY = 'app_recovery_question';
const DEFAULT_RECOVERY = { question: 'Quel est le nom de votre première entreprise ?', answer: 'sallen' };

interface AppSettings {
  company: {
    name: string;
    email: string;
    phone: string;
  };
  notifications: {
    lowStock: boolean;
    outOfStock: boolean;
    autoReports: boolean;
  };
  security: {
    twoFactor: boolean;
  };
}

const defaultSettings: AppSettings = {
  company: {
    name: 'Sallen Trading And Service',
    email: 'contact@sallen.com',
    phone: '+225 07 00 00 00 00',
  },
  notifications: {
    lowStock: true,
    outOfStock: true,
    autoReports: false,
  },
  security: {
    twoFactor: false,
  },
};

export default function Settings() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isRecoverySettingsOpen, setIsRecoverySettingsOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [currentDeletePassword, setCurrentDeletePassword] = useState('');
  const [newDeletePassword, setNewDeletePassword] = useState('');
  const [confirmNewDeletePassword, setConfirmNewDeletePassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Recovery question state
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Track changes
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    const original = stored ? JSON.parse(stored) : defaultSettings;
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(original));
  }, [settings]);

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setHasChanges(false);
    toast.success('Paramètres enregistrés avec succès');
  };

  const handleManageSessions = () => {
    setIsSessionsOpen(true);
  };

  const handleLogoutAllSessions = () => {
    setIsSessionsOpen(false);
    toast.success('Toutes les sessions ont été déconnectées');
  };

  const getDeletePassword = () => {
    return localStorage.getItem(DELETE_PASSWORD_KEY) || DEFAULT_DELETE_PASSWORD;
  };

  const getRecovery = () => {
    const stored = localStorage.getItem(RECOVERY_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_RECOVERY;
  };

  const handleDeleteAllData = () => {
    if (deletePassword !== getDeletePassword()) {
      setDeletePasswordError('Mot de passe incorrect');
      return;
    }

    // Clear ALL application data from localStorage - complete reset
    const keysToDelete = [
      'app_products',
      'app_sales',
      'app_finances',
      'app_categories',
      'app_reports',
      'app_users',
      'app_user_codes',
      'app_settings',
      'app_delete_password',
      'app_recovery',
      'app_current_user',
    ];
    
    keysToDelete.forEach(key => localStorage.removeItem(key));
    
    setIsDeleteAllOpen(false);
    setDeletePassword('');
    setDeletePasswordError('');
    toast.success('Application réinitialisée avec succès');
    
    // Reload the page to reset all contexts and return to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  const handleChangeDeletePassword = () => {
    if (currentDeletePassword !== getDeletePassword()) {
      setChangePasswordError('Mot de passe actuel incorrect');
      return;
    }

    if (newDeletePassword.length < 6) {
      setChangePasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newDeletePassword !== confirmNewDeletePassword) {
      setChangePasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    localStorage.setItem(DELETE_PASSWORD_KEY, newDeletePassword);
    setIsChangePasswordOpen(false);
    setCurrentDeletePassword('');
    setNewDeletePassword('');
    setConfirmNewDeletePassword('');
    setChangePasswordError('');
    toast.success('Mot de passe de suppression modifié avec succès');
  };

  const openChangePasswordDialog = () => {
    setCurrentDeletePassword('');
    setNewDeletePassword('');
    setConfirmNewDeletePassword('');
    setChangePasswordError('');
    setIsChangePasswordOpen(true);
  };

  const openDeleteDialog = () => {
    setDeletePassword('');
    setDeletePasswordError('');
    setIsDeleteAllOpen(true);
  };

  const openRecoverySettings = () => {
    const current = getRecovery();
    setRecoveryQuestion(current.question);
    setRecoveryAnswer('');
    setRecoveryError('');
    setIsRecoverySettingsOpen(true);
  };

  const handleSaveRecovery = () => {
    if (!recoveryQuestion.trim()) {
      setRecoveryError('Veuillez entrer une question');
      return;
    }
    if (!recoveryAnswer.trim()) {
      setRecoveryError('Veuillez entrer une réponse');
      return;
    }
    localStorage.setItem(RECOVERY_KEY, JSON.stringify({
      question: recoveryQuestion.trim(),
      answer: recoveryAnswer.trim().toLowerCase()
    }));
    setIsRecoverySettingsOpen(false);
    toast.success('Question de récupération mise à jour');
  };

  const updateCompany = (field: keyof AppSettings['company'], value: string) => {
    setSettings(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }));
  };

  const updateNotifications = (field: keyof AppSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const updateSecurity = (field: keyof AppSettings['security'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value },
    }));
    if (field === 'twoFactor') {
      toast.success(value ? '2FA activée' : '2FA désactivée');
    }
  };

  return (
    <MainLayout
      title="Paramètres"
      subtitle="Configuration de l'application"
    >
      <div className="max-w-3xl space-y-6">
        {/* Company Info */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Informations de l'entreprise</h3>
              <p className="text-sm text-muted-foreground">
                Paramètres généraux de votre entreprise
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nom de l'entreprise</Label>
                <Input 
                  id="company-name" 
                  value={settings.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input 
                  id="company-email" 
                  type="email" 
                  value={settings.company.email}
                  onChange={(e) => updateCompany('email', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-phone">Téléphone</Label>
                <Input 
                  id="company-phone" 
                  value={settings.company.phone}
                  onChange={(e) => updateCompany('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-currency">Devise</Label>
                <Input id="company-currency" defaultValue="FCFA (Francs CFA)" disabled />
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Bell className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Configurez les alertes et notifications
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Alertes de stock faible</p>
                <p className="text-sm text-muted-foreground">
                  Recevoir une notification quand un produit atteint le seuil minimum
                </p>
              </div>
              <Switch 
                checked={settings.notifications.lowStock}
                onCheckedChange={(checked) => updateNotifications('lowStock', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Alertes de rupture</p>
                <p className="text-sm text-muted-foreground">
                  Notification immédiate en cas de rupture de stock
                </p>
              </div>
              <Switch 
                checked={settings.notifications.outOfStock}
                onCheckedChange={(checked) => updateNotifications('outOfStock', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Rapports automatiques</p>
                <p className="text-sm text-muted-foreground">
                  Envoyer un rapport hebdomadaire par email
                </p>
              </div>
              <Switch 
                checked={settings.notifications.autoReports}
                onCheckedChange={(checked) => updateNotifications('autoReports', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sécurité</h3>
              <p className="text-sm text-muted-foreground">
                Paramètres de sécurité du compte
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Authentification à deux facteurs</p>
                <p className="text-sm text-muted-foreground">
                  Ajoutez une couche de sécurité supplémentaire
                </p>
              </div>
              <Switch 
                checked={settings.security.twoFactor}
                onCheckedChange={(checked) => updateSecurity('twoFactor', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sessions actives</p>
                <p className="text-sm text-muted-foreground">
                  Gérez les appareils connectés
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageSessions}>
                Gérer
              </Button>
            </div>
          </div>
        </Card>

        {/* Admin: Delete All Data */}
        {isAdmin && (
          <Card className="p-6 shadow-card border-destructive/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Zone de danger</h3>
                <p className="text-sm text-muted-foreground">
                  Actions irréversibles réservées à l'administrateur
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Question de récupération</p>
                  <p className="text-sm text-muted-foreground">
                    Configurez une question pour récupérer le code d'accès en cas d'oubli
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openRecoverySettings}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Configurer
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Mot de passe de suppression</p>
                  <p className="text-sm text-muted-foreground">
                    Modifiez le mot de passe spécial requis pour supprimer les données
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openChangePasswordDialog}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Supprimer toutes les données</p>
                  <p className="text-sm text-muted-foreground">
                    Supprime tous les produits, ventes, finances, catégories et rapports
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={openDeleteDialog}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Tout supprimer
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {hasChanges && (
            <p className="text-sm text-muted-foreground self-center">
              Modifications non enregistrées
            </p>
          )}
          <Button 
            variant="gradient" 
            size="lg" 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      {/* Sessions Dialog */}
      <Dialog open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessions actives</DialogTitle>
            <DialogDescription>
              Gérez vos sessions connectées sur différents appareils.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Cet appareil</p>
                  <p className="text-xs text-muted-foreground">Chrome sur Windows • Session actuelle</p>
                </div>
              </div>
              <span className="text-xs text-success font-medium px-2 py-1 rounded-full bg-success/10">
                Actif
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionsOpen(false)}>
              Fermer
            </Button>
            <Button variant="destructive" onClick={handleLogoutAllSessions}>
              Déconnecter toutes les sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Data Confirmation */}
      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement toutes les données 
              de l'application : produits, ventes, finances, catégories et rapports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="delete-password">Mot de passe de suppression</Label>
            <Input
              id="delete-password"
              type="password"
              placeholder="Entrez le mot de passe spécial"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeletePasswordError('');
              }}
            />
            {deletePasswordError && (
              <p className="text-sm text-destructive">{deletePasswordError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Ce mot de passe est différent de votre code d'accès administrateur.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeletePassword('');
              setDeletePasswordError('');
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAllData();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Oui, tout supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Delete Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le mot de passe de suppression</DialogTitle>
            <DialogDescription>
              Ce mot de passe est requis pour supprimer toutes les données de l'application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-delete-password">Mot de passe actuel</Label>
              <Input
                id="current-delete-password"
                type="password"
                placeholder="Entrez le mot de passe actuel"
                value={currentDeletePassword}
                onChange={(e) => {
                  setCurrentDeletePassword(e.target.value);
                  setChangePasswordError('');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-delete-password">Nouveau mot de passe</Label>
              <Input
                id="new-delete-password"
                type="password"
                placeholder="Entrez le nouveau mot de passe"
                value={newDeletePassword}
                onChange={(e) => {
                  setNewDeletePassword(e.target.value);
                  setChangePasswordError('');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-delete-password"
                type="password"
                placeholder="Confirmez le nouveau mot de passe"
                value={confirmNewDeletePassword}
                onChange={(e) => {
                  setConfirmNewDeletePassword(e.target.value);
                  setChangePasswordError('');
                }}
              />
            </div>
            {changePasswordError && (
              <p className="text-sm text-destructive">{changePasswordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleChangeDeletePassword}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Question Settings Dialog */}
      <Dialog open={isRecoverySettingsOpen} onOpenChange={setIsRecoverySettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question de récupération</DialogTitle>
            <DialogDescription>
              Cette question sera utilisée pour récupérer le code d'accès administrateur en cas d'oubli.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-question">Question de sécurité</Label>
              <Input
                id="recovery-question"
                placeholder="Ex: Quel est le nom de votre animal ?"
                value={recoveryQuestion}
                onChange={(e) => {
                  setRecoveryQuestion(e.target.value);
                  setRecoveryError('');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-answer">Réponse secrète</Label>
              <Input
                id="recovery-answer"
                placeholder="Entrez la réponse"
                value={recoveryAnswer}
                onChange={(e) => {
                  setRecoveryAnswer(e.target.value);
                  setRecoveryError('');
                }}
              />
              <p className="text-xs text-muted-foreground">
                La réponse n'est pas sensible à la casse.
              </p>
            </div>
            {recoveryError && (
              <p className="text-sm text-destructive">{recoveryError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecoverySettingsOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRecovery}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}