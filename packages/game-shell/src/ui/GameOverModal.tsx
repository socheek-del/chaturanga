import { Button, Modal } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';
import type { GameResult } from '../result';

export interface GameOverModalProps {
  result: GameResult;
  open: boolean;
  onClose: () => void;
  onRematch: () => void;
  onNewGame: () => void;
  /** A product that reviews games offers it here, with its own words for the button. */
  review?: { label: string; onReview: () => void };
}

export function resultTitleKey(result: GameResult): string {
  if (result.winner === 'w') return 'play.result.whiteWins';
  if (result.winner === 'b') return 'play.result.blackWins';
  return 'play.result.draw';
}

export function GameOverModal({ result, open, onClose, onRematch, onNewGame, review }: GameOverModalProps) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t(resultTitleKey(result))}>
      <p data-testid="result-reason" className="mb-6 text-lg text-muted">
        {t(`play.reason.${result.reason}`)}
      </p>
      <div className="flex flex-col gap-3">
        {review && (
          <Button block size="lg" variant="secondary" data-testid="game-review" onClick={review.onReview}>
            {review.label}
          </Button>
        )}
        <Button block size="lg" onClick={onRematch}>
          {t('play.rematch')}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            {t('play.review')}
          </Button>
          <Button variant="outline" onClick={onNewGame}>
            {t('play.newGame')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
