CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(40) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  platform VARCHAR(16) NOT NULL CHECK (platform IN ('web', 'vk')),
  external_id VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id),
  UNIQUE (player_id, platform)
);

CREATE TABLE wallets (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 10000 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id),
  mode VARCHAR(24) NOT NULL CHECK (mode IN (
    'LUCKY', 'COINFLIP', 'DICE', 'PLINKO', 'WHEEL', 'CRASH',
    'MINES', 'TOWER', 'WHEEL_MINI', 'WHEEL_MEGA', 'CRAZY_TIME', 'SLOTS'
  )),
  stake BIGINT NOT NULL CHECK (stake > 0 AND stake <= 1000000),
  payout BIGINT CHECK (payout IS NULL OR payout >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'cancelled')),
  idempotency_key VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  UNIQUE (player_id, idempotency_key)
);

CREATE TABLE wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id),
  round_id UUID REFERENCES game_rounds(id),
  amount BIGINT NOT NULL CHECK (amount <> 0),
  balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
  reason VARCHAR(32) NOT NULL CHECK (reason IN ('initial_grant', 'stake', 'payout', 'adjustment')),
  idempotency_key VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, idempotency_key)
);

CREATE INDEX game_rounds_player_created_idx ON game_rounds (player_id, created_at DESC);
CREATE INDEX wallet_ledger_player_created_idx ON wallet_ledger (player_id, created_at DESC);

-- Production wallet mutations must lock the wallet row and write the ledger
-- entry in the same transaction. Never update balances from the client.
