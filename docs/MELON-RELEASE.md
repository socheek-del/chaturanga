# Release on Melon

The repository’s GitHub workflow verifies and builds. Melon hosts the production services.

## Stage a new product

1. Push the verified revision to main and confirm that its CI run passes.
2. Run `scripts/melon/stage.sh <product> <full-commit-sha> <free-loopback-port>` from the repository. Melon fetches the exact revision from the HTTPS GitHub origin. Save the printed release directory, container name and port.
3. Confirm the stage homepage, assets and health endpoint. For an online game, create a disposable room, connect two seats through WebSocket, play and reconnect. The stage uses a generated guest signing secret and isolated state. Its migration job starts on an unexposed container network and applies each SQL migration as a transaction with a persisted checksum.
4. Restart the staged container, then reopen the room. Test backup and restore by stopping the container, copying its `state` directory, and starting a separate container with that copy. Backups include application data and require the same access controls as the source.

## Promote and verify

Prepare a complete Caddyfile candidate on Melon based on the active Caddyfile. Add the product hostname and its tested loopback origin. Check DNS and TLS provisioning for that hostname. Keep all existing routes in the candidate and keep the previous service available for rollback.

Run `bash scripts/melon/promote-route.sh <candidate-Caddyfile> <hostname> /api/health` on Melon from the staged checkout. The helper validates the candidate, reloads Caddy and checks TLS and health directly against Melon. A failed check reloads the previous Caddyfile. Success saves the candidate in the active bind mount and prints the backup path. To roll back after a later smoke failure, pass the saved Caddyfile as the candidate and verify a known-good route.

After promotion, apply the container restart policy with `docker update --restart unless-stopped <container>`. Test the public hostname, tutorial, bot play and online WebSocket session. Update the directory only when the public smoke passes. Beanroti currently serves static catalog assets through Caddy. Check `/apps.json` over HTTPS after publishing.

For updates to an existing online product, preserve its production secret and state. The staging script deliberately creates separate state and credentials. Plan the state handoff with a stopped writer, a verified backup and schema-compatible rollback before switching an existing production route.
