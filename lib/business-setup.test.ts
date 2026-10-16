import { describe, expect, it } from "vitest";
import { businessSetupSchema } from "@/lib/business-setup";

describe("business setup validation", () => {
  it("trims and accepts a named tailoring or trading business", () => {
    expect(
      businessSetupSchema.parse({ name: "  Needle & Thread  ", type: "tailor" }),
    ).toEqual({ name: "Needle & Thread", type: "tailor" });
  });

  it("rejects invalid business types and unusable names", () => {
    expect(businessSetupSchema.safeParse({ name: "X", type: "customer" }).success).toBe(false);
    expect(businessSetupSchema.safeParse({ name: "   ", type: "trading" }).success).toBe(false);
  });
});