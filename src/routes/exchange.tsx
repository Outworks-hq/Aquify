import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { pageHead } from "@/components/site/InfoPage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Dataset = { id: string; name: string; category: string; region: string; records: number; points: number; description: string | null; fields: string[]; sample: Record<string, unknown>[] };
const cats = ["All", "Business Data", "Consumer Insights", "Market Intelligence"];

export const Route = createFileRoute("/exchange")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : undefined }),
  head: pageHead("Data Exchange", "Search and exchange verified datasets across industries and regions using data points."),
  component: Exchange,
});

function Exchange() {
  const { q: initial } = Route.useSearch();
  const { user, profile } = useAuth();
  const [q, setQ] = useState(cats.includes(initial ?? "") ? "" : initial ?? "");
  const [cat, setCat] = useState(cats.includes(initial ?? "") ? initial! : "All");
  const [data, setData] = useState<Dataset[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Dataset | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.from("datasets").select("*").order("name").then(({ data }) => setData((data as Dataset[]) ?? [])); }, []);
  const loadOwned = () => { if (user) supabase.from("acquisitions").select("dataset_id").eq("user_id", user.id).then(({ data }) => setOwned(new Set((data ?? []).map((r) => r.dataset_id)))); };
  useEffect(loadOwned, [user]);

  const list = data.filter((d) => (cat === "All" || d.category === cat) && (d.name + d.region + d.category).toLowerCase().includes(q.toLowerCase()));

  const acquire = async (d: Dataset) => {
    setBusy(true); setMsg("");
    const { error } = await supabase.rpc("acquire_dataset", { _dataset_id: d.id });
    setBusy(false);
    if (error) { setMsg(error.message.includes("not enough") ? "You don't have enough data points for this dataset." : error.message); return; }
    setMsg("Added to your workspace."); loadOwned();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-hero-wash">
        <div className="mx-auto max-w-[96rem] px-[7vw] py-12">
          <span className="eyebrow text-muted-foreground">Data exchange</span>
          <h1 className="mt-3 text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-tight">Marketplace</h1>
          <div className="mt-6 flex h-14 max-w-3xl items-center rounded-full border border-border bg-card px-6 shadow-soft">
            <Search className="h-5 w-5 text-primary" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search datasets, industries, regions" className="flex-1 bg-transparent px-4 outline-none" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-5 py-2 text-sm ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            {list.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-0">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-sm text-muted-foreground">{d.category} · {d.region} · {d.records.toLocaleString()} records</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-primary">{d.points} pts</span>
                  {owned.has(d.id) && <span className="rounded-full bg-accent px-3 py-1 text-xs">In workspace</span>}
                  <button onClick={() => { setOpen(d); setMsg(""); }} className="rounded-full border border-primary px-4 py-1.5 text-sm text-primary hover:bg-accent">Preview</button>
                </div>
              </div>
            ))}
            {!list.length && <div className="px-6 py-10 text-center text-muted-foreground">No datasets match your search.</div>}
          </div>
        </div>
      </main>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setOpen(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-card p-8 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-muted-foreground">{open.category} · {open.region}</div>
                <h2 className="mt-2 text-2xl font-semibold">{open.name}</h2>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-muted-foreground">{open.description}</p>
            <div className="mt-5 text-sm font-medium">Sample records</div>
            <div className="mt-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted"><tr>{open.fields.map((f) => <th key={f} className="px-3 py-2 text-left font-medium">{f}</th>)}</tr></thead>
                <tbody>{open.sample.map((r, i) => <tr key={i} className="border-t border-border">{open.fields.map((f) => <td key={f} className="px-3 py-2">{String(r[f] ?? "")}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">{open.records.toLocaleString()} records · <span className="font-medium text-primary">{open.points} pts</span>{user && profile && <> · you have {profile.points_balance} pts</>}</div>
              {!user ? <Link to="/login" className="rounded-full bg-primary px-6 py-2 text-primary-foreground">Sign in to acquire</Link>
                : owned.has(open.id) ? <Link to="/workspace" className="rounded-full bg-primary px-6 py-2 text-primary-foreground">Open in workspace</Link>
                : <button disabled={busy} onClick={() => acquire(open)} className="rounded-full bg-primary px-6 py-2 text-primary-foreground disabled:opacity-60">{busy ? "Acquiring…" : `Acquire for ${open.points} pts`}</button>}
            </div>
            {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
