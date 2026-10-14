import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, FolderPlus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/workspace")({
  ssr: false,
  head: () => ({ meta: [{ title: "Information Workspace — AQUIFY" }, { name: "description", content: "Organize, tag, annotate and export the information you've acquired on AQUIFY." }, { property: "og:title", content: "Information Workspace — AQUIFY" }, { property: "og:description", content: "Organize and work with your acquired information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Workspace,
});

type DS = { name: string; category: string; region: string; records: number; fields: string[]; sample: Record<string, unknown>[] };
type Acq = { id: string; dataset_id: string; collection_id: string | null; tags: string[]; notes: string | null; status: string; created_at: string; datasets: DS | null };
type Col = { id: string; name: string };
const statuses = ["new", "in review", "in use", "archived"];

function Workspace() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Acq[]>([]);
  const [cols, setCols] = useState<Col[]>([]);
  const [colFilter, setColFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [newCol, setNewCol] = useState("");

  const reload = async () => {
    if (!user) return;
    const [a, c] = await Promise.all([
      supabase.from("acquisitions").select("*, datasets(name,category,region,records,fields,sample)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("collections").select("id,name").eq("user_id", user.id).order("name"),
    ]);
    setItems((a.data as unknown as Acq[]) ?? []); setCols((c.data as Col[]) ?? []);
  };
  useEffect(() => { if (!loading && !user) navigate({ to: "/login", replace: true }); reload(); }, [user, loading]);

  const shown = useMemo(() => items.filter((i) =>
    (colFilter === "all" || (colFilter === "none" ? !i.collection_id : i.collection_id === colFilter)) &&
    ((i.datasets?.name ?? "") + i.tags.join(" ") + (i.notes ?? "")).toLowerCase().includes(q.toLowerCase())), [items, colFilter, q]);
  const current = items.find((i) => i.id === sel) ?? null;

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const update = async (id: string, patch: Partial<Pick<Acq, "collection_id" | "tags" | "notes" | "status">>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("acquisitions").update(patch).eq("id", id);
  };
  const addCol = async () => {
    if (!newCol.trim()) return;
    await supabase.from("collections").insert({ user_id: user.id, name: newCol.trim() });
    setNewCol(""); reload();
  };
  const delCol = async (id: string) => { await supabase.from("collections").delete().eq("id", id); if (colFilter === id) setColFilter("all"); reload(); };
  const exportCsv = (a: Acq) => {
    const d = a.datasets; if (!d) return;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [d.fields.join(","), ...d.sample.map((r) => d.fields.map((f) => esc(r[f])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const el = document.createElement("a"); el.href = url; el.download = `${d.name}.csv`; el.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[96rem] flex-1 px-[7vw] py-12">
        <span className="eyebrow text-muted-foreground">Information management</span>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Workspace</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="space-y-1 rounded-xl border border-border bg-card p-4">
            {[{ id: "all", name: `All information (${items.length})` }, { id: "none", name: "Unfiled" }, ...cols].map((c) => (
              <div key={c.id} className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm ${colFilter === c.id ? "bg-accent text-primary" : "hover:bg-muted"}`}>
                <button className="flex-1 text-left" onClick={() => setColFilter(c.id)}>{c.name}</button>
                {c.id !== "all" && c.id !== "none" && <button aria-label="Delete collection" onClick={() => delCol(c.id)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            ))}
            <div className="flex gap-2 pt-3">
              <input value={newCol} onChange={(e) => setNewCol(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCol()} placeholder="New collection" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" />
              <button onClick={addCol} aria-label="Add collection" className="rounded-lg border border-border px-2"><FolderPlus className="h-4 w-4" /></button>
            </div>
          </aside>
          <section>
            <div className="flex h-11 items-center rounded-full border border-border bg-card px-4">
              <Search className="h-4 w-4 text-primary" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, tag or note" className="flex-1 bg-transparent px-3 text-sm outline-none" />
            </div>
            {!items.length ? (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">Information you acquire appears here, ready to organize.</p>
                <Link to="/exchange" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-primary-foreground">Browse the Data Exchange</Link>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                {shown.map((i) => (
                  <button key={i.id} onClick={() => setSel(i.id === sel ? null : i.id)} className={`flex w-full flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 text-left last:border-0 ${sel === i.id ? "bg-accent" : "hover:bg-muted"}`}>
                    <div>
                      <div className="font-medium">{i.datasets?.name}</div>
                      <div className="text-xs text-muted-foreground">{i.datasets?.category} · {cols.find((c) => c.id === i.collection_id)?.name ?? "Unfiled"} {i.tags.length > 0 && "· " + i.tags.map((t) => "#" + t).join(" ")}</div>
                    </div>
                    <span className="rounded-full border border-border px-3 py-0.5 text-xs capitalize">{i.status}</span>
                  </button>
                ))}
                {!shown.length && <div className="p-8 text-center text-sm text-muted-foreground">Nothing matches.</div>}
              </div>
            )}
            {current?.datasets && (
              <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold">{current.datasets.name}</h2>
                  <button onClick={() => exportCsv(current)} className="flex items-center gap-2 rounded-full border border-primary px-4 py-1.5 text-sm text-primary"><Download className="h-4 w-4" />Export CSV</button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm">Collection
                    <select value={current.collection_id ?? ""} onChange={(e) => update(current.id, { collection_id: e.target.value || null })} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-2">
                      <option value="">Unfiled</option>{cols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></label>
                  <label className="text-sm">Status
                    <select value={current.status} onChange={(e) => update(current.id, { status: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-2 capitalize">
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select></label>
                  <label className="text-sm">Tags (comma separated)
                    <input defaultValue={current.tags.join(", ")} key={current.id + "t"} onBlur={(e) => update(current.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3" /></label>
                </div>
                <label className="mt-4 block text-sm">Notes
                  <textarea defaultValue={current.notes ?? ""} key={current.id + "n"} onBlur={(e) => update(current.id, { notes: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background p-3" /></label>
                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted"><tr>{current.datasets.fields.map((f) => <th key={f} className="px-3 py-2 text-left font-medium">{f}</th>)}</tr></thead>
                    <tbody>{current.datasets.sample.map((r, k) => <tr key={k} className="border-t border-border">{current.datasets!.fields.map((f) => <td key={f} className="px-3 py-2">{String(r[f] ?? "")}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
