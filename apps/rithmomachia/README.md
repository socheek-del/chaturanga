# Rithmomachia

Rithmomachia is an independent English PWA for learning and playing the common medieval/Renaissance rules
family selected in [`docs/PLAN.md`](docs/PLAN.md). The Number Cabinet interface pairs an 8×16 board with
numbered pieces and arithmetic explanations.

## Play

- Learn the selected rules through 13 interactive lessons across three units.
- Play pass-and-play or one of six bounded bots as either color.
- Save and resume games locally; the PWA's lessons, local play and bots work offline after installation.
- Play a friend in a private room or quick match. The dedicated Worker validates every move. There is no chat.

## Run locally

From the repository root, use the Node version in `.nvmrc` and run:

```sh
npm run dev:rithmomachia
```

The web app uses port `5206`; the Worker uses `8816`. To build both parts, run
`npm run build:rithmomachia`. The PWA address is configured only in
[`web/site.config.ts`](web/site.config.ts); its Worker and isolated persistence live in [`worker`](worker).

## Rules and status

The rules engine is [`@chaturanga/rithmomachia`](../../packages/rithmomachia/RULES.md). See
[`docs/PLAN.md`](docs/PLAN.md) for the rules and rights selection, verification evidence, and release gates.
The Number Cabinet design and the product name remain pending owner review. Until name, DNS/TLS and
HTTPS/WSS checks pass, this product stays on private Melon staging and is not added to the public directory.
