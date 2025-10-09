import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'worker' | 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Import real data from data-seed package
      const { workers, clients } = await import('@cyntientops/data-seed');
      
      // Find user in real data
      const worker = workers.find((w: any) => w.email === email);
      const client = clients.find((c: any) => c.contact_email === email);
      
      let foundUser: User | null = null;
      
      if (worker && password === 'password') {
        foundUser = {
          id: worker.id,
          name: worker.name,
          email: worker.email,
          role: 'worker' as UserRole,
          avatar: worker.avatar
        };
      } else if (client && password === 'password') {
        foundUser = {
          id: client.id,
          name: client.name,
          email: client.contact_email,
          role: 'client' as UserRole,
          avatar: '🏢'
        };
      }
      
      // Admin fallback for demo
      if (email === 'admin@cyntientops.com' && password === 'password') {
        foundUser = {
          id: 'admin-1',
          name: 'System Administrator',
          email: 'admin@cyntientops.com',
          role: 'admin' as UserRole,
          avatar: '⚙️'
        };
      }
      
      if (foundUser) {
        setUser(foundUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
