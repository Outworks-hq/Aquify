import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { pageHead } from "@/components/site/InfoPage";

const datasets = [
  { name: "US Manufacturing Firms — Ops Contacts", cat: "Business Data", region: "North America", records: 18400, pts: 420 },
  { name: "EU Retail Consumer Spend Panel", cat: "Consumer Insights", region: "Europe", records: 92000, pts: 860 },
  { name: "SaaS Pricing Benchmarks 2026", cat: "Market Intelligence", region: "Global", records: 3100, pts: 310 },
  { name: "Logistics Carriers Directory", cat: "Business Data", region: "North America", records: 7600, pts: 240 },
  { name: "Healthcare Clinic Locations", cat: "Business Data", region: "United Kingdom", records: 12900, pts: 380 },
  { name: "Restaurant Foot-Traffic Trends", cat: "Consumer Insights", region: "North America", records: 45000, pts: 540 },
  { name: "Renewable Energy Project Pipeline", cat: "Market Intelligence", region: "Global", records: 2200, pts: 690 },
];
const cats = ["All", "Business Data", "Consumer Insights", "Market Intelligence"];

export const Route = createFileRoute("/exchange")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: pageHead("Data Exchange", "Search and exchange verified datasets across industries and regions using data points."),
  component: Exchange,
});

function Exchange() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(cats.includes(initial ?? "") ? "" : initial ?? "");
  const [cat, setCat] = useState(cats.includes(initial ?? "") ? initial! : "All");
  const list = datasets.filter((d) => (cat === "All" || d.cat === cat) && (d.name + d.region + d.cat).toLowerCase().includes(q.toLowerCase()));
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
          <p className="mt-6 text-xs text-muted-foreground">Sample listings shown — live marketplace data connects in a later stage.</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            {list.map((d) => (
              <div key={d.name} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-0">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-sm text-muted-foreground">{d.cat} · {d.region} · {d.records.toLocaleString()} records</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-primary">{d.pts} pts</span>
                  <button className="rounded-full border border-primary px-4 py-1.5 text-sm text-primary hover:bg-accent">Preview</button>
                </div>
              </div>
            ))}
            {!list.length && <div className="px-6 py-10 text-center text-muted-foreground">No datasets match your search.</div>}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
