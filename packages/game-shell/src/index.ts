/**
 * Shared app layer for the game sites. Each site declares a ProductConfig (languages, fonts, storage
 * identity) and passes its rules Variant; these modules turn them into language handling, search-engine
 * tags, game results, time controls and game sessions. Game-specific content never lives here.
 */
export { type L10n, type Lesson, type LessonStep, starsFor, type Unit } from './lessons';
export { isLocale, localeFromSearch, type ProductConfig, resolveLocale, storageKey } from './product';
export { createProgressStore, type LessonProgress, type ProgressState, type ProgressStore, REPLAY_XP } from './progress';
export {
  capturedBy,
  FINAL_REASONS,
  type GameResult,
  isUndoableResult,
  materialBalance,
  type ResultReason,
  resultFromStatus,
} from './result';
export { createRoom, fetchRoom } from './online/api';
export { type ConnectionStatus, type GameConnection, openGameConnection } from './online/connection';
export { createIdentity, type Identity, type IdentitySource } from './online/identity';
export { clockFromSnapshot, createOnlineSession, type OnlineSessionState, type OnlineSessionStore } from './online/session';
export { applySeo, localizedUrl, type SeoTarget } from './seo';
export {
  createGameSession,
  type GameSessionState,
  type GameSessionStore,
  inSetupPhase,
  inSetupPhaseOf,
} from './session';
export {
  CUSTOM_LIMITS,
  PRESETS,
  QUICK_MATCH_PRESET_IDS,
  TIME_CATEGORIES,
  type TimeCategory,
  type TimeControl,
  type TimeControlChoice,
  type TimeControlPreset,
  toTimeControl,
} from './timeControls';
