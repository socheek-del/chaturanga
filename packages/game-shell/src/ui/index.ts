/**
 * The shared game screen and its parts. Every game-specific thing — piece art, board colours, words,
 * sounds, counting rules and material values — is a prop, so a product supplies its own identity.
 *
 * These components read their words through react-i18next. The keys they need are listed in
 * `packages/game-shell/KEYS.md`; the text behind them belongs to each product's locale files.
 */
export { AiCancelled, type AiClient, type AiResponse, createAiClient } from './aiClient';
export { formatClock, type GameSound, soundForMove } from './format';
export { type FocusKind, useFocusMode, useFocusModeProvider } from './focusMode';
export { FEEDBACK_DEV_HUB_KEY, FEEDBACK_STRING_KEYS, FeedbackLink, type FeedbackLinkProps, feedbackHub } from './Feedback';
export { GameControls, type GameControlsProps } from './GameControls';
export { GameOverModal, type GameOverModalProps, resultTitleKey } from './GameOverModal';
export { GameScreen, type GameScreenProps, undoAllowed } from './GameScreen';
export { LessonPlayer, type LessonMood, type LessonPlayerProps, type LessonSound } from './LessonPlayer';
export { MoreGames, type MoreGamesProps, siblingHref, type SiblingSite } from './MoreGames';
export { MoveList, type MoveListProps } from './MoveList';
export { type OnlineColorChoice, OnlineLobby, type OnlineLobbyProps } from './OnlineLobby';
export { OnlineRoom, type OnlineRoomContext, type OnlineRoomProps, type OnlineScreenProps } from './OnlineRoom';
export { PlayerBar, type PlayerBarProps } from './PlayerBar';
export { QuickMatch, type QuickMatchProps } from './QuickMatch';
export { TimeControlPicker, type TimeControlPickerProps } from './TimeControlPicker';
export { useIdentity } from './useIdentity';
export { useNow } from './useNow';
export { EvalBar, EvalGraph, LABEL_MARK, LabelBadge, BoardMarks } from './review/components';
export { ExportDialog, GamesScreen, type GamesScreenProps } from './review/GamesScreen';
export { AppLink, type BoardLook, moveNumber, type ReviewLinks, ReviewScreen, type ReviewScreenProps } from './review/ReviewScreen';
export { type AnalysisState, positionsOf, useGameAnalysis } from './review/useGameAnalysis';
export { onlineGameId, useRecordOnlineGame } from './review/useRecordOnlineGame';
