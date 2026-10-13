import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Database, Search, Users } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import heroViz from "@/assets/hero-viz.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AQUIFY — Give Data. Get Data." },
      { name: "description", content: "AQUIFY connects verified data with companies that use it to create real value — securely, transparently, and at scale." },
      { property: "og:title", content: "AQUIFY — The Data Exchange Built for Business" },
      { property: "og:description", content: "Your information has value. Exchange it for more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const cats = [
  { icon: Database, label: "Business Data" },
  { icon: Users, label: "Consumer Insights" },
  { icon: BarChart3, label: "Market Intelligence" },
];

const stats = [
  { k: "Verified Businesses", v: "10K+", d: ["Companies contributing", "and accessing data."] },
  { k: "Data Categories", v: "50+", d: ["Across industries", "and markets."] },
  { k: "Real Opportunities", v: "Growing", d: ["More data.", "More business outcomes."] },
];

function Index() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const go = (query: string) => navigate({ to: "/exchange", search: { q: query } });

  return (
    <div className="flex min-h-screen flex-col lg:min-h-screen">
      <SiteHeader />
      <section className="relative flex-1 overflow-hidden bg-hero-wash">
        <img src={heroViz} alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-full w-auto max-w-[42%] object-cover object-left lg:block" />
        <div className="relative mx-auto flex h-full max-w-[96rem] flex-col justify-center px-[7vw] pb-16 pt-[4.5rem]">
          <div className="flex items-center gap-6">
            <span className="h-[3px] w-16 bg-primary" />
            <span className="eyebrow text-muted-foreground">Verified data. Real opportunities.</span>
          </div>
          <h1 className="mt-8 font-display text-[clamp(2.6rem,5.4vw,5.4rem)] font-semibold leading-[0.93] tracking-[-0.035em]">
            The Data<br />Exchange<br /><span className="text-primary">Built for Business.</span>
          </h1>
          <p className="mt-7 max-w-[38rem] text-[clamp(1rem,1.45vw,1.45rem)] leading-snug text-muted-foreground">
            AQUIFY connects verified data with companies that use it to create real value — securely, transparently, and at scale.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="mt-10 flex h-[4.3rem] max-w-[51rem] items-center rounded-full border border-border bg-card pl-8 pr-2 shadow-soft">
            <Search className="h-6 w-6 text-primary" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for data, industries, or opportunities" className="flex-1 bg-transparent px-6 text-lg outline-none placeholder:text-muted-foreground" />
            <button type="submit" aria-label="Search" className="flex h-[3.2rem] w-[5.2rem] items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-burgundy-deep">
              <ArrowRight className="h-6 w-6" />
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-4">
            {cats.map((c) => (
              <button key={c.label} onClick={() => go(c.label)} className="flex h-[3.4rem] w-[15rem] items-center gap-5 rounded-full border border-border bg-card px-7 text-[1rem] transition hover:border-primary">
                <c.icon className="h-6 w-6 text-primary" /> {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-strip-wash text-ink-foreground">
        <div className="mx-auto grid max-w-[96rem] gap-8 px-[12vw] py-12 md:grid-cols-3 md:divide-x md:divide-ink-muted/30">
          {stats.map((s, i) => (
            <div key={s.k} className={i ? "md:pl-[4vw]" : ""}>
              <div className="eyebrow text-[0.68rem] text-ink-muted">{s.k}</div>
              <div className="mt-2 text-[2.3rem] font-medium leading-tight tracking-tight">{s.v}</div>
              <div className="text-ink-muted">{s.d[0]}<br />{s.d[1]}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
