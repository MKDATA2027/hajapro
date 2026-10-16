type SupabaseErrorShape = {
  code?: string | null;
  message?: string | null;
};

export function classifyWorkspaceSaveError(code?: string | null) {
  if (code === "PGRST202" || code === "PGRST205") return "database-not-ready";
  if (code === "42501") return "permission-denied";
  return "save-failed";
}

export function safeSupabaseDiagnostic(
  error: SupabaseErrorShape,
  sensitiveValues: string[] = [],
) {
  let message = error.message?.replace(/\s+/g, " ").trim() || "Supabase request failed";

  for (const value of sensitiveValues) {
    if (value) message = message.split(value).join("[redacted]");
  }

  message = message
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|secret)\b\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, 240);

  return {
    code: error.code?.slice(0, 32) || "UNKNOWN",
    message,
  };
}