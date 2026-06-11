import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Admin } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authAPI.getMe();
      // data يحتوي على { admin: {...} }
      setAdmin(data.admin || data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async () => {
    // تم التعامل مع المنطق الفعلي في صفحة Login.tsx
    // هنا نقوم فقط بتحديث حالة الأدمن بعد النجاح
    await checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAdmin(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
