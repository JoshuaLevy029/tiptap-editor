import { describe, expect, it, vi } from "vitest";
import { resolveFeatureFlag } from "../src/features";

describe("resolveFeatureFlag", () => {
  it("disables only an explicit false flag", () => {
    const defaults = vi.fn(() => ({ value: "default" }));

    expect(resolveFeatureFlag(false, defaults)).toBeNull();
    expect(defaults).not.toHaveBeenCalled();
  });

  it.each([undefined, true])("uses defaults for %s", (flag) => {
    expect(resolveFeatureFlag(flag, () => ({ value: "default" }))).toEqual({
      value: "default",
    });
  });

  it("preserves explicit configuration", () => {
    const config = { value: "custom" };

    expect(resolveFeatureFlag(config, () => ({ value: "default" }))).toBe(
      config,
    );
  });
});
