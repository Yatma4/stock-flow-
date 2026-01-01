import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/types';

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

// Default users with access codes
const defaultUsers: User[] = [
  {
    id: '1',
    name: 'Administrateur',
    email: 'admin@stock.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Employé 1',
    email: 'employe1@stock.com',
    role: 'employee',
  },
];

// Store user codes separately (in real app, this would be hashed in a database)
const defaultUserCodes: Record<string, string> = {
  '1': '1234', // Admin code
  '2': '5678', // Employee code
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('app_users');
    return stored ? JSON.parse(stored) : defaultUsers;
  });
  
  const [userCodes, setUserCodes] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem('app_user_codes');
    return stored ? JSON.parse(stored) : defaultUserCodes;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('app_current_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('app_user_codes', JSON.stringify(userCodes));
  }, [userCodes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [currentUser]);

  const login = (username: string, code: string): boolean => {
    // Find user by name (case insensitive)
    const user = users.find(u => u.name.toLowerCase() === username.toLowerCase());
    if (user && userCodes[user.id] === code) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string, code: string): boolean => {
    if (userCodes[userId] === code) {
      const user = users.find(u => u.id === userId);
      if (user) {
        setCurrentUser(user);
        return true;
      }
    }
    return false;
  };

  const addUser = (user: User, code: string) => {
    setUsers(prev => [...prev, user]);
    setUserCodes(prev => ({ ...prev, [user.id]: code }));
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    const newCodes = { ...userCodes };
    delete newCodes[userId];
    setUserCodes(newCodes);
  };

  const updateUserCode = (userId: string, newCode: string) => {
    setUserCodes(prev => ({ ...prev, [userId]: newCode }));
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
