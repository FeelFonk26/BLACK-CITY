import { describe, expect, it } from "vitest";
import { assertModeSupported, validateRoundRequest } from "./index.js";

describe("validateRoundRequest", () => {
  const valid = { playerId: "player-1", mode: "DICE" as const, stake: 100, idempotencyKey: "request-abc" };

  it("accepts a valid request", () => {
    expect(() => validateRoundRequest(valid)).not.toThrow();
  });

  it("rejects missing player and idempotency identifiers", () => {
    expect(() => validateRoundRequest({ ...valid, playerId: " " })).toThrow(TypeError);
    expect(() => validateRoundRequest({ ...valid, idempotencyKey: "" })).toThrow(TypeError);
    expect(() => validateRoundRequest({ ...valid, idempotencyKey: "x".repeat(129) })).toThrow(TypeError);
  });

  it("rejects invalid stakes", () => {
    expect(() => validateRoundRequest({ ...valid, stake: 0 })).toThrow(RangeError);
  });
});

describe("assertModeSupported", () => {
  it("rejects modes that are not enabled", () => {
    expect(() => assertModeSupported("DICE", ["DICE"])).not.toThrow();
    expect(() => assertModeSupported("CRASH", ["DICE"])).toThrow(RangeError);
  });
});
