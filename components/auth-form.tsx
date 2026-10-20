import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { signInAction, signUpAction } from "@/app/auth/actions";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  error?: string;
  sent?: boolean;
  intent: "tailor" | "trading" | "customer";
};

const errorMessages: Record<string, string> = {
  "not-configured": "Sign-in is not configured yet. Add the Supabase values from .env.example.",
  "invalid-input": "Check your email and password, then try again. Passwords must be at least 8 characters.",
  authentication: "We could not sign you in with those details.",
  registration: "We could not create the account. If you already registered, try signing in.",
  verification: "That verification link is invalid or expired. Request a new one by signing up again.",
};

export function AuthForm({ mode, error, sent, intent }: AuthFormProps) {
  const isSignUp = mode === "sign-up";

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="About HajaPro">
        <Link href="/" className="auth-logo-link" aria-label="HAJAPRO home"><Image className="auth-logo-image" src="/branding/hajapro-master-logo.jpg" alt="HAJAPRO — Product of MK Company" width={1536} height={1499} /></Link>
        <div className="auth-story-copy">
          <p className="eyebrow">Product by MK Company</p>
          <h1>Good work deserves a <em>better system.</em></h1>
          <p>Bring the details of your business together, so you can focus on the work that moves it forward.</p>
        </div>
        <p className="auth-story-foot">Manage Smarter. Grow Faster.</p>
      </section>

      <section className="auth-main">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to home</Link>
        <div className="auth-card">
          <div className="auth-card-icon"><LockKeyhole size={20} /></div>
          <p className="eyebrow">Secure account access</p>
          <h2>{isSignUp ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-intro">
            {isSignUp
              ? "One account for your HajaPro workspace."
              : "Sign in to continue to your HajaPro workspace."}
          </p>

          {sent ? (
            <div className="notice notice-success" role="status">
              Check your inbox for a verification link to finish creating your account.
            </div>
          ) : null}
          {error ? (
            <div className="notice notice-error" role="alert">
              {errorMessages[error] ?? "Something went wrong. Please try again."}
            </div>
          ) : null}

          {!sent ? (
            <form action={isSignUp ? signUpAction : signInAction} className="auth-fields">
              {isSignUp ? <input type="hidden" name="intent" value={intent} /> : null}
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={8}
                maxLength={128}
                required
              />
              <button className="button button-green auth-submit" type="submit">
                {isSignUp ? "Create account" : "Sign in"} <ArrowRight size={17} />
              </button>
            </form>
          ) : null}

          <p className="auth-switch">
            {isSignUp ? "Already have an account?" : "New to HajaPro?"}{" "}
            <Link href={isSignUp ? "/sign-in" : `/sign-up?type=${intent}`}>{isSignUp ? "Sign in" : "Create an account"}</Link>
          </p>
          <p className="auth-legal">Your account data is protected and only used to provide HajaPro services.</p>
        </div>
      </section>
    </main>
  );
}