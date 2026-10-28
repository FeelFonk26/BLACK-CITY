import { describe, expect, it } from "vitest";
import { assertValidStake } from "./index.js";

describe("assertValidStake", () => {
  it("accepts minimum and maximum stakes", () => {
    expect(() => assertValidStake(1)).not.toThrow();
    expect(() => assertValidStake(1_000_000)).not.toThrow();
  });

  it("rejects invalid stakes", () => {
    for (const stake of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 1_000_001, Number.NaN]) {
      expect(() => assertValidStake(stake)).toThrow(RangeError);
    }
  });
});
