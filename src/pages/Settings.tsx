import { useState } from 'react';
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
  Building2,
  Bell,
  Shield,
  Save,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [companyData, setCompanyData] = useState({
    name: 'StockFlow SARL',
    email: 'contact@stockflow.com',
    phone: '+33 1 23 45 67 89',
  });

  const [notifications, setNotifications] = useState({
    lowStock: true,
    outOfStock: true,
    autoReports: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
  });

  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const handleSave = () => {
    toast.success('Paramètres enregistrés avec succès');
  };

  const handleManageSessions = () => {
    setIsSessionsOpen(true);
  };

  const handleLogoutAllSessions = () => {
    setIsSessionsOpen(false);
    toast.success('Toutes les sessions ont été déconnectées');
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
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input 
                  id="company-email" 
                  type="email" 
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-phone">Téléphone</Label>
                <Input 
                  id="company-phone" 
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-currency">Devise</Label>
                <Input id="company-currency" defaultValue="EUR (€)" disabled />
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
                checked={notifications.lowStock}
                onCheckedChange={(checked) => setNotifications({ ...notifications, lowStock: checked })}
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
                checked={notifications.outOfStock}
                onCheckedChange={(checked) => setNotifications({ ...notifications, outOfStock: checked })}
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
                checked={notifications.autoReports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, autoReports: checked })}
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
                checked={security.twoFactor}
                onCheckedChange={(checked) => {
                  setSecurity({ ...security, twoFactor: checked });
                  toast.success(checked ? '2FA activée' : '2FA désactivée');
                }}
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

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="gradient" size="lg" onClick={handleSave}>
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
                  <p className="text-xs text-muted-foreground">Chrome sur Windows • Paris, France</p>
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
    </MainLayout>
  );
}
