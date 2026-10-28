import { describe, expect, it } from "vitest";
import { assertValidStake, MAX_STAKE, MIN_STAKE } from "@black-city/shared";
import { serializeStoredRound } from "./round-response.js";
import { createRoundRequestFingerprint } from "./round-fingerprint.js";

describe("virtual-credit stake validation", () => {
  it("accepts the minimum and maximum allowed stakes", () => {
    expect(() => assertValidStake(MIN_STAKE)).not.toThrow();
    expect(() => assertValidStake(MAX_STAKE)).not.toThrow();
  });

  it("accepts a valid integer stake", () => {
    expect(() => assertValidStake(250)).not.toThrow();
  });

  it.each([0, -1, 1.5, MAX_STAKE + 1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid stake %s",
    (stake) => {
      expect(() => assertValidStake(stake)).toThrow(RangeError);
    },
  );
});

describe("idempotent round response serialization", () => {
  it("returns the stored outcome and numeric stake/payout on replay", () => {
    expect(serializeStoredRound({
      id: "round-1",
      mode: "DICE",
      stake: "250",
      payout: "475",
      status: "settled",
      outcome: { headline: "Выпало 6 — победа!", detail: "Нужно выбросить 4, 5 или 6.", multiplier: 1.9 },
    })).toEqual({
      id: "round-1",
      mode: "DICE",
      stake: 250,
      payout: 475,
      status: "settled",
      outcome: { headline: "Выпало 6 — победа!", detail: "Нужно выбросить 4, 5 или 6.", multiplier: 1.9 },
    });
  });

  it("keeps old rows without a saved outcome backwards-compatible", () => {
    expect(serializeStoredRound({
      id: "round-old",
      mode: "DICE",
      stake: 100,
      payout: null,
      status: "settled",
      outcome: null,
    })).toEqual({ id: "round-old", mode: "DICE", stake: 100, payout: 0, status: "settled" });
  });
});

describe("round request fingerprints", () => {
  it("is stable for the same normalized round request", () => {
    const input = { mode: "DICE", stake: 250 };
    expect(createRoundRequestFingerprint(input)).toBe(createRoundRequestFingerprint(input));
  });

  it("distinguishes different modes and stakes", () => {
    const base = { mode: "DICE", stake: 250 };
    expect(createRoundRequestFingerprint(base)).not.toBe(createRoundRequestFingerprint({ ...base, stake: 500 }));
    expect(createRoundRequestFingerprint(base)).not.toBe(createRoundRequestFingerprint({ ...base, mode: "LUCKY" }));
  });

  it("includes coin side and normalized crash auto-cashout", () => {
    expect(createRoundRequestFingerprint({ mode: "COINFLIP", stake: 250, coinSide: "Орёл" }))
      .not.toBe(createRoundRequestFingerprint({ mode: "COINFLIP", stake: 250, coinSide: "Решка" }));
    expect(createRoundRequestFingerprint({ mode: "CRASH", stake: 250, autoCashout: 20 }))
      .toBe(createRoundRequestFingerprint({ mode: "CRASH", stake: 250, autoCashout: 10 }));
  });
});
