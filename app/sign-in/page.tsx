import { AuthForm } from "@/components/auth-form";
type Intent = "tailor" | "trading" | "customer";
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; type?: string }> }) {
  const params = await searchParams;
  const intent: Intent = params.type === "trading" || params.type === "customer" ? params.type : "tailor";
  return <AuthForm mode="sign-in" intent={intent} error={params.error} />;
}