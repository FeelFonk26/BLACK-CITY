import { createHash } from "node:crypto";

type FingerprintInput = {
  mode: string;
  stake: number;
  coinSide?: unknown;
  autoCashout?: unknown;
};

export function createRoundRequestFingerprint(input: FingerprintInput): string {
  const options = input.mode === "COINFLIP"
    ? { coinSide: input.coinSide }
    : input.mode === "CRASH"
      ? {
          autoCashout: typeof input.autoCashout === "number" && Number.isFinite(input.autoCashout)
            ? Math.min(10, Math.max(1.1, input.autoCashout))
            : 2,
        }
      : {};

  return createHash("sha256")
    .update(JSON.stringify({ mode: input.mode, stake: input.stake, ...options }))
    .digest("hex");
}
