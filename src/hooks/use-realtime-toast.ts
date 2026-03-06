import { toast } from 'sonner';

let lastToastTime = 0;
const DEBOUNCE_MS = 2000;

export function showRealtimeToast(label: string) {
  const now = Date.now();
  if (now - lastToastTime < DEBOUNCE_MS) return;
  lastToastTime = now;
  toast.info(`${label} mis à jour`, {
    description: 'Données synchronisées depuis un autre appareil',
    duration: 3000,
  });
}
