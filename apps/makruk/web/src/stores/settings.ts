import { resolveLocale, storageKey } from '@chaturanga/game-shell';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type Language, PRODUCT } from '../../product.config';
import type { TimeControlChoice } from '../features/game/timeControls';

export type { Language };
export type ColorScheme = 'system' | 'light' | 'dark';
/** Pass-and-play board view: fixed, rotate to the side to move, or tabletop (opponent's bar upside down). */
export type PassAndPlayView = 'fixed' | 'rotate' | 'tabletop';

export interface Settings {
  language: Language;
  colorScheme: ColorScheme;
  boardTheme: string;
  pieceSet: string;
  sound: boolean;
  haptics: boolean;
  showCoordinates: boolean;
  /** Tint the squares each side attacks on the game screen (plat-015). */
  showAttackMap: boolean;
  passAndPlayView: PassAndPlayView;
  timeControl: TimeControlChoice;
  computerLevel: number;
  computerSide: 'w' | 'b' | 'random';
  onlineTimeControl: TimeControlChoice;
  onlineColor: 'w' | 'b' | 'random';
}

export interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
}

export const DEFAULT_SETTINGS: Settings = {
  language: PRODUCT.defaultLocale,
  colorScheme: 'system',
  boardTheme: 'teak',
  pieceSet: 'classic',
  sound: true,
  haptics: true,
  showCoordinates: true,
  showAttackMap: false,
  passAndPlayView: 'fixed',
  timeControl: { kind: 'none' },
  computerLevel: 2,
  computerSide: 'w',
  onlineTimeControl: { kind: 'preset', id: '5+0' },
  onlineColor: 'random',
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
      // Settings live only in this browser (no account needed). Keep saved choices such as the language
      // when the stored format changes instead of silently falling back to defaults.
      migrate: (saved) => {
        const settings = { ...DEFAULT_SETTINGS, ...(saved as Partial<Settings>) };
        return { ...settings, language: resolveLocale(PRODUCT, settings.language) };
      },
    },
  ),
);
