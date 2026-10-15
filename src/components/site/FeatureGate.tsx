import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Feature = "connect" | "outreach" | "organization";

export function useFeature(feature: Feature) {
  const { user, isAdmin, loading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const load = () => {
    if (!user) { setReady(!loading); return; }
    supabase.from("entitlements").select("status").eq("user_id", user.id).eq("feature", feature).maybeSingle()
      .then(({ data }) => { setStatus(data?.status ?? null); setReady(true); });
  };
  useEffect(load, [user, loading]);
  const request = async () => {
    if (!user) return;
    await supabase.from("entitlements").insert({ user_id: user.id, feature, status: "requested" });
    load();
  };
  return { active: isAdmin || status === "active", status, ready, request, user };
}

export function FeatureGate({ feature, title, price, perks, children }: { feature: Feature; title: string; price: string; perks: string[]; children: ReactNode }) {
  const f = useFeature(feature);
  if (!f.ready) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (f.active) return <>{children}</>;
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 shadow-soft">
      <div className="eyebrow text-muted-foreground">Paid feature · {price}</div>
      <h2 className="mt-2 text-2xl font-semibold">Unlock {title}</h2>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-muted-foreground">{perks.map((p) => <li key={p}>{p}</li>)}</ul>
      <p className="mt-4 text-sm text-muted-foreground">Online payment isn't connected yet. Requests are activated by the AQUIFY team.</p>
      {f.status === "requested"
        ? <p className="mt-5 rounded-lg bg-accent px-4 py-3 text-sm text-primary">Request received — we'll activate it on your account shortly.</p>
        : <button onClick={f.request} className="mt-5 rounded-full bg-primary px-6 py-2 text-primary-foreground">Request access</button>}
    </div>
  );
}

export const portalHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — AQUIFY` }, { name: "description", content: description },
    { property: "og:title", content: `${title} — AQUIFY` }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ],
});
