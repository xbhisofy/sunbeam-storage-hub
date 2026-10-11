import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import { pageHead } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { ref: search.ref ?? "", display_name: name.trim() || undefined } },
      });
      if (error) setErr(friendly(error.message));
      else if (data.user && data.user.identities?.length === 0) setErr(friendly("already registered"));
      else if (data.session) navigate({ to: "/dashboard" });
      else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setErr(friendly(error.message)); else navigate({ to: "/dashboard" });
    }
    setBusy(false);
  }


  return (
    <div className="grid min-h-dvh bg-background">
      <div className="grid place-items-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex justify-center"><Brand /></div>
          {sent ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <MailCheck className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 text-xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <b>{email}</b>. Open it to activate your account.</p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => { setSent(false); setMode("login"); }}>Back to log in</Button>
            </div>
          ) : (<>
            <h1 className="text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Log in to manage your files and earnings" : "Start sharing and earning in under a minute"}</p>
            {search.ref && mode === "signup" && <p className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">Invite code: {search.ref}</p>}

            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "signup" && <Input className="h-11" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />}
              <label className="sr-only" htmlFor="auth-email">Email</label>
              <Input id="auth-email" className="h-12" type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label className="sr-only" htmlFor="auth-password">Password</label>
              <div className="relative">
                <Input id="auth-password" className="h-11 pr-10" type={show ? "text" : "password"} required minLength={8} placeholder="Password (8+ characters)"
                  autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button variant="ghost" size="icon" type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-0 top-0 h-11 w-11 text-muted-foreground">
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {err && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
              <Button className="h-11 w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "login" ? "Log in" : "Create account"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <Button variant="link" className="px-1 font-medium text-primary" onClick={() => { setErr(null); setMode(mode === "login" ? "signup" : "login"); }}>
                {mode === "login" ? "Sign up" : "Log in"}
              </Button>
            </p>
            <p className="mt-6 text-center text-xs text-muted-foreground">By continuing you agree to our <Link className="underline" to="/terms">Terms</Link>, <Link className="underline" to="/privacy">Privacy Policy</Link> and <Link className="underline" to="/community-guidelines">Guidelines</Link>.</p>
          </>)}
        </div>
      </div>
    </div>
  );
}
