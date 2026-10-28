# BLACK CITY

Standalone cross-platform virtual-currency gaming platform for web and VK Mini Apps.

## Principles
- One account, virtual balance and progression across web and VK.
- Virtual currency only; no cash-out or real-money exchange.
- Server-authoritative outcomes, atomic balance changes, an auditable ledger and idempotent operations.
- Fully separate from the existing `VK_GAME_FIX` bot and its live data.

## Planned modes
LUCKY, COINFLIP, DICE, PLINKO, WHEEL, CRASH, MINES, TOWER, WHEEL MINI, WHEEL MEGA, CRAZY TIME, SLOTS.

## Architecture
- `apps/api`: Node.js + TypeScript API.
- `apps/web`: React + TypeScript client.
- `apps/vk-mini-app`: VK Mini App client.
- `packages/game-engine`: testable server-side game rules.
- `packages/shared`: shared domain types and validation.
- PostgreSQL for accounts, rounds and virtual-currency ledger.

Never point this project at `/opt/black-city/live-data` or modify the existing bot deployment.