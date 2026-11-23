# beanroti apps directory

This workspace tracks the small static catalog served at `app.beanroti.com`. The public catalog had no source
repository, so its current page, icon, and app registry were copied from the live site on 2026-11-24 and placed
here for future edits. `web/public/apps.json` is the app list; the page reads it at `/apps.json`.

To update and publish the directory, edit the public assets and run `npm run deploy:beanroti-apps`. The Worker
is `beanroti-apps` and serves the static assets on the existing custom domain.
