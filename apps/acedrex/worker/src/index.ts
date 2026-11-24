import { GameRoomBase, MatchmakerBase, registerPlayRoutes, type RoomState } from '@chaturanga/server-kit';
import { acedrex } from '@chaturanga/acedrex';
import { Hono } from 'hono';

interface Env {
  ASSETS: Fetcher;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  DB: D1Database;
  AUTH_SECRET: string;
  RECONNECT_GRACE_MS?: string;
}

export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = acedrex;

  protected override async onFinished(room: RoomState): Promise<void> {
    if (!room.result) return;
    await this.env.DB.prepare('INSERT OR IGNORE INTO games (id, moves, winner, reason) VALUES (?, ?, ?, ?)')
      .bind(`${room.code}-${room.createdAt}`, room.moves.join(' '), room.result.winner, room.result.reason).run();
  }
}

export class Matchmaker extends MatchmakerBase<Env> {}

const app = new Hono<{ Bindings: Env }>();
registerPlayRoutes(app, { service: 'acedrex' });
app.all('/api/*', (context) => context.json({ error: 'not_found' }, 404));

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
