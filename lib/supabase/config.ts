export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey || !publishableKey.startsWith("sb_publishable_")) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === "your-project.supabase.co") return null;
    const isLocalHttp = parsedUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname);
    if (parsedUrl.protocol !== "https:" && !isLocalHttp) return null;
  } catch {
    return null;
  }

  return { url, publishableKey };
}

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl) return null;

  try {
    const parsedUrl = new URL(configuredUrl);
    const isLocalHttp = parsedUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname);
    if (parsedUrl.protocol !== "https:" && !isLocalHttp) return null;
    return parsedUrl.origin;
  } catch {
    return null;
  }
}
