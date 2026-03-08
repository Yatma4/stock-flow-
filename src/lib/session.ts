import { supabase } from '@/integrations/supabase/client';

const SESSION_TOKEN_KEY = 'app_session_token';

function generateToken(): string {
  return crypto.randomUUID();
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Navigateur inconnu';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'OS inconnu';
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile';
  if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablette';
  return 'Ordinateur';
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export async function registerSession(userId: string, userName: string, userRole: string) {
  // Remove any existing session for this token
  const existingToken = getSessionToken();
  if (existingToken) {
    await supabase.from('active_sessions').delete().eq('session_token', existingToken);
  }

  const token = generateToken();
  localStorage.setItem(SESSION_TOKEN_KEY, token);

  const browser = detectBrowser();
  const os = detectOS();
  const device = detectDevice();

  await supabase.from('active_sessions').insert({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    device_info: device,
    browser,
    os,
    session_token: token,
  });

  return token;
}

export async function removeSession() {
  const token = getSessionToken();
  if (token) {
    await supabase.from('active_sessions').delete().eq('session_token', token);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export async function removeAllSessions() {
  await supabase.from('active_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function fetchActiveSessions() {
  const { data, error } = await supabase
    .from('active_sessions')
    .select('*')
    .order('last_active_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  return data || [];
}

export async function updateSessionActivity() {
  const token = getSessionToken();
  if (token) {
    await supabase
      .from('active_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('session_token', token);
  }
}
