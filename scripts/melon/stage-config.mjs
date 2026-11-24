import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import wrangler from 'wrangler';

const { unstable_readConfig } = wrangler;

const product = process.argv[2];
const directory = `apps/${product}/worker`;
const config = unstable_readConfig({ config: `${directory}/wrangler.jsonc` });

const standalone = {
  name: config.name,
  main: config.main && relative(directory, config.main),
  compatibility_date: config.compatibility_date,
  compatibility_flags: config.compatibility_flags,
  assets: config.assets,
  durable_objects: config.durable_objects,
  migrations: config.migrations,
  d1_databases: config.d1_databases,
  vars: {
    ...config.vars,
    ...(config.durable_objects.bindings.length && { AUTH_SECRET: randomBytes(32).toString('hex') }),
  },
};

writeFileSync(`${directory}/.melon-stage.jsonc`, JSON.stringify(standalone, null, 2), {
  flag: 'wx',
  mode: 0o600,
});
