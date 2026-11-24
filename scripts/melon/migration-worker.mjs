export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response(null, { status: 405 });

    const applied = [];
    try {
      for (const { binding, files } of JSON.parse(env.MELON_MIGRATIONS)) {
        const database = env[binding];
        await database.prepare(
          'CREATE TABLE IF NOT EXISTS melon_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)',
        ).run();
        const { results } = await database.prepare('SELECT name, checksum FROM melon_migrations').all();
        const previous = new Map(results.map(({ name, checksum }) => [name, checksum]));

        for (const { file, checksum, statements } of files) {
          if (previous.has(file)) {
            if (previous.get(file) !== checksum) throw new Error(`Applied migration changed: ${binding}/${file}`);
            continue;
          }
          await database.batch([
            ...statements.map((sql) => database.prepare(sql)),
            database.prepare('INSERT INTO melon_migrations (name, checksum) VALUES (?, ?)').bind(file, checksum),
          ]);
          applied.push(`${binding}/${file}`);
        }
      }
      return Response.json({ applied });
    } catch (error) {
      return new Response(String(error), { status: 500 });
    }
  },
};
