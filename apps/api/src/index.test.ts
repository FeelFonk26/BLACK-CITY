import { describe, expect, it } from "vitest";
import { assertValidStake, MAX_STAKE, MIN_STAKE } from "@black-city/shared";

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
