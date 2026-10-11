import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import { pageHead } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional(), ref: z.string().max(20).optional() }),
  head: () => pageHead("Sign in", "Sign in or create your Tanyora account.", undefined, true),
  component: AuthPage,
});

function friendly(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("weak") || m.includes("pwned")) return "Yeh password bahut common hai. Koi strong password rakho (8+ letters, number aur symbol).";
  if (m.includes("invalid login")) return "Email ya password galat hai.";
  if (m.includes("email not confirmed")) return "Pehle apna email confirm karo — inbox/spam me link dekho.";
  if (m.includes("already registered")) return "Is email se account pehle se hai. Log in karo.";
  if (m.includes("rate limit")) return "Bahut zyada try ho gaye. Thodi der baad try karo.";
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

  async function google() {
    setErr(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) { setErr(friendly(r.error.message)); return; }
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-primary/70 p-12 text-primary-foreground lg:flex">
        <Brand />
        <div>
          <h2 className="text-4xl font-bold leading-tight">Share files.<br />Earn from every view.</h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">Upload videos, PDFs and links, get a share link and grow with the referral program.</p>
        </div>
        <p className="text-sm text-primary-foreground/70">© Tanyora</p>
      </div>
      <div className="grid place-items-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Brand /></div>
          {sent ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <MailCheck className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 text-xl font-bold">Email check karo</h1>
              <p className="mt-2 text-sm text-muted-foreground">Humne <b>{email}</b> par link bheja hai. Link kholte hi account ready. Spam folder bhi dekho.</p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => { setSent(false); setMode("login"); }}>Log in par jao</Button>
            </div>
          ) : (<>
            <h1 className="text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Apne account me log in karo" : "Free account banao — 1 minute"}</p>
            {search.ref && mode === "signup" && <p className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">Invite code: {search.ref}</p>}

            <Button variant="outline" className="mt-6 h-11 w-full" onClick={google}>
              <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              Continue with Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ya email se<div className="h-px flex-1 bg-border" /></div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && <Input className="h-11" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />}
              <Input className="h-11" type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="relative">
                <Input className="h-11 pr-10" type={show ? "text" : "password"} required minLength={8} placeholder="Password (8+ characters)"
                  autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" aria-label="Show password" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-muted-foreground">
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {err && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
              <Button className="h-11 w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "login" ? "Log in" : "Create account"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Account nahi hai? " : "Account pehle se hai? "}
              <button className="font-medium text-primary" onClick={() => { setErr(null); setMode(mode === "login" ? "signup" : "login"); }}>
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
            <p className="mt-6 text-center text-xs text-muted-foreground">Continue karke aap hamari <Link className="underline" to="/terms">Terms</Link>, <Link className="underline" to="/privacy">Privacy Policy</Link> aur <Link className="underline" to="/community-guidelines">Guidelines</Link> maante ho.</p>
          </>)}
        </div>
      </div>
    </div>
  );
}
