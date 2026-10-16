import { describe, expect, it } from "vitest";
import { classifyWorkspaceSaveError, safeSupabaseDiagnostic } from "@/lib/supabase/diagnostics";

describe("workspace save diagnostics", () => {
  it("distinguishes missing database objects and permission failures", () => {
    expect(classifyWorkspaceSaveError("PGRST202")).toBe("database-not-ready");
    expect(classifyWorkspaceSaveError("PGRST205")).toBe("database-not-ready");
    expect(classifyWorkspaceSaveError("42501")).toBe("permission-denied");
    expect(classifyWorkspaceSaveError("23503")).toBe("save-failed");
  });

  it("redacts business names and credential-like text from server diagnostics", () => {
    expect(
      safeSupabaseDiagnostic(
        {
          code: "PGRST202",
          message: "Failed for Amina's Atelier; access_token=example Bearer token-value",
        },
        ["Amina's Atelier"],
      ),
    ).toEqual({
      code: "PGRST202",
      message: "Failed for [redacted]; access_token=[redacted] Bearer [redacted]",
    });
  });
});