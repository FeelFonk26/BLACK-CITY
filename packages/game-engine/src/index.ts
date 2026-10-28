import { assertValidStake, type GameMode } from "@black-city/shared";

export interface RoundRequest {
  playerId: string;
  mode: GameMode;
  stake: number;
  idempotencyKey: string;
}

/** Validate untrusted round input before any balance or database operation. */
export function validateRoundRequest(input: RoundRequest): void {
  if (!input.playerId.trim()) throw new TypeError("playerId is required");
  if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 128) {
    throw new TypeError("A valid idempotency key is required");
  }
  assertValidStake(input.stake);
}

/**
 * Secure outcomes are intentionally not implemented here yet.
 * Each game must define its server-side rules, auditable RNG approach,
 * and settlement invariants before being enabled in production.
 */
export function assertModeSupported(mode: GameMode, enabledModes: readonly GameMode[]): void {
  if (!enabledModes.includes(mode)) throw new RangeError("This game mode is not enabled");
}
