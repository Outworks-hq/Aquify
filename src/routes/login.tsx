import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/site/Logo";
import { pageHead } from "@/components/site/InfoPage";
import { supabase } from "@/integrations/supabase/client";
import heroViz from "@/assets/hero-viz.jpg";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { mode?: "register" | undefined } => ({ mode: s["mode"] === "register" ? ("register" as const) : undefined }),
  head: pageHead("Sign In", "Sign in or create an individual or business AQUIFY account."),
  component: Login,
});

const field = "h-12 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-primary";

function Login() {
  const { mode } = Route.useSearch();
  const register = mode === "register";
  const navigate = useNavigate();
  const [type, setType] = useState<"individual" | "business">("individual");
  const [f, setF] = useState({ name: "", company: "", website: "", industry: "", email: "", password: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (register) {
      const { error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { emailRedirectTo: window.location.origin + "/account", data: { full_name: f.name, account_type: type, company_name: f.company || null, company_website: f.website || null, industry: f.industry || null } },
      });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Check your email to confirm your account, then sign in." });
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) setMsg({ ok: false, text: error.message });
      else {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        navigate({ to: r?.some((x) => x.role === "admin") ? "/admin" : "/account" });
      }
    }
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-[8vw] py-10">
        <Logo />
        <div className="my-auto max-w-md py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{register ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-muted-foreground">{register ? "Verified accounts receive 100 introductory data points." : "Sign in to your AQUIFY account."}</p>
          {register && (
            <div className="mt-6 grid grid-cols-2 rounded-full border border-border p-1">
              {(["individual", "business"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setType(t)} className={`rounded-full py-2 text-sm capitalize ${type === t ? "bg-primary text-primary-foreground" : ""}`}>{t}</button>
              ))}
            </div>
          )}
          <form className="mt-6 space-y-3" onSubmit={submit}>
            {register && <input required className={field} placeholder="Full name" value={f.name} onChange={set("name")} />}
            {register && type === "business" && (<><input required className={field} placeholder="Company name" value={f.company} onChange={set("company")} /><input className={field} placeholder="Company website" value={f.website} onChange={set("website")} /><input className={field} placeholder="Industry" value={f.industry} onChange={set("industry")} /></>)}
            <input required className={field} type="email" placeholder="Email" value={f.email} onChange={set("email")} />
            <input required minLength={8} className={field} type="password" placeholder="Password" value={f.password} onChange={set("password")} />
            <button disabled={busy} className="h-12 w-full rounded-full bg-primary text-primary-foreground shadow-cta hover:bg-burgundy-deep disabled:opacity-60">{busy ? "Please wait…" : register ? "Create account" : "Sign In"}</button>
            {msg && <p className={`text-sm ${msg.ok ? "text-foreground" : "text-destructive"}`}>{msg.text}</p>}
          </form>
          <p className="mt-6 text-sm">
            {register ? "Already have an account? " : "New to AQUIFY? "}
            <Link to="/login" search={{ mode: register ? undefined : "register" }} className="text-primary">{register ? "Sign in" : "Create an account"}</Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img src={heroViz} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </div>
  );
}
