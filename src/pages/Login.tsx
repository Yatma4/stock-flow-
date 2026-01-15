import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, Package, AlertCircle, User, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const RECOVERY_KEY = 'app_recovery_question';
const DEFAULT_RECOVERY = { question: 'Quel est le nom de votre première entreprise ?', answer: 'sallen' };

export default function Login() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [recoveredCode, setRecoveredCode] = useState('');
  const { login, users, getUserCode } = useAuth();
  const navigate = useNavigate();

  const getRecovery = () => {
    const stored = localStorage.getItem(RECOVERY_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_RECOVERY;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError("Veuillez entrer votre nom d'utilisateur");
      return;
    }
    
    if (!code) {
      setError("Veuillez entrer votre code d'accès");
      return;
    }
    
    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(username.trim(), code);
    if (success) {
      navigate('/');
    } else {
      setError("Nom d'utilisateur ou code d'accès incorrect");
    }
    setIsLoading(false);
  };

  const handleRecovery = () => {
    const recovery = getRecovery();
    if (recoveryAnswer.toLowerCase().trim() === recovery.answer.toLowerCase().trim()) {
      // Find admin user and show their code
      const adminUser = users.find(u => u.role === 'admin');
      if (adminUser) {
        const adminCode = getUserCode(adminUser.id);
        if (adminCode) {
          setRecoveredCode(adminCode);
          setShowCode(true);
          setRecoveryError('');
          toast.success('Code récupéré avec succès !');
        }
      }
    } else {
      setRecoveryError('Réponse incorrecte');
    }
  };

  const openRecoveryDialog = () => {
    setRecoveryAnswer('');
    setRecoveryError('');
    setShowCode(false);
    setRecoveredCode('');
    setIsRecoveryOpen(true);
  };

  const recovery = getRecovery();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md p-8 shadow-card">
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Package className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="text-xl font-bold text-foreground">Sallen Trading And Service</h1>
            <p className="text-muted-foreground mt-2">
              Connectez-vous pour accéder à l'application
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Entrez votre nom"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Code d'accès</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  type="password"
                  placeholder="••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-10 text-center text-xl tracking-[0.3em]"
                  maxLength={6}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={openRecoveryDialog}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Code oublié ?
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Utilisateurs par défaut:<br />
              Nom: Administrateur, Code: 1234<br />
              Nom: Employé 1, Code: 5678
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Password Recovery Dialog */}
      <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Récupération du code d'accès</DialogTitle>
            <DialogDescription>
              Répondez à la question de sécurité pour récupérer le code administrateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!showCode ? (
              <>
                <div className="space-y-2">
                  <Label>Question de sécurité</Label>
                  <p className="text-sm font-medium text-foreground bg-secondary/50 p-3 rounded-lg">
                    {recovery.question}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recovery-answer">Votre réponse</Label>
                  <Input
                    id="recovery-answer"
                    type="text"
                    placeholder="Entrez votre réponse"
                    value={recoveryAnswer}
                    onChange={(e) => {
                      setRecoveryAnswer(e.target.value);
                      setRecoveryError('');
                    }}
                  />
                </div>
                {recoveryError && (
                  <p className="text-sm text-destructive">{recoveryError}</p>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                  <KeyRound className="h-8 w-8 text-success" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">Code administrateur récupéré :</p>
                <p className="text-3xl font-bold tracking-[0.3em] text-foreground bg-secondary/50 py-4 rounded-lg">
                  {recoveredCode}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Notez ce code et gardez-le en sécurité.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {!showCode ? (
              <>
                <Button variant="outline" onClick={() => setIsRecoveryOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleRecovery}>
                  Vérifier
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsRecoveryOpen(false)}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
