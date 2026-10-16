import { AuthForm } from "@/components/auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <AuthForm mode="sign-in" intent="tailor" error={error} />;
}