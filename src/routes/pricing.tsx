import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { pageHead } from "@/components/site/InfoPage";

const plans = [
  { name: "Contributor", price: "Free", note: "Earn points by contributing", items: ["Introductory points on verification", "Marketplace access with points", "Contribution history"] },
  { name: "Professional", price: "$49", note: "per month", items: ["Monthly point allowance", "Data Intelligence basics", "Outreach starter"], featured: true },
  { name: "Business", price: "$199", note: "per month", items: ["Team seats & shared points", "Integrations", "Advanced intelligence & outreach"] },
  { name: "Enterprise", price: "Custom", note: "contact us", items: ["Custom sourcing", "Dedicated support", "Admin & compliance controls"] },
];

export const Route = createFileRoute("/pricing")({
  head: pageHead("Pricing", "Contribute for free or buy points and plans for intelligence, outreach and team features."),
  component: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-hero-wash">
        <div className="mx-auto max-w-[96rem] px-[7vw] py-12">
          <span className="eyebrow text-muted-foreground">Pricing</span>
          <h1 className="mt-3 text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-tight">Give data, or <span className="text-primary">buy points.</span></h1>
          <p className="mt-2 text-xs text-muted-foreground">Prices shown are placeholders until billing is configured.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-xl border p-6 shadow-soft ${p.featured ? "border-primary bg-card" : "border-border bg-card"}`}>
                <div className="font-semibold">{p.name}</div>
                <div className="mt-3 text-3xl font-semibold text-primary">{p.price}</div>
                <div className="text-sm text-muted-foreground">{p.note}</div>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.items.map((i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-primary" />{i}</li>)}
                </ul>
                <Link to="/login" search={{ mode: "register" }} className="mt-6 block rounded-full bg-primary py-2.5 text-center text-sm text-primary-foreground hover:bg-burgundy-deep">Choose</Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});
