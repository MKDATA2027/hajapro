import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { signInAction, signUpAction } from "@/app/auth/actions";

type Intent = "tailor" | "trading" | "customer";
type AuthFormProps = { mode: "sign-in" | "sign-up"; error?: string; intent: Intent };

const roleName = (intent: Intent) => intent === "trading" ? "Retailer" : intent === "customer" ? "Customer" : "Tailor";
const errorMessages: Record<string, string> = {
  "not-configured": "Sign-in is not configured yet. Please try again later.",
  "invalid-input": "Check your email, selected experience and password. Passwords must be at least 8 characters.",
  authentication: "We could not sign you in with those details.",
  registration: "We could not create the account. If you already registered, try signing in.",
  workspace: "We could not verify the selected workspace. Contact support.",
  "role-mismatch": "This account belongs to a different HajaPro experience. Sign in using its original role.",
};

export function AuthForm({ mode, error, intent }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  return <main className="auth-layout">
    <section className="auth-story" aria-label="About HajaPro">
      <Link href="/" className="wordmark auth-wordmark">HAJA<span>PRO</span></Link>
      <div className="auth-story-copy"><p className="eyebrow">Product by MK Company</p><h1>Good work deserves a <em>better system.</em></h1><p>Bring the details of your business together, so you can focus on the work that moves it forward.</p></div>
      <p className="auth-story-foot">Manage Smarter. Grow Faster.</p>
    </section>
    <section className="auth-main">
      <Link href={`/${intent === "trading" ? "retailer" : intent}`} className="back-link"><ArrowLeft size={16} /> Back to {roleName(intent)}</Link>
      <div className="auth-card">
        <div className="auth-card-icon"><LockKeyhole size={20} /></div>
        <p className="eyebrow">{roleName(intent)} account</p>
        <h2>{isSignUp ? "Create your account" : "Welcome back"}</h2>
        <p className="auth-intro">{isSignUp ? `Create a HajaPro ${roleName(intent)} account. We will email you a six-digit verification code.` : `Sign in to your HajaPro ${roleName(intent)} experience.`}</p>
        {error ? <div className="notice notice-error" role="alert">{errorMessages[error] ?? "Something went wrong. Please try again."}</div> : null}
        <form action={isSignUp ? signUpAction : signInAction} className="auth-fields">
          <input type="hidden" name="intent" value={intent} />
          <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} maxLength={128} required />
          <button className="button button-green auth-submit" type="submit">{isSignUp ? "Create account" : "Sign in"} <ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">{isSignUp ? "Already have an account?" : "New to HajaPro?"} <Link href={isSignUp ? `/sign-in?type=${intent}` : `/sign-up?type=${intent}`}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>
        <p className="auth-legal">Your private account information is protected and only used to provide HajaPro services.</p>
      </div>
    </section>
  </main>;
}