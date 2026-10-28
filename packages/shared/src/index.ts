export type GameMode =
  | "LUCKY" | "COINFLIP" | "DICE" | "PLINKO" | "WHEEL" | "CRASH"
  | "MINES" | "TOWER" | "WHEEL_MINI" | "WHEEL_MEGA" | "CRAZY_TIME" | "SLOTS";

export type Platform = "web" | "vk";

export interface PublicPlayer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  balance: number;
}

export interface GameRoundSummary {
  id: string;
  mode: GameMode;
  stake: number;
  payout: number;
  status: "pending" | "settled" | "cancelled";
  createdAt: string;
}

export const MIN_STAKE = 1;
export const MAX_STAKE = 1_000_000;
export const INITIAL_BALANCE = 10_000;

/** Balances and stakes are integer virtual credits, never real money. */
export function assertValidStake(stake: number): void {
  if (!Number.isSafeInteger(stake) || stake < MIN_STAKE || stake > MAX_STAKE) {
    throw new RangeError(`Stake must be an integer from ${MIN_STAKE} to ${MAX_STAKE} virtual credits.`);
  }
}
