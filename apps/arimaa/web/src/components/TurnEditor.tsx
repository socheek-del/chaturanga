import { Button, Card } from '@chaturanga/ui';
import { Game } from '@chaturanga/arimaa';
import { squareName, type Square } from '@chaturanga/rules-core';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArimaaBoard } from '../board';

function firstStep(action: string): { from: Square; to: Square } | null {
  const [from = '', to = ''] = action.match(/[a-h][1-8]/g) ?? [];
  if (!from || !to) return null;
  return { from: (Number(from[1]) - 1) * 8 + from.charCodeAt(0) - 97, to: (Number(to[1]) - 1) * 8 + to.charCodeAt(0) - 97 };
}

export function TurnEditor({ game, disabled, onCommit }: { game: Game; disabled: boolean; onCommit: (uci: string) => void }) {
  const { t } = useTranslation();
  const [actions, setActions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const draft = useMemo(() => game.turnDraft(actions), [actions, game]);
  const preview = useMemo(() => new Game(draft.previewFen), [draft.previewFen]);
  const destinations = selected === null ? [] : draft.nextActions.flatMap((action) => {
    const step = firstStep(action);
    return step?.from === selected ? [step.to] : [];
  });

  const addAction = (action: string) => {
    setActions((current) => [...current, action]);
    setSelected(null);
    setChoices([]);
  };

  const clickSquare = (square: Square) => {
    if (disabled) return;
    setChoices([]);
    if (selected === null) {
      if (draft.nextActions.some((action) => firstStep(action)?.from === square)) setSelected(square);
      return;
    }
    if (square === selected) {
      setSelected(null);
      return;
    }
    const matching = draft.nextActions.filter((action) => {
      const step = firstStep(action);
      return step?.from === selected && step.to === square;
    });
    if (matching.length === 1) addAction(matching[0]!);
    else if (matching.length > 1) setChoices(matching);
    else if (draft.nextActions.some((action) => firstStep(action)?.from === square)) setSelected(square);
    else setSelected(null);
  };

  const actionLabel = (action: string) => {
    const step = firstStep(action);
    if (!step) return action;
    const piece = preview.pieceAt(step.from);
    const to = squareName(step.to);
    if (action.length > 4) {
      const key = piece?.color === game.turn ? 'game.pullAction' : 'game.pushAction';
      return t(key, { piece: piece ? t(`pieces.${piece.type}`) : '', to });
    }
    return t('game.stepAction', { piece: piece ? t(`pieces.${piece.type}`) : '', to });
  };

  const finish = () => {
    if (!draft.canEnd || !actions.length || disabled) return;
    onCommit(actions.join(''));
    setActions([]);
    setSelected(null);
    setChoices([]);
  };

  return <section className="turn-editor" aria-label={t('game.draft')}>
    <ArimaaBoard game={preview} orientation={game.turn} selected={selected} destinations={destinations} draftActions={actions} disabled={disabled} onSquare={clickSquare} />
    <Card className="action-rail-card">
      <div className="rail-heading"><div><p className="field-label">{t('game.draft')}</p><h2>{t('game.stepCount', { count: draft.stepsUsed })}</h2></div><div className="step-rail" aria-hidden="true">{[1, 2, 3, 4].map((step) => <span key={step} className={draft.stepsUsed >= step ? 'is-filled' : ''}>{step}</span>)}</div></div>
      {actions.length > 0 && <ol className="draft-action-list">{actions.map((action, index) => <li key={`${action}-${index}`}><span>{index + 1}</span><strong>{actionLabel(action)}</strong><small>{action.match(/[a-h][1-8]/g)?.length ?? 0} {t('game.stepUnit')}</small></li>)}</ol>}
      {choices.length > 0 && <div className="action-choice-list" role="group" aria-label={t('game.chooseAction')}><p>{t('game.chooseAction')}</p>{choices.map((action) => <button type="button" key={action} onClick={() => addAction(action)}>{actionLabel(action)}</button>)}</div>}
      {!draft.canEnd && draft.stepsUsed > 0 && <p className="repeat-note" role="status">{t('game.repeatBlocked')}</p>}
      <div className="draft-controls">
        <Button size="sm" variant="secondary" disabled={!actions.length || disabled} onClick={() => { setActions((current) => current.slice(0, -1)); setSelected(null); }}>{t('game.undoAction')}</Button>
        <Button size="sm" variant="secondary" disabled={!actions.length || disabled} onClick={() => { setActions([]); setSelected(null); setChoices([]); }}>{t('game.clearDraft')}</Button>
        <Button size="lg" disabled={!draft.canEnd || disabled} onClick={finish}>{t('game.finish')}<ArrowRight className="h-4 w-4" aria-hidden /></Button>
      </div>
    </Card>
  </section>;
}
