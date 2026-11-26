import { OnlineLobby, OnlineRoom, type OnlineColorChoice, type OnlineRoomContext, type OnlineScreenProps } from '@chaturanga/game-shell/ui';
import { createIdentity, storageKey, type TimeControlChoice } from '@chaturanga/game-shell';
import { Board } from '@chaturanga/board-ui';
import { Button } from '@chaturanga/ui';
import { Game, koShogi, squareOf, type Candidate } from '@chaturanga/ko-shogi';
import { ArrowLeft, ArrowRight, RotateCcw, Wifi } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { PRODUCT } from '../../product.config';
import { useBoardIdentity } from '../board';
import { ActionPicker } from '../components/ActionPicker';

const identity = createIdentity(storageKey(PRODUCT, 'identity'));
const ROOM_CODE = /^[A-HJ-NP-Z2-9]{6}$/i;

export function OnlineLobbyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeControl, setTimeControl] = useState<TimeControlChoice>({ kind: 'none' });
  const [color, setColor] = useState<OnlineColorChoice>('random');
  return <section className="online-page">
    <header className="page-heading"><p className="eyebrow"><span className="eyebrow-rule" />{t('online.eyebrow')}</p><h1>{t('modes.online')}</h1><p>{t('online.intro')}</p></header>
    <div className="online-lobby"><OnlineLobby identity={identity} timeControl={timeControl} onTimeControlChange={setTimeControl} color={color} onColorChange={setColor} onEnterRoom={(code) => navigate(`/online/${code}`)} /></div>
    <p className="no-chat-note"><Wifi size={15} aria-hidden="true" />{t('online.noChat')}</p>
  </section>;
}

export function OnlineRoomRoute() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  if (!ROOM_CODE.test(code)) return <Navigate to="/online" replace />;
  const normalized = code.toUpperCase();
  return <OnlineRoom
    key={normalized}
    code={normalized}
    variant={koShogi}
    identity={identity}
    roomUrl={(roomCode) => `${location.origin}/online/${roomCode}`}
    onEnterRoom={(roomCode) => navigate(`/online/${roomCode}`)}
    onLeave={() => navigate('/online')}
    renderGame={(screen, context) => <OnlineGameView screen={screen} context={context} />}
  />;
}

function OnlineGameView({ screen, context }: { screen: OnlineScreenProps<Game>; context: OnlineRoomContext<Game> }) {
  const { t } = useTranslation();
  const board = useBoardIdentity();
  const game = context.session((state) => state.game);
  const version = context.session((state) => state.version);
  const [selected, setSelected] = useState<number | null>(null);
  const [movesForSelected, setMovesForSelected] = useState<readonly Candidate[]>([]);
  const [choices, setChoices] = useState<readonly Candidate[]>([]);
  const targets = useMemo(() => [...new Set(movesForSelected.map((move) => move.to))], [movesForSelected]);
  const records = game.moves();
  const latest = game.lastMove();
  const originName = latest?.uci.match(/^[a-s](?:1[0-9]|[1-9])/u)?.[0];
  const lastMove = latest ? { from: originName ? squareOf(originName) : null, to: latest.to } : null;
  const ended = game.status().kind !== 'ongoing';
  const turnText = ended ? t('game.gameOver') : t('game.turn', { color: t(`colors.${game.turn}`) });

  const play = (candidate: Candidate) => {
    if (!screen.inputEnabled) return;
    context.session.getState().moveFor(game.turn, candidate.uci);
    setSelected(null);
    setMovesForSelected([]);
    setChoices([]);
  };
  const clickSquare = (square: number) => {
    if (!screen.inputEnabled || ended) return;
    if (selected !== null && targets.includes(square)) {
      const matching = movesForSelected.filter((move) => move.to === square);
      if (matching.length === 1) play(matching[0]!);
      else if (matching.length > 1) setChoices(matching);
      return;
    }
    const piece = game.pieceAt(square);
    if (piece?.color === game.turn) {
      setSelected(square);
      setMovesForSelected(game.legalCandidatesFrom(square));
      setChoices([]);
      return;
    }
    setSelected(null);
    setMovesForSelected([]);
    setChoices([]);
  };

  return <section className="game-page online-game-page" data-version={version}>
    <div className="game-heading"><div><p className="eyebrow"><span className="eyebrow-rule" />{t('modes.online')}</p><h1>{t('online.privateRoom')}</h1></div><span className="save-indicator">{t('online.serverValidated')}</span></div>
    <div className="game-layout">
      <div className="game-board-column">
        <div className="player-strip player-strip--top"><span className={`player-mark player-mark--${screen.orientation === 'w' ? 'b' : 'w'}`}>{screen.orientation === 'w' ? 'W' : 'B'}</span><span>{screen.names[screen.orientation === 'w' ? 'b' : 'w']}</span></div>
        <div className="board-scroll"><Board {...board} files={19} ranks={19} pieces={game.pieces()} orientation={screen.orientation} selected={selected} targets={targets} lastMove={lastMove} onSquareClick={clickSquare} className="ko-board" /></div>
        <div className="player-strip player-strip--bottom"><span className={`player-mark player-mark--${screen.orientation}`}>{screen.orientation === 'w' ? 'W' : 'B'}</span><span>{screen.names[screen.orientation]}</span></div>
      </div>
      <aside className="game-ledger">
        <div className={`turn-card${ended ? ' is-ended' : ''}`} aria-live="polite"><span className="turn-card__index">{String(records.length + 1).padStart(2, '0')}</span><p>{turnText}</p></div>
        <div className="online-state">{screen.status}</div>
        <p className="board-instruction">{screen.inputEnabled ? (selected === null ? t('game.selectPiece') : t('game.chooseDestination')) : t('game.waiting')}</p>
        <div className="ledger-actions">
          <Button variant="outline" onClick={() => context.session.getState().flip()}><RotateCcw size={15} aria-hidden="true" />{t('game.orientation')}</Button>
          <Button variant="danger" onClick={() => context.session.getState().resign(screen.resignColor)} disabled={!screen.inputEnabled}>{t('game.resign')}</Button>
        </div>
        {screen.actions}
        {ended && <Button block size="lg" onClick={screen.onRematch}>{t('game.rematch')}<ArrowRight size={15} aria-hidden="true" /></Button>}
        <section className="move-ledger"><div className="move-ledger__heading"><h2>{t('game.moves')}</h2><span>{records.length}</span></div>
          {records.length ? <ol>{records.slice(-12).map((move, index) => <li key={`${move.uci}-${index}`}><span>{String(Math.max(1, records.length - 11) + index).padStart(2, '0')}</span><code>{move.color === 'w' ? 'W' : 'B'} · {move.uci}</code></li>)}</ol> : <p className="muted-note">{t('game.noMoves')}</p>}
        </section>
        <Link className="text-link" to="/online"><ArrowLeft size={14} aria-hidden="true" />{t('nav.leave')}</Link>
      </aside>
    </div>
    {choices.length > 0 && <ActionPicker actions={choices} onChoose={play} onClose={() => setChoices([])} />}
  </section>;
}
