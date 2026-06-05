import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../lib/i18n';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('atsa_language') as Language;
    return (saved === 'en' || saved === 'fr' || saved === 'ar') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('atsa_language', lang);
  };

  useEffect(() => {
    const currentDir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = currentDir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) {
      return key;
    }
    return entry[language] || entry['en'] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
