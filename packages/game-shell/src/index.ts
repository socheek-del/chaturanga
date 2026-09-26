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
export {
  BRILLIANT_CEILING,
  BRILLIANT_FLOOR,
  exchangeGain,
  gameAccuracy,
  type GameReview,
  GREAT_CEILING,
  GREAT_GAP,
  GREAT_SECOND_CEILING,
  hangingBefore,
  type Label,
  LABELS,
  MISS_SLACK,
  type MoveReview,
  moveAccuracy,
  type ReviewInput,
  type ReviewRules,
  reviewGame,
  SACRIFICE_MIN,
  SACRIFICE_PIECE,
  sacrificeValue,
  sanOf,
  terminalEval,
  THRESHOLDS,
  winPercent,
} from './review/analysis';
export { type AnalysisStore, createAnalysisStore } from './review/analysisStore';
export {
  type EngineLine,
  MULTI_PV,
  type PositionEval,
  PV_LENGTH,
  REVIEW_LIMITS,
  type SearchLimits,
  UciEngine,
  type UciTransport,
  moduleTransport,
  workerTransport,
} from './review/engine';
export { formatScore, graphPoints, plyAt, squareCenter, whiteShare } from './review/geometry';
export {
  createHistoryStore,
  createRecorder,
  findGame,
  type GameMode,
  HISTORY_LIMIT,
  type HistoryState,
  type HistoryStore,
  MIN_ABANDONED_PLIES,
  type ObservedSession,
  type PlayerTag,
  type RecorderOptions,
  type SavedGame,
} from './review/history';
export type { ReviewKit } from './review/kit';
export { recordSession, seats } from './review/recording';
export { type BookData, type Opening, OpeningBook, positionHash, positionKey } from './review/openings';
export {
  type BotName,
  importPgn,
  type Outcome,
  outcomeOf,
  type PgnOptions,
  playerName,
  savedGameToPgn,
  type Translate,
} from './review/savedGame';
export { type InfoLine, negate, parseBestMove, parseInfo, type Score } from './review/uci';
