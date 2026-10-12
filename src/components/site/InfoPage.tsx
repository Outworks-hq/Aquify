import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { SiteFooter, SiteHeader } from "./SiteHeader";

export type Feature = { icon: LucideIcon; title: string; text: string };

export function InfoPage({ eyebrow, title, accent, intro, features, children }: {
  eyebrow: string; title: string; accent: string; intro: string; features: Feature[]; children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-hero-wash">
        <section className="mx-auto max-w-[96rem] px-[7vw] pb-12 pt-14">
          <div className="flex items-center gap-6">
            <span className="h-[3px] w-16 bg-primary" />
            <span className="eyebrow text-muted-foreground">{eyebrow}</span>
          </div>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.2rem,4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            {title} <span className="text-primary">{accent}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{intro}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
          {children}
          <Link to="/login" search={{ mode: "register" }} className="mt-10 inline-flex h-12 items-center gap-3 rounded-full bg-primary px-8 text-primary-foreground shadow-cta hover:bg-burgundy-deep">
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function pageHead(title: string, description: string) {
  const t = `${title} — AQUIFY`;
  return () => ({
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  });
}
