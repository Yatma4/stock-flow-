import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { registerSession, removeSession } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { showRealtimeToast } from '@/hooks/use-realtime-toast';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, code: string) => boolean;
  logout: () => void;
  switchUser: (userId: string, code: string) => boolean;
  addUser: (user: User, code: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateUserCode: (userId: string, newCode: string) => void;
  getUserCode: (userId: string) => string | undefined;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [userCodes, setUserCodes] = useState<Record<string, string>>({});

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('app_current_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_users' as never)
      .select('*')
      .order('id');
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    const rows = (data ?? []) as Array<{ id: string; name: string; email: string; role: string; access_code: string }>;
    setUsers(rows.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role as User['role'] })));
    const codes: Record<string, string> = {};
    rows.forEach(r => { codes[r.id] = r.access_code; });
    setUserCodes(codes);
    // Keep currentUser in sync if changed remotely
    setCurrentUser(prev => {
      if (!prev) return prev;
      const found = rows.find(r => r.id === prev.id);
      if (!found) return prev;
      return { id: found.id, name: found.name, email: found.email, role: found.role as User['role'] };
    });
  }, []);

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel('app-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, () => {
        fetchUsers();
        showRealtimeToast('Utilisateurs');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUsers]);

  const login = (username: string, code: string): boolean => {
    const user = users.find(u => u.name.toLowerCase() === username.toLowerCase());
    if (user && userCodes[user.id] === code) {
      setCurrentUser(user);
      registerSession(user.id, user.name, user.role);
      return true;
    }
    return false;
  };

  const logout = () => {
    removeSession();
    setCurrentUser(null);
  };

  const switchUser = (userId: string, code: string): boolean => {
    if (userCodes[userId] === code) {
      const user = users.find(u => u.id === userId);
      if (user) {
        removeSession();
        setCurrentUser(user);
        registerSession(user.id, user.name, user.role);
        return true;
      }
    }
    return false;
  };

  const addUser = async (user: User, code: string) => {
    setUsers(prev => [...prev, user]);
    setUserCodes(prev => ({ ...prev, [user.id]: code }));
    const { error } = await supabase.from('app_users' as never).insert({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      access_code: code,
    } as never);
    if (error) console.error('Error adding user:', error);
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    const { error } = await supabase.from('app_users' as never).update(updateData as never).eq('id', userId);
    if (error) console.error('Error updating user:', error);
  };

  const deleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    const newCodes = { ...userCodes };
    delete newCodes[userId];
    setUserCodes(newCodes);
    const { error } = await supabase.from('app_users' as never).delete().eq('id', userId);
    if (error) console.error('Error deleting user:', error);
  };

  const updateUserCode = async (userId: string, newCode: string) => {
    setUserCodes(prev => ({ ...prev, [userId]: newCode }));
    const { error } = await supabase.from('app_users' as never).update({ access_code: newCode } as never).eq('id', userId);
    if (error) console.error('Error updating user code:', error);
  };

  const getUserCode = (userId: string): string | undefined => {
    return userCodes[userId];
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      isAuthenticated: !!currentUser,
      login,
      logout,
      switchUser,
      addUser,
      updateUser,
      deleteUser,
      updateUserCode,
      getUserCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
