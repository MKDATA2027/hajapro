import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase environment configuration", () => {
  it("requires both the project URL and publishable key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "legacy-anon-placeholder");

    expect(getSupabaseConfig()).toBeNull();
  });

  it("rejects example placeholders and secret keys", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://your-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test-placeholder");
    expect(getSupabaseConfig()).toBeNull();

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_not-for-client");
    expect(getSupabaseConfig()).toBeNull();
  });

  it("returns only the current publishable-key configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test-placeholder");

    expect(getSupabaseConfig()).toEqual({
      url: "https://project.example.test",
      publishableKey: "sb_publishable_test-placeholder",
    });
  });

  it("requires a trusted app origin and normalizes local URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000/");
    expect(getAppUrl()).toBe("http://localhost:3000");

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://untrusted.example.test");
    expect(getAppUrl()).toBeNull();
  });
});