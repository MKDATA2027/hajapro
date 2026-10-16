import { AuthForm } from "@/components/auth-form";

type Intent = "tailor" | "trading" | "customer";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; type?: string }>;
}) {
  const params = await searchParams;
  const intent: Intent = params.type === "trading" || params.type === "customer"
    ? params.type
    : "tailor";

  return <AuthForm mode="sign-up" intent={intent} error={params.error} sent={params.sent === "1"} />;
}