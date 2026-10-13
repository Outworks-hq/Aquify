import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({ meta: [{ title: "My Account — AQUIFY" }, { name: "description", content: "Your AQUIFY data points, contributions and account history." }, { property: "og:title", content: "My Account — AQUIFY" }, { property: "og:description", content: "Your AQUIFY data points and contributions." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

type Row = { id: string; title: string; category: string; status: string; points_awarded: number; created_at: string };
type Ledger = { id: string; amount: number; reason: string; created_at: string };
const field = "h-11 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-primary";

function Account() {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [contribs, setContribs] = useState<Row[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [form, setForm] = useState({ title: "", category: "Business Data", details: "" });

  const reload = async () => {
    if (!user) return;
    const [c, l] = await Promise.all([
      supabase.from("contributions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("points_ledger").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setContribs((c.data as Row[]) ?? []); setLedger((l.data as Ledger[]) ?? []);
  };
  useEffect(() => { if (!loading && !user) navigate({ to: "/login", replace: true }); reload(); }, [user, loading]);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("contributions").insert({ user_id: user.id, title: form.title, category: form.category, details: form.details });
    setForm({ ...form, title: "", details: "" }); reload();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[96rem] flex-1 px-[7vw] py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow text-muted-foreground">{profile?.account_type === "business" ? "Business account" : "Individual account"}</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{profile?.company_name || profile?.full_name || user.email}</h1>
          </div>
          {isAdmin && <Link to="/admin" className="rounded-full border border-primary px-6 py-2 text-primary">Open Administration</Link>}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Stat k="Data points" v={profile?.points_balance ?? 0} />
          <Stat k="Contributions" v={contribs.length} />
          <Stat k="Approved" v={contribs.filter((c) => c.status === "approved").length} />
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold">Contribute data</h2>
            <p className="mt-1 text-sm text-muted-foreground">Submissions are reviewed and verified before points are awarded.</p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input required className={field} placeholder="Title (e.g. Local plumbing contractors – Ohio)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["Business Data", "Consumer Insights", "Market Intelligence"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <textarea className="min-h-24 w-full rounded-lg border border-input bg-card p-4 outline-none focus:border-primary" placeholder="Describe the data, source and record count" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
              <button className="h-11 rounded-full bg-primary px-8 text-primary-foreground hover:bg-burgundy-deep">Submit for review</button>
            </form>
            <ul className="mt-6 divide-y divide-border text-sm">
              {contribs.map((c) => <li key={c.id} className="flex justify-between py-3"><span>{c.title} <span className="text-muted-foreground">· {c.category}</span></span><span className="capitalize text-muted-foreground">{c.status}{c.points_awarded ? ` · +${c.points_awarded}` : ""}</span></li>)}
              {!contribs.length && <li className="py-3 text-muted-foreground">No contributions yet.</li>}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold">Points history</h2>
            <ul className="mt-4 divide-y divide-border text-sm">
              {ledger.map((l) => <li key={l.id} className="flex justify-between py-3"><span>{l.reason}<br /><span className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</span></span><span className={l.amount >= 0 ? "text-primary" : ""}>{l.amount >= 0 ? "+" : ""}{l.amount}</span></li>)}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number }) {
  return <div className="rounded-xl border border-border bg-card p-6 shadow-soft"><div className="eyebrow text-muted-foreground">{k}</div><div className="mt-2 text-4xl font-semibold">{v}</div></div>;
}
