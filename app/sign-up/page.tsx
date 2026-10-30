import { redirect } from "next/navigation";

type Experience = "tailor" | "trading" | "customer";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const experience: Experience =
    type === "trading" || type === "customer" ? type : "tailor";

  // Keep the experience chosen on the homepage through the account step.
  redirect(`/settings?experience=${experience}`);
}
