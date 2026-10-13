import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Administration — AQUIFY" }, { name: "description", content: "AQUIFY internal administration: verification, members and points." }, { property: "og:title", content: "Administration — AQUIFY" }, { property: "og:description", content: "AQUIFY internal administration." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

type C = { id: string; user_id: string; title: string; category: string; details: string | null; status: string; created_at: string };
type P = { id: string; full_name: string | null; account_type: string; company_name: string | null; points_balance: number };

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<C[]>([]);
  const [members, setMembers] = useState<P[]>([]);
  const [pts, setPts] = useState<Record<string, number>>({});
  const [err, setErr] = useState("");

  const reload = async () => {
    const [c, p] = await Promise.all([
      supabase.from("contributions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,account_type,company_name,points_balance").order("created_at", { ascending: false }),
    ]);
    setItems((c.data as C[]) ?? []); setMembers((p.data as P[]) ?? []);
  };
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (isAdmin) reload();
  }, [loading, user, isAdmin]);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-10">You don't have access to Administration.</div>;

  const review = async (id: string, approve: boolean) => {
    setErr("");
    const { error } = await supabase.rpc("review_contribution", { _id: id, _approve: approve, _points: pts[id] ?? 50 });
    if (error) setErr(error.message); else reload();
  };
  const name = (id: string) => { const m = members.find((x) => x.id === id); return m?.company_name || m?.full_name || "Member"; };
  const pending = items.filter((i) => i.status === "pending");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[96rem] flex-1 px-[7vw] py-12">
        <div className="eyebrow text-muted-foreground">AQUIFY Administration</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Verification & members</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[["Pending review", pending.length], ["Members", members.length], ["Points issued", members.reduce((a, m) => a + m.points_balance, 0)]].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-card p-6 shadow-soft"><div className="eyebrow text-muted-foreground">{k}</div><div className="mt-2 text-4xl font-semibold">{v}</div></div>
          ))}
        </div>
        {err && <p className="mt-4 text-destructive">{err}</p>}
        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Contribution review queue</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {pending.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div><div className="font-medium">{c.title}</div><div className="text-muted-foreground">{c.category} · {name(c.user_id)} · {c.details}</div></div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} aria-label="Points to award" className="h-10 w-24 rounded-lg border border-input bg-card px-3" value={pts[c.id] ?? 50} onChange={(e) => setPts({ ...pts, [c.id]: Number(e.target.value) })} />
                  <button onClick={() => review(c.id, true)} className="h-10 rounded-full bg-primary px-5 text-primary-foreground">Approve</button>
                  <button onClick={() => review(c.id, false)} className="h-10 rounded-full border border-border px-5">Reject</button>
                </div>
              </li>
            ))}
            {!pending.length && <li className="py-3 text-muted-foreground">Nothing waiting for review.</li>}
          </ul>
        </section>
        <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Members</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {members.map((m) => <li key={m.id} className="flex justify-between py-3"><span>{m.company_name || m.full_name} <span className="capitalize text-muted-foreground">· {m.account_type}</span></span><span>{m.points_balance} pts</span></li>)}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
