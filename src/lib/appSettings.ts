import { supabase } from '@/integrations/supabase/client';

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from('app_settings' as never)
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.error(`getSetting(${key}) error:`, error);
    return fallback;
  }
  if (!data) return fallback;
  return ((data as { value: unknown }).value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('app_settings' as never)
    .upsert({ key, value } as never, { onConflict: 'key' });
  if (error) console.error(`setSetting(${key}) error:`, error);
}

export function subscribeSettings(onChange: () => void) {
  const channel = supabase
    .channel('app-settings-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
      onChange();
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
