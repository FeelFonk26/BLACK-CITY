import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { randomInt, randomUUID } from "node:crypto";
import { createRoundRequestFingerprint } from "./round-fingerprint.js";
import pg from "pg";
import { serializeStoredRound, type StoredRoundRow } from "./round-response.js";
import { assertValidStake, INITIAL_BALANCE, MAX_STAKE, MIN_STAKE, type GameMode } from "@black-city/shared";

const { Pool } = pg;
const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "127.0.0.1";
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((value) => value.trim()).filter(Boolean);

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!jwtSecret || jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");

const pool = new Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 5000 });
const app = Fastify({ logger: true, bodyLimit: 16 * 1024 });

await app.register(cors, { origin: allowedOrigins, methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"] });
await app.register(jwt, { secret: jwtSecret });
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

type AuthUser = { sub: string };
type PlayBody = { mode?: unknown; stake?: unknown; coinSide?: unknown; autoCashout?: unknown };
type Outcome = { headline: string; detail: string; multiplier: number };

const modes: GameMode[] = ["LUCKY", "COINFLIP", "DICE", "PLINKO", "WHEEL", "CRASH", "MINES", "TOWER", "WHEEL_MINI", "WHEEL_MEGA", "CRAZY_TIME", "SLOTS"];
const isMode = (value: unknown): value is GameMode => typeof value === "string" && modes.includes(value as GameMode);

function rollOutcome(mode: GameMode, body: PlayBody): Outcome {
  const choose = <T,>(values: readonly T[]): T => values[randomInt(values.length)]!;
  switch (mode) {
    case "DICE": {
      const roll = randomInt(1, 7);
      return roll >= 4 ? { headline: `Выпало ${roll} — победа!`, detail: "Нужно выбросить 4, 5 или 6.", multiplier: 1.9 } : { headline: `Выпало ${roll} — мимо`, detail: "В следующий раз может повезти.", multiplier: 0 };
    }
    case "COINFLIP": {
      if (body.coinSide !== "Орёл" && body.coinSide !== "Решка") throw new Error("coinSide must be Орёл or Решка");
      const side = choose(["Орёл", "Решка"] as const);
      return side === body.coinSide ? { headline: `${side}! Ты угадал.`, detail: "Сторона совпала с выбором.", multiplier: 1.9 } : { headline: `${side} — не угадал`, detail: `Ты выбрал: ${body.coinSide}.`, multiplier: 0 };
    }
    case "LUCKY": {
      const number = randomInt(1, 101);
      return number > 50 ? { headline: `Число ${number} — удача!`, detail: "Побеждает число от 51 до 100.", multiplier: 1.9 } : { headline: `Число ${number}`, detail: "Для победы нужно число выше 50.", multiplier: 0 };
    }
    case "PLINKO": {
      const multiplier = choose([0, 0.5, 0.5, 1, 1, 1.5, 2, 3, 5]);
      return { headline: `Множитель ×${multiplier}`, detail: "Шарик остановился в выбранном секторе.", multiplier };
    }
    case "WHEEL":
    case "WHEEL_MINI":
    case "WHEEL_MEGA":
    case "CRAZY_TIME": {
      const sectors = mode === "WHEEL_MINI" ? [0, 0.5, 1, 1.5, 2] : mode === "WHEEL_MEGA" ? [0, 0, 1, 2, 3, 5, 10] : mode === "CRAZY_TIME" ? [0, 1, 2, 2, 5, 10, 20] : [0, 0.5, 1, 2, 3, 5];
      const multiplier = choose(sectors);
      return { headline: multiplier > 0 ? `Колесо: ×${multiplier}` : "Колесо: Банкрот", detail: "Раунд рассчитан сервером.", multiplier };
    }
    case "MINES": {
      const safe = randomInt(100) < 65;
      return safe ? { headline: "Клетка безопасна!", detail: "В демо-версии раунд состоит из одной клетки.", multiplier: 1.45 } : { headline: "Мина!", detail: "Выплата в этом раунде равна нулю.", multiplier: 0 };
    }
    case "TOWER": {
      const floors = randomInt(1, 6);
      return floors >= 3 ? { headline: `Пройдено этажей: ${floors}`, detail: "Раунд завершён автоматически.", multiplier: 1 + floors * 0.35 } : { headline: `Башня остановилась на ${floors} этаже`, detail: "Выплата в этом раунде равна нулю.", multiplier: 0 };
    }
    case "CRASH": {
      const crashAt = Math.max(1, Math.floor((1 / (randomInt(8, 1000) / 1000)) * 10) / 10);
      const requested = typeof body.autoCashout === "number" ? body.autoCashout : 2;
      const target = Number.isFinite(requested) ? Math.min(10, Math.max(1.1, requested)) : 2;
      return crashAt >= target ? { headline: `Краш на ×${crashAt}`, detail: `Автовывод ×${target} успел сработать.`, multiplier: target } : { headline: `Краш на ×${crashAt}`, detail: "Множитель упал до автовывода.", multiplier: 0 };
    }
    case "SLOTS": {
      const symbols = ["🍒", "🔔", "💎", "7️⃣", "🍋"];
      const reels = [choose(symbols), choose(symbols), choose(symbols)];
      const same = reels[0] === reels[1] && reels[1] === reels[2];
      const pair = reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2];
      const multiplier = same ? 5 : pair ? 1.5 : 0;
      return { headline: reels.join(" "), detail: same ? "Три одинаковых символа!" : pair ? "Два символа совпали." : "Комбинация без выплаты.", multiplier };
    }
  }
}

async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  try {
    const user = await request.jwtVerify<AuthUser>();
    return user.sub;
  } catch {
    await reply.code(401).send({ error: "unauthorized", message: "Сессия не найдена или истекла." });
    return null;
  }
}

app.get("/health", async (_request, reply) => {
  try {
    await pool.query("SELECT 1");
    return { status: "ok", service: "black-city-api", version: "0.2.0" };
  } catch {
    return reply.code(503).send({ status: "unavailable", service: "black-city-api" });
  }
});

app.get("/api/v1/games", async () => ({ modes, currency: "virtual-credits", realMoneyEnabled: false, backend: "server-authoritative" }));

app.post("/api/v1/guest", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (_request, reply) => {
  const client = await pool.connect();
  const playerId = randomUUID();
  const externalId = randomUUID();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO players (id, display_name) VALUES ($1, $2)", [playerId, `Гость-${playerId.slice(0, 6)}`]);
    await client.query("INSERT INTO platform_identities (player_id, platform, external_id) VALUES ($1, 'web', $2)", [playerId, externalId]);
    await client.query("INSERT INTO wallets (player_id, balance) VALUES ($1, $2)", [playerId, INITIAL_BALANCE]);
    await client.query("INSERT INTO wallet_ledger (player_id, amount, balance_after, reason, idempotency_key) VALUES ($1, $2, $2, 'initial_grant', $3)", [playerId, INITIAL_BALANCE, `initial:${playerId}`]);
    await client.query("COMMIT");
    const token = await reply.jwtSign({ sub: playerId }, { expiresIn: "30d" });
    return reply.code(201).send({ token, player: { id: playerId, displayName: `Гость-${playerId.slice(0, 6)}`, balance: INITIAL_BALANCE }, currency: "virtual-credits" });
  } catch (error) {
    await client.query("ROLLBACK");
    requestLog(error);
    return reply.code(500).send({ error: "guest_creation_failed" });
  } finally {
    client.release();
  }
});

app.get("/api/v1/me", async (request, reply) => {
  const playerId = await authenticate(request, reply);
  if (!playerId) return;
  const result = await pool.query("SELECT p.id, p.display_name AS \"displayName\", p.avatar_url AS \"avatarUrl\", w.balance FROM players p JOIN wallets w ON w.player_id = p.id WHERE p.id = $1", [playerId]);
  if (!result.rowCount) return reply.code(404).send({ error: "player_not_found" });
  const row = result.rows[0] as { id: string; displayName: string; avatarUrl: string | null; balance: string };
  return { player: { ...row, balance: Number(row.balance) } };
});

app.post("/api/v1/rounds", async (request, reply) => {
  const playerId = await authenticate(request, reply);
  if (!playerId) return;
  const body = (request.body ?? {}) as PlayBody;
  if (!isMode(body.mode)) return reply.code(400).send({ error: "invalid_mode" });
  if (typeof body.stake !== "number") return reply.code(400).send({ error: "invalid_stake" });
  try { assertValidStake(body.stake); } catch { return reply.code(400).send({ error: "invalid_stake", min: MIN_STAKE, max: MAX_STAKE }); }
  const idempotencyKey = request.headers["idempotency-key"];
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    return reply.code(400).send({ error: "idempotency_key_required" });
  }

  let outcome: Outcome;
  try { outcome = rollOutcome(body.mode, body); } catch (error) {
    return reply.code(400).send({ error: "invalid_game_options", message: error instanceof Error ? error.message : "Invalid game options" });
  }
  const requestFingerprint = createRoundRequestFingerprint({ mode: body.mode, stake: body.stake, coinSide: body.coinSide, autoCashout: body.autoCashout });
  const payout = Math.floor(body.stake * outcome.multiplier);
  if (!Number.isSafeInteger(payout) || payout < 0) return reply.code(400).send({ error: "invalid_payout" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const walletResult = await client.query("SELECT balance FROM wallets WHERE player_id = $1 FOR UPDATE", [playerId]);
    if (!walletResult.rowCount) { await client.query("ROLLBACK"); return reply.code(404).send({ error: "player_not_found" }); }
    const balance = Number(walletResult.rows[0]?.balance);
    const existing = await client.query("SELECT id, mode, stake, payout, status, outcome, request_fingerprint FROM game_rounds WHERE player_id = $1 AND idempotency_key = $2", [playerId, idempotencyKey]);
    if (existing.rowCount) {
      await client.query("COMMIT");
      const row = existing.rows[0] as StoredRoundRow & { request_fingerprint: string | null };
      if (row.request_fingerprint && row.request_fingerprint.trim() !== requestFingerprint) {
        return reply.code(409).send({ error: "idempotency_key_conflict", message: "Этот ключ уже использован для другого запроса." });
      }
      return { round: serializeStoredRound(row), balance, idempotentReplay: true };
    }
    if (balance < body.stake) { await client.query("ROLLBACK"); return reply.code(409).send({ error: "insufficient_balance", balance }); }
    const balanceAfterStake = balance - body.stake;
    const balanceAfter = balanceAfterStake + payout;
    const roundId = randomUUID();
    await client.query("INSERT INTO game_rounds (id, player_id, mode, stake, payout, status, idempotency_key, settled_at, outcome, request_fingerprint) VALUES ($1, $2, $3, $4, $5, 'settled', $6, now(), $7::jsonb, $8)", [roundId, playerId, body.mode, body.stake, payout, idempotencyKey, JSON.stringify(outcome), requestFingerprint]);
    await client.query("INSERT INTO wallet_ledger (player_id, round_id, amount, balance_after, reason, idempotency_key) VALUES ($1, $2, $3, $4, 'stake', $5)", [playerId, roundId, -body.stake, balanceAfterStake, `${roundId}:stake`]);
    if (payout > 0) await client.query("INSERT INTO wallet_ledger (player_id, round_id, amount, balance_after, reason, idempotency_key) VALUES ($1, $2, $3, $4, 'payout', $5)", [playerId, roundId, payout, balanceAfter, `${roundId}:payout`]);
    await client.query("UPDATE wallets SET balance = $2, updated_at = now() WHERE player_id = $1", [playerId, balanceAfter]);
    await client.query("COMMIT");
    return { round: { id: roundId, mode: body.mode, stake: body.stake, payout, status: "settled", outcome }, balance: balanceAfter, idempotentReplay: false };
  } catch (error) {
    await client.query("ROLLBACK");
    requestLog(error);
    return reply.code(500).send({ error: "round_failed" });
  } finally {
    client.release();
  }
});

function requestLog(error: unknown): void {
  app.log.error({ err: error }, "API request failed");
}

app.addHook("onClose", async () => { await pool.end(); });

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
