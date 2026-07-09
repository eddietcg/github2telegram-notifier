# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A GitHub webhook receiver deployed as Vercel Serverless Functions. GitHub sends webhook events to an endpoint under `/api`; the function verifies the signature, formats the event into a message, and forwards it to a Lark (Feishu) group via an incoming-webhook bot.

Despite the repo name, the project originally sent notifications to Telegram — `lib/sendMsg.js` still contains that Telegram implementation, but no endpoint imports it anymore. All four endpoints under `api/` now import `lib/sendLark.js` (also aliased as `sendMsg` in those files). Treat `lib/sendMsg.js` as dead code unless asked to revive/remove it.

## Commands

There are no npm scripts (build/test/lint) defined in `package.json`. Dependencies: `npm install`. This is a plain Vercel Serverless Functions project (routing defined in `vercel.json`), so local dev/preview is via the Vercel CLI (`vercel dev`) and deployment via `vercel` / a Vercel git integration.

## Architecture

- `vercel.json` rewrites every incoming path to `/api/$1`, so each file in `api/` is effectively an independent webhook endpoint reachable at its own URL (e.g. `/core`, `/shell`, `/template`, or `/` for `index.js`).
- `api/index.js`, `api/core.js`, `api/shell.js`, `api/template.js` are near-duplicate handlers. Each does the same four steps — read `req.body`, verify the GitHub signature, build a message via `eventSwitch`, send it via `sendLark` — and differ **only** in the `type` string passed to `sendMsg.sendMsg(Msg, type)`. That `type` selects which Lark webhook URL env var is used, so different GitHub repos point their webhook at a different endpoint file to route notifications into different Lark chats (`index.js` → `LARK_WEBHOOK_URL`, `core.js` → `LARK_WEBHOOK_URL_CORE`, `shell.js` → `LARK_WEBHOOK_URL_SHELL`, `template.js` → `LARK_WEBHOOK_URL_TEMPLATE`). When adding a new destination, copy one of these files rather than adding branching logic to a single handler.
- `lib/verifyWebhook.js` validates the `x-hub-signature-256` header via HMAC-SHA256 against `GH_HOOK_SECRET`. Verification is **skipped entirely** (always returns `true`) unless `PROD=true` — useful for local testing but means signature checks are opt-in per deployment.
- `lib/eventSwitch.js` maps a GitHub event (`gh_event` from `x-github-event`) plus the payload body into a formatted message string. Only a subset of GitHub event types is handled (`create`, `ping`, `star`, `push`, `fork`, `delete`, `repository`); unhandled event types fall through and return `undefined`, and events with `body.created`/`body.deleted` set return `""` — both cases are treated by the callers as "nothing to send" and the request still responds 201 without calling Lark.
- `lib/sendLark.js` builds a Lark "interactive" card (schema 2.0) from the message string and POSTs it to the resolved webhook URL. It parses the message by line position — the header title is built from the message's 4th and 2nd lines — so it is coupled to the exact line layout produced by `eventSwitch.js`'s `msg` template (`Type: ...` / `From: ...` / blank / event-specific line). Changing one requires checking the other.
- `lib/sendMsg.js` (Telegram) is legacy/unused, kept for reference — see note above.

## Environment variables

- `GH_HOOK_SECRET`, `PROD` — GitHub webhook signature verification (see `lib/verifyWebhook.js`).
- `LARK_WEBHOOK_URL`, `LARK_WEBHOOK_URL_CORE`, `LARK_WEBHOOK_URL_SHELL`, `LARK_WEBHOOK_URL_TEMPLATE` — per-endpoint Lark incoming webhook URLs, selected by the `type` argument each `api/*.js` file passes to `sendMsg.sendMsg`.
- `TG_TOKEN`, `TG_CHAT_ID` — only consumed by the unused `lib/sendMsg.js` (Telegram); not read by any currently-wired endpoint.
