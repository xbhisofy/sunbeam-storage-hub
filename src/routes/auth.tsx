import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import logoImg from "@/assets/tanyora-logo.jpg"; void logoImg;
import { toast } from "sonner";
import { pageHead } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInstalledApp } from "@/lib/app-mode";
import { PAYOUT_METHODS_SENTENCE } from "@/lib/payouts";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional(), ref: z.string().max(20).optional() }),
  head: () => pageHead("Sign in", "Sign in or create your Tanyora account.", undefined, true),
  component: AuthPage,
});

function friendly(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("weak") || m.includes("pwned")) return "This password is too common. Use a stronger one with 8+ characters, a number and a symbol.";
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox or spam folder.";
  if (m.includes("already registered")) return "An account with this email already exists. Please log in.";
  if (m.includes("rate limit")) return "Too many attempts. Please try again in a few minutes.";
  return msg;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const app = useInstalledApp();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) setTimeout(() => navigate({ to: "/dashboard", replace: true }), 0); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { ref: search.ref ?? "", display_name: name.trim() || undefined } },
      });
      if (error) setErr(friendly(error.message));
      else if (data.user && data.user.identities?.length === 0) setErr(friendly("already registered"));
      else if (data.session) { toast.success("Account created", { description: "Welcome to Tanyora!" }); navigate({ to: "/dashboard", replace: true }); }
      else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setErr(friendly(error.message)); else navigate({ to: "/dashboard", replace: true });
    }
    } catch (x) { setErr(x instanceof Error ? x.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  async function google() {
    setErr(null); setBusy(true);
    if (search.ref) localStorage.setItem("tanyora_ref", search.ref);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth", queryParams: { prompt: "select_account" } },
    });
    if (error) { setErr(friendly(error.message)); setBusy(false); }
  }

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <aside className="landing landing-glow hidden flex-col justify-between p-12 lg:flex">
        <Brand />
        {app ? (
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">Upload once.<br /><span className="landing-text">Share anywhere.</span></h2>
            <p className="mt-4 max-w-md text-muted-foreground">Keep your videos, photos and documents in one place and send a single link to anyone.</p>
            <ul className="mt-8 space-y-3 text-sm">
              <li>Upload videos, photos and documents</li><li>One simple share link for every file</li><li>Access your files from app and web</li>
            </ul>
          </div>
        ) : (
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">Upload once.<br /><span className="landing-text">Earn from every view.</span></h2>
            <p className="mt-4 max-w-md text-muted-foreground">Share videos, audio and PDFs with a single link. Track views, referrals and payouts from one dashboard.</p>
            <ul className="mt-8 space-y-3 text-sm">
              <li>$3.00 per 1,000 views</li><li>10% referral commission</li><li>Withdraw from $5 via {PAYOUT_METHODS_SENTENCE}</li>
            </ul>
          </div>
        )}
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Tanyora</p>
      </aside>
      <div className="grid place-items-center bg-background px-5 py-10">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
              <MailCheck className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 text-xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <b>{email}</b>. Open it to activate your account.</p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => { setSent(false); setMode("login"); }}>Back to log in</Button>
            </div>
          ) : (<div className="mx-auto w-full max-w-[360px] rounded-3xl bg-card p-5 shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--foreground)_18%,transparent)] sm:p-7">
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-accent p-1 text-sm font-semibold">
              {(["login", "signup"] as const).map((m) => <button key={m} type="button" onClick={() => { setErr(null); setMode(m); }} className={`h-10 rounded-lg transition ${mode === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>{m === "login" ? "Log in" : "Sign up"}</button>)}
            </div>
            <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? (app ? "Log in to manage your files" : "Log in to manage your files and earnings") : (app ? "Create your account in under a minute" : "Start sharing and earning in under a minute")}</p>
            {search.ref && mode === "signup" && <p className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">Invite code: {search.ref}</p>}

            <Button type="button" variant="outline" className="mt-6 h-12 w-full rounded-xl text-base" disabled={busy} onClick={google}>
              <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              {mode === "login" ? "Continue with Google" : "Sign up with Google"}
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && <Input className="h-12 rounded-xl border-border bg-background focus-visible:bg-background" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />}
              <label className="sr-only" htmlFor="auth-email">Email</label>
              <Input id="auth-email" className="h-12 rounded-xl border-border bg-background focus-visible:bg-background" type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label className="sr-only" htmlFor="auth-password">Password</label>
              <div className="relative">
                <Input id="auth-password" className="h-12 rounded-xl border-border bg-background pr-12 focus-visible:bg-background" type={show ? "text" : "password"} required minLength={8} placeholder="Password (8+ characters)"
                  autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button variant="ghost" size="icon" type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-1 top-1 h-10 w-10 text-muted-foreground">
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {err && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
              <Button className="h-12 w-full rounded-xl text-base shadow-lg shadow-primary/30" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? (mode === "login" ? "Logging in…" : "Creating account…") : mode === "login" ? "Log in" : "Create account"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <Button variant="link" className="px-1 font-medium text-primary" onClick={() => { setErr(null); setMode(mode === "login" ? "signup" : "login"); }}>
                {mode === "login" ? "Sign up" : "Log in"}
              </Button>
            </p>
            <p className="mt-6 text-center text-xs text-muted-foreground">By continuing you agree to our <Link className="underline" to="/terms">Terms</Link>, <Link className="underline" to="/privacy">Privacy Policy</Link> and <Link className="underline" to="/community-guidelines">Guidelines</Link>.</p>
          </div>)}
        </div>
      </div>
    </div>
  );
}
