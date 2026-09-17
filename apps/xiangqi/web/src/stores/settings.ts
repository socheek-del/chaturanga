import { resolveLocale, storageKey, type TimeControlChoice } from '@chaturanga/game-shell';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type Language, PRODUCT } from '../../product.config';

export type { Language };
export type ColorScheme = 'system' | 'light' | 'dark';

export interface Settings {
  language: Language;
  colorScheme: ColorScheme;
  boardTheme: string;
  showCoordinates: boolean;
  timeControl: TimeControlChoice;
  computerLevel: number;
  computerSide: 'w' | 'b' | 'random';
}

export interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
}

export const DEFAULT_SETTINGS: Settings = {
  language: PRODUCT.defaultLocale,
  colorScheme: 'system',
  boardTheme: 'maple',
  showCoordinates: false,
  timeControl: { kind: 'none' },
  computerLevel: 2,
  computerSide: 'w',
};

export const SETTINGS_STORAGE_KEY = storageKey(PRODUCT, 'settings');

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ update: _update, ...settings }) => settings,
      migrate: (saved) => {
        const settings = { ...DEFAULT_SETTINGS, ...(saved as Partial<Settings>) };
        return { ...settings, language: resolveLocale(PRODUCT, settings.language) };
      },
    },
  ),
);
