import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { FeatureGate, portalHead } from "@/components/site/FeatureGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/aos")({
  ssr: false,
  head: portalHead("AQUIFY Outreach System", "Organize companies and contacts into groups, then plan and schedule outreach campaigns with follow-ups."),
  component: AosPage,
});

type Contact = { id: string; company: string | null; name: string; email: string | null; role: string | null; industry: string | null; grp: string | null; unsubscribed: boolean; notes: string | null };
type Campaign = { id: string; name: string; target_group: string | null; subject: string | null; body: string | null; scheduled_for: string | null; follow_up_days: number | null; status: string };
const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary";

function AosPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login", replace: true }); }, [user, loading]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[96rem] flex-1 px-[7vw] py-12">
        <span className="eyebrow text-muted-foreground">Outreach package</span>
        <h1 className="mt-2 mb-8 text-4xl font-semibold tracking-tight">AQUIFY Outreach System</h1>
        <FeatureGate feature="outreach" title="the Outreach System" price="Outreach Package" perks={["Organize companies and contacts", "Recipient groups and saved prospect lists", "Campaign composition, scheduling and follow-ups", "Unsubscribe handling built in"]}>
          {user && <Aos userId={user.id} />}
        </FeatureGate>
      </main>
      <SiteFooter />
    </div>
  );
}

function Aos({ userId }: { userId: string }) {
  const [tab, setTab] = useState<"contacts" | "campaigns">("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [camps, setCamps] = useState<Campaign[]>([]);
  const [grp, setGrp] = useState("all");
  const [sel, setSel] = useState<Contact | null>(null);
  const [c, setC] = useState({ name: "", company: "", email: "", role: "", industry: "", grp: "" });
  const [k, setK] = useState({ name: "", target_group: "", subject: "", body: "", scheduled_for: "", follow_up_days: "3" });

  const load = async () => {
    const [a, b] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", userId).order("company"),
      supabase.from("campaigns").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    setContacts((a.data as Contact[]) ?? []); setCamps((b.data as Campaign[]) ?? []);
  };
  useEffect(() => { load(); }, [userId]);
  const groups = useMemo(() => [...new Set(contacts.map((x) => x.grp).filter(Boolean))] as string[], [contacts]);
  const shown = contacts.filter((x) => grp === "all" || x.grp === grp);

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("contacts").insert({ user_id: userId, ...c, grp: c.grp || null });
    setC({ name: "", company: "", email: "", role: "", industry: "", grp: c.grp }); load();
  };
  const saveContact = async (x: Contact) => { await supabase.from("contacts").update({ notes: x.notes, grp: x.grp, unsubscribed: x.unsubscribed }).eq("id", x.id); load(); };
  const delContact = async (id: string) => { await supabase.from("contacts").delete().eq("id", id); setSel(null); load(); };
  const addCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("campaigns").insert({ user_id: userId, name: k.name, target_group: k.target_group || null, subject: k.subject, body: k.body,
      scheduled_for: k.scheduled_for ? new Date(k.scheduled_for).toISOString() : null, follow_up_days: Number(k.follow_up_days) || null, status: k.scheduled_for ? "scheduled" : "draft" });
    setK({ name: "", target_group: "", subject: "", body: "", scheduled_for: "", follow_up_days: "3" }); load();
  };
  const recipients = (g: string | null) => contacts.filter((x) => !x.unsubscribed && x.email && (!g || x.grp === g)).length;

  return (
    <div>
      <div className="flex gap-2">
        {(["contacts", "campaigns"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-5 py-2 text-sm capitalize ${tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{t}</button>)}
      </div>
      {tab === "contacts" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[14rem_1fr_20rem]">
          <aside className="space-y-1 rounded-xl border border-border bg-card p-3 text-sm">
            {["all", ...groups].map((g) => <button key={g} onClick={() => setGrp(g)} className={`block w-full rounded-lg px-3 py-2 text-left ${grp === g ? "bg-accent text-primary" : "hover:bg-muted"}`}>{g === "all" ? `All contacts (${contacts.length})` : g}</button>)}
          </aside>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {shown.map((x) => (
              <button key={x.id} onClick={() => setSel(x)} className={`flex w-full items-center justify-between px-5 py-3 text-left ${sel?.id === x.id ? "bg-accent" : "hover:bg-muted"}`}>
                <div><div className="font-medium">{x.name} <span className="font-normal text-muted-foreground">· {x.role}</span></div><div className="text-xs text-muted-foreground">{x.company} · {x.industry} {x.grp && `· ${x.grp}`}</div></div>
                {x.unsubscribed && <span className="text-xs text-muted-foreground">Unsubscribed</span>}
              </button>
            ))}
            {!shown.length && <div className="p-6 text-sm text-muted-foreground">No contacts yet — add your first one.</div>}
          </div>
          <div className="space-y-4">
            {sel ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="font-semibold">{sel.name}</div>
                <div className="text-sm text-muted-foreground">{sel.email}</div>
                <label className="mt-3 block text-sm">Group<input className={inp} value={sel.grp ?? ""} onChange={(e) => setSel({ ...sel, grp: e.target.value || null })} /></label>
                <label className="mt-3 block text-sm">Notes<textarea rows={3} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={sel.notes ?? ""} onChange={(e) => setSel({ ...sel, notes: e.target.value })} /></label>
                <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.unsubscribed} onChange={(e) => setSel({ ...sel, unsubscribed: e.target.checked })} />Unsubscribed</label>
                <div className="mt-3 flex gap-3"><button onClick={() => saveContact(sel)} className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground">Save</button><button onClick={() => delContact(sel.id)} className="text-sm text-primary">Delete</button></div>
              </div>
            ) : (
              <form onSubmit={addContact} className="space-y-2 rounded-xl border border-border bg-card p-5">
                <div className="font-semibold">Add contact</div>
                {(["name", "company", "email", "role", "industry", "grp"] as const).map((f) => <input key={f} required={f === "name"} placeholder={f === "grp" ? "Group" : f[0]!.toUpperCase() + f.slice(1)} className={inp} value={c[f]} onChange={(e) => setC({ ...c, [f]: e.target.value })} />)}
                <button className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground">Add</button>
              </form>
            )}
            {sel && <button onClick={() => setSel(null)} className="text-sm text-primary">+ Add another contact</button>}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {camps.map((x) => (
              <div key={x.id} className="px-5 py-3">
                <div className="flex justify-between"><span className="font-medium">{x.name}</span><span className="rounded-full border border-border px-3 text-xs capitalize">{x.status}</span></div>
                <div className="text-xs text-muted-foreground">{x.target_group ?? "All contacts"} · {recipients(x.target_group)} eligible recipients · {x.scheduled_for ? new Date(x.scheduled_for).toLocaleString() : "not scheduled"}{x.follow_up_days ? ` · follow-up after ${x.follow_up_days} days` : ""}</div>
                <div className="mt-1 text-sm">{x.subject}</div>
              </div>
            ))}
            {!camps.length && <div className="p-6 text-sm text-muted-foreground">No campaigns yet.</div>}
          </div>
          <form onSubmit={addCampaign} className="space-y-2 rounded-xl border border-border bg-card p-5">
            <div className="font-semibold">New campaign</div>
            <input required placeholder="Campaign name" className={inp} value={k.name} onChange={(e) => setK({ ...k, name: e.target.value })} />
            <select className={inp} value={k.target_group} onChange={(e) => setK({ ...k, target_group: e.target.value })}><option value="">All contacts</option>{groups.map((g) => <option key={g}>{g}</option>)}</select>
            <input placeholder="Subject" className={inp} value={k.subject} onChange={(e) => setK({ ...k, subject: e.target.value })} />
            <textarea rows={5} placeholder="Message" className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={k.body} onChange={(e) => setK({ ...k, body: e.target.value })} />
            <label className="block text-sm">Schedule<input type="datetime-local" className={inp} value={k.scheduled_for} onChange={(e) => setK({ ...k, scheduled_for: e.target.value })} /></label>
            <label className="block text-sm">Follow up after (days)<input type="number" min="0" className={inp} value={k.follow_up_days} onChange={(e) => setK({ ...k, follow_up_days: e.target.value })} /></label>
            <p className="text-xs text-muted-foreground">Sending isn't connected to an email provider yet; scheduled campaigns will send once it is. Unsubscribed contacts are always excluded.</p>
            <button className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground">Save campaign</button>
          </form>
        </div>
      )}
    </div>
  );
}
