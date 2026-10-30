import Link from "next/link";
import { verifyEmailOtpAction } from "@/app/auth/actions";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; type?: string; error?: string }> }) {
  const params = await searchParams;
  const email = params.email ?? "";
  const intent = params.type === "trading" || params.type === "customer" ? params.type : "tailor";
  const error = params.error === "invalid-code" ? "That code is invalid or expired. Check the email and try again." : params.error ? "Enter the email address and six-digit code." : "";
  return <main className="verify-shell">
    <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
    <section className="verify-card">
      <p className="eyebrow">Email verification</p>
      <h1>Enter your code.</h1>
      <p>We sent a six-digit verification code to <strong>{email || "your email address"}</strong>. Enter it below to activate your {intent === "trading" ? "Retailer" : intent === "customer" ? "Customer" : "Tailor"} account.</p>
      {error ? <p className="notice notice-error" role="alert">{error}</p> : null}
      <form action={verifyEmailOtpAction} className="auth-fields">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="intent" value={intent} />
        <label htmlFor="token">Six-digit code</label>
        <input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required />
        <button className="button button-green auth-submit" type="submit">Verify email</button>
      </form>
      <p className="auth-switch"><Link href={`/sign-up?type=${intent}`}>Back to registration</Link></p>
    </section>
  </main>;
}