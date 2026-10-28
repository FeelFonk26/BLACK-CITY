# Security and economy invariants

1. Only the server may generate and settle game outcomes.
2. Validate VK launch signatures server-side; never trust client-supplied user IDs.
3. Store balances as integer virtual credits and mutate them only in database transactions.
4. Every balance mutation must have a ledger entry and idempotency key.
5. Enforce stake limits, sufficient balance and round ownership server-side.
6. Never expose database credentials, session secrets or RNG internals in API responses.
7. Do not add deposits, cash-out, real-money exchange or real-money wagering.
8. Keep this repository and deployment independent of `FeelFonk26/VK_GAME_FIX` and `/opt/black-city/live-data`.
