import { redirect } from "next/navigation";
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const type = params.type === "trading" || params.type === "customer" ? params.type : "tailor";
  redirect(`/settings?experience=${type}`);
}
