import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { FeatureGate, portalHead } from "@/components/site/FeatureGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/connect")({
  ssr: false,
  head: portalHead("AQUIFY Connect", "Connect your CRM, website, booking or accounting systems to contribute verified information and earn points automatically."),
  component: ConnectPage,
});

const catalog = [
  { key: "hubspot", name: "HubSpot CRM", kind: "CRM", method: "OAuth API" },
  { key: "salesforce", name: "Salesforce", kind: "CRM", method: "OAuth API" },
  { key: "shopify", name: "Shopify", kind: "Sales & inventory", method: "App install" },
  { key: "quickbooks", name: "QuickBooks", kind: "Accounting", method: "OAuth API" },
  { key: "calendly", name: "Calendly", kind: "Bookings", method: "OAuth API" },
  { key: "website", name: "Website snippet", kind: "Website", method: "JavaScript SDK" },
  { key: "postgres", name: "Database (PostgreSQL)", kind: "Database", method: "Read-only credentials" },
  { key: "csv", name: "Scheduled file drop", kind: "Files", method: "SFTP / upload link" },
];
type Conn = { id: string; connector: string; label: string | null; status: string; last_sync_at: string | null; records_contributed: number; created_at: string };
const statusLabel: Record<string, string> = { awaiting_authorization: "Awaiting authorization", active: "Syncing", revoked: "Revoked" };

function ConnectPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login", replace: true }); }, [user, loading]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[96rem] flex-1 px-[7vw] py-12">
        <span className="eyebrow text-muted-foreground">Data tool integrations</span>
        <h1 className="mt-2 mb-8 text-4xl font-semibold tracking-tight">AQUIFY Connect</h1>
        <FeatureGate feature="connect" title="AQUIFY Connect" price="low monthly fee" perks={["Connect CRMs, stores, booking and accounting systems", "Permitted records contribute automatically", "Verified contributions earn points over time", "Revoke any connection at any time"]}>
          {user && <Connected userId={user.id} />}
        </FeatureGate>
      </main>
      <SiteFooter />
    </div>
  );
}

function Connected({ userId }: { userId: string }) {
  const [conns, setConns] = useState<Conn[]>([]);
  const load = () => { supabase.from("connections").select("*").eq("user_id", userId).order("created_at", { ascending: false }).then(({ data }) => setConns((data as Conn[]) ?? [])); };
  useEffect(load, [userId]);
  const add = async (key: string, name: string) => { await supabase.from("connections").insert({ user_id: userId, connector: key, label: name }); load(); };
  const revoke = async (id: string) => { await supabase.from("connections").update({ status: "revoked" }).eq("id", id); load(); };
  const live = conns.filter((c) => c.status !== "revoked");
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section>
        <h2 className="text-lg font-semibold">Integration catalog</h2>
        <p className="mt-1 text-sm text-muted-foreground">Provider authorization isn't live yet — new connections wait for authorization and won't sync until then.</p>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {catalog.map((c) => {
            const has = live.some((x) => x.connector === c.key);
            return (
              <div key={c.key} className="flex items-center justify-between gap-3 px-5 py-3">
                <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.kind} · {c.method}</div></div>
                <button disabled={has} onClick={() => add(c.key, c.name)} className="rounded-full border border-primary px-4 py-1.5 text-sm text-primary disabled:opacity-50">{has ? "Added" : "Connect"}</button>
              </div>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Connected systems</h2>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {conns.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div>
                <div className="font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">{statusLabel[c.status] ?? c.status} · {c.records_contributed} records contributed · last sync {c.last_sync_at ? new Date(c.last_sync_at).toLocaleDateString() : "never"}</div>
              </div>
              {c.status !== "revoked" && <button onClick={() => revoke(c.id)} className="text-sm text-primary">Revoke</button>}
            </div>
          ))}
          {!conns.length && <div className="p-6 text-sm text-muted-foreground">No systems connected yet.</div>}
        </div>
      </section>
    </div>
  );
}
