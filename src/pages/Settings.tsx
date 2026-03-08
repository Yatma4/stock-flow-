import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  Smartphone,
  Tablet,
  Trash2,
  KeyRound,
  Download,
  Upload,
  DatabaseBackup,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchActiveSessions, removeAllSessions, getSessionToken } from '@/lib/session';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [archivePassword, setArchivePassword] = useState('');
  const [archivePasswordError, setArchivePasswordError] = useState('');
  const [archiveExportFirst, setArchiveExportFirst] = useState(true);
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

  const handleManageSessions = async () => {
    setIsSessionsOpen(true);
    setLoadingSessions(true);
    const sessions = await fetchActiveSessions();
    setActiveSessions(sessions);
    setLoadingSessions(false);
  };

  const handleLogoutAllSessions = async () => {
    await removeAllSessions();
    logout();
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

  const handleDeleteAllData = async () => {
    if (deletePassword !== getDeletePassword()) {
      setDeletePasswordError('Mot de passe incorrect');
      return;
    }

    try {
      // Delete all data from Supabase tables (order matters for foreign keys)
      await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('quote_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('financial_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Clear localStorage too
      const keysToDelete = [
        'app_products', 'app_sales', 'app_finances', 'app_categories',
        'app_reports', 'app_users', 'app_user_codes', 'app_settings',
        'app_delete_password', 'app_recovery', 'app_current_user',
      ];
      keysToDelete.forEach(key => localStorage.removeItem(key));

      setIsDeleteAllOpen(false);
      setDeletePassword('');
      setDeletePasswordError('');
      toast.success('Toutes les données ont été supprimées avec succès');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (error) {
      console.error('Error deleting all data:', error);
      toast.error('Erreur lors de la suppression des données');
    }
  };

  const handleArchiveData = async () => {
    if (archivePassword !== getDeletePassword()) {
      setArchivePasswordError('Mot de passe incorrect');
      return;
    }

    try {
      // Export before archiving if option is checked
      if (archiveExportFirst) {
        await handleExportData();
      }

      await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('quote_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('financial_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      ['app_sales', 'app_finances', 'app_reports'].forEach(key => localStorage.removeItem(key));

      setIsArchiveOpen(false);
      setArchivePassword('');
      setArchivePasswordError('');
      toast.success('Ventes et finances archivées — les produits sont conservés');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error archiving data:', error);
      toast.error("Erreur lors de l'archivage des données");
    }
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

  const handleExportData = async () => {
    try {
      const [categories, products, sales, saleItems, quotes, quoteItems, finances] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('sale_items').select('*'),
        supabase.from('quotes').select('*'),
        supabase.from('quote_items').select('*'),
        supabase.from('financial_entries').select('*'),
      ]);

      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          categories: categories.data || [],
          products: products.data || [],
          sales: sales.data || [],
          sale_items: saleItems.data || [],
          quotes: quotes.data || [],
          quote_items: quoteItems.data || [],
          financial_entries: finances.data || [],
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Données exportées avec succès');
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'exportation");
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || !backup.version) {
        toast.error('Fichier de sauvegarde invalide');
        return;
      }

      const confirmed = window.confirm(
        'Cette action remplacera toutes les données actuelles par celles du fichier. Continuer ?'
      );
      if (!confirmed) return;

      // Clear existing data (respect FK order)
      await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('quote_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('financial_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert in correct order
      const d = backup.data;
      if (d.categories?.length) await supabase.from('categories').insert(d.categories);
      if (d.products?.length) await supabase.from('products').insert(d.products);
      if (d.sales?.length) await supabase.from('sales').insert(d.sales);
      if (d.sale_items?.length) await supabase.from('sale_items').insert(d.sale_items);
      if (d.quotes?.length) await supabase.from('quotes').insert(d.quotes);
      if (d.quote_items?.length) await supabase.from('quote_items').insert(d.quote_items);
      if (d.financial_entries?.length) await supabase.from('financial_entries').insert(d.financial_entries);

      toast.success('Données restaurées avec succès');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'importation. Vérifiez le fichier.');
    }
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

        {/* Backup & Restore */}
        {isAdmin && (
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DatabaseBackup className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sauvegarde et restauration</h3>
                <p className="text-sm text-muted-foreground">
                  Exportez ou importez toutes les données de l'application
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Exporter les données</p>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez un fichier JSON contenant toutes vos données
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Importer les données</p>
                  <p className="text-sm text-muted-foreground">
                    Restaurez vos données depuis un fichier de sauvegarde
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    id="import-file"
                    className="hidden"
                    onChange={handleImportData}
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('import-file')?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

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
                  <p className="font-medium text-foreground">Archiver ventes et finances</p>
                  <p className="text-sm text-muted-foreground">
                    Supprime les ventes, devis et finances — les produits et catégories sont conservés
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsArchiveOpen(true)}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archiver
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sessions actives</DialogTitle>
            <DialogDescription>
              Visualisez tous les appareils actuellement connectés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {loadingSessions ? (
              <p className="text-center text-muted-foreground py-4">Chargement...</p>
            ) : activeSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Aucune session active</p>
            ) : (
              activeSessions.map((session) => {
                const currentToken = getSessionToken();
                const isCurrentSession = session.session_token === currentToken;
                const DeviceIcon = session.device_info === 'Mobile' ? Smartphone : session.device_info === 'Tablette' ? Tablet : Monitor;

                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${isCurrentSession ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <DeviceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {session.user_name}
                          {isCurrentSession && <span className="ml-2 text-xs text-primary">(cet appareil)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.browser} sur {session.os} • {session.device_info}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.user_role === 'admin' ? 'Administrateur' : 'Employé'} • Actif {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-success font-medium px-2 py-1 rounded-full bg-success/10">
                      Actif
                    </span>
                  </div>
                );
              })
            )}
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

      {/* Archive Data Confirmation */}
      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver les ventes et finances ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera toutes les ventes, devis et finances. 
              Les produits et catégories seront conservés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="archive-password">Mot de passe de suppression</Label>
            <Input
              id="archive-password"
              type="password"
              placeholder="Entrez le mot de passe spécial"
              value={archivePassword}
              onChange={(e) => {
                setArchivePassword(e.target.value);
                setArchivePasswordError('');
              }}
            />
            {archivePasswordError && (
              <p className="text-sm text-destructive">{archivePasswordError}</p>
            )}
          <div className="flex items-center space-x-2 pb-2">
            <Checkbox
              id="archive-export"
              checked={archiveExportFirst}
              onCheckedChange={(checked) => setArchiveExportFirst(checked === true)}
            />
            <Label htmlFor="archive-export" className="text-sm font-normal cursor-pointer">
              Exporter une sauvegarde avant l'archivage
            </Label>
          </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setArchivePassword('');
              setArchivePasswordError('');
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleArchiveData();
              }}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Oui, archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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