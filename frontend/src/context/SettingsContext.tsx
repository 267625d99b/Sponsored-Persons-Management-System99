import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsAPI } from '../services/api';

interface Settings {
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  dateFormat: string;
  renewalReminderDays: number;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  organizationName: string;
  language: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  currency: 'SAR',
  currencySymbol: 'ريال',
  currencyPosition: 'after',
  dateFormat: 'ar-SA',
  renewalReminderDays: 30,
  enableEmailNotifications: false,
  enableSmsNotifications: false,
  organizationName: 'نظام إدارة المكفولين',
  language: 'ar'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const { data } = await settingsAPI.get();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const formatCurrency = (amount: number): string => {
    const formattedNumber = amount.toLocaleString('ar-SA');
    if (settings.currencyPosition === 'before') {
      return `${settings.currencySymbol} ${formattedNumber}`;
    }
    return `${formattedNumber} ${settings.currencySymbol}`;
  };

  const formatDate = (date: string): string => {
    try {
      return new Date(date).toLocaleDateString(settings.dateFormat);
    } catch {
      return new Date(date).toLocaleDateString('ar-SA');
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, formatCurrency, formatDate, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    // Return default values if not in provider
    return {
      settings: defaultSettings,
      loading: false,
      formatCurrency: (amount: number) => `${amount.toLocaleString('ar-SA')} ريال`,
      formatDate: (date: string) => new Date(date).toLocaleDateString('ar-SA'),
      refreshSettings: async () => {}
    };
  }
  return context;
};
