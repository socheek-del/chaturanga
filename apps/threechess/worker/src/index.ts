interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      try {
        await env.DB.prepare('SELECT 1').first();
        return Response.json({ ok: true, game: 'threechess' });
      } catch {
        return Response.json({ ok: false }, { status: 503 });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
