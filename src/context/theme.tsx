import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemePref } from '@/api/types';
import { palette, type Colors } from '@/theme/tokens';
import { prefsStorage } from '@/utils/storage';

interface ThemeValue {
  colors: Colors;
  scheme: 'light' | 'dark';
  preference: ThemePref;
  setPreference: (p: ThemePref) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const KEY = 'theme-preference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePref>('system');

  useEffect(() => {
    prefsStorage.get(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
    });
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return {
      colors: palette[scheme],
      scheme,
      preference,
      setPreference: (p) => {
        setPreferenceState(p);
        prefsStorage.set(KEY, p);
      },
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
