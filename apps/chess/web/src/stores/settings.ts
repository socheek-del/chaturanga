import { resolveLocale, storageKey, type TimeControlChoice } from '@chaturanga/game-shell';
import { DEFAULT_PIECE_SET, isPieceSet, type PieceSetId } from '../features/board/pieceSets';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type Language, PRODUCT } from '../../product.config';

export type { Language };
export type ColorScheme = 'system' | 'light' | 'dark';

export interface Settings {
  language: Language;
  colorScheme: ColorScheme;
  boardTheme: string;
  /** Which piece art to draw: the traditional Staunton set, or this site's own (ch-012). */
  pieceSet: PieceSetId;
  showCoordinates: boolean;
  /** Tint the squares each side attacks on the game screen (plat-015). */
  showAttackMap: boolean;
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
  boardTheme: 'marble',
  pieceSet: DEFAULT_PIECE_SET,
  showCoordinates: true,
  showAttackMap: false,
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
      migrate: (saved) => {
        const settings = { ...DEFAULT_SETTINGS, ...(saved as Partial<Settings>) };
        return {
          ...settings,
          language: resolveLocale(PRODUCT, settings.language),
          pieceSet: isPieceSet(settings.pieceSet) ? settings.pieceSet : DEFAULT_PIECE_SET,
        };
      },
    },
  ),
);
