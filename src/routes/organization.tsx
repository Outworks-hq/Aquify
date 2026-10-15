import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { FeatureGate, portalHead } from "@/components/site/FeatureGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/organization")({
  ssr: false,
  head: portalHead("Organization", "Invite your team, assign roles and organize departments in your AQUIFY organization."),
  component: OrgPage,
});

type Org = { id: string; name: string; owner_id: string };
type Member = { id: string; org_id: string; user_id: string | null; email: string; role: string; department: string | null; status: string };
const inp = "h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary";

function OrgPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Member[]>([]);
  useEffect(() => { if (!loading && !user) navigate({ to: "/login", replace: true }); }, [user, loading]);

  const load = async () => {
    if (!user) return;
    const [o, m] = await Promise.all([supabase.from("organizations").select("*"), supabase.from("org_members").select("*")]);
    const all = (m.data as Member[]) ?? [];
    setOrgs((o.data as Org[]) ?? []); setMembers(all);
    setInvites(all.filter((x) => x.status === "invited" && x.email === user.email));
  };
  useEffect(() => { load(); }, [user]);
  const accept = async (id: string) => { await supabase.rpc("accept_invite", { _member: id }); load(); };

  const myOrgs = orgs.filter((o) => o.owner_id === user?.id || members.some((m) => m.org_id === o.id && m.user_id === user?.id && m.status === "active"));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[96rem] flex-1 px-[7vw] py-12">
        <span className="eyebrow text-muted-foreground">Team & enterprise</span>
        <h1 className="mt-2 mb-8 text-4xl font-semibold tracking-tight">Organization</h1>
        {invites.map((i) => (
          <div key={i.id} className="mb-4 flex items-center justify-between rounded-xl border border-primary bg-accent px-5 py-3">
            <span>You've been invited to <b>{orgs.find((o) => o.id === i.org_id)?.name ?? "an organization"}</b> as {i.role}.</span>
            <button onClick={() => accept(i.id)} className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground">Accept</button>
          </div>
        ))}
        {myOrgs.length ? myOrgs.map((o) => <OrgPanel key={o.id} org={o} members={members.filter((m) => m.org_id === o.id)} reload={load} />)
          : <FeatureGate feature="organization" title="organizational workspaces" price="team subscription" perks={["Company dashboard and centralized billing", "Employee invitations and role-based permissions", "Department and branch organization", "Shared outreach operations when purchased"]}>
              {user && <CreateOrg userId={user.id} done={load} />}
            </FeatureGate>}
      </main>
      <SiteFooter />
    </div>
  );
}

function CreateOrg({ userId, done }: { userId: string; done: () => void }) {
  const [name, setName] = useState("");
  return (
    <form onSubmit={async (e) => { e.preventDefault(); await supabase.from("organizations").insert({ owner_id: userId, name }); done(); }} className="flex max-w-lg gap-3">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" className={inp + " flex-1"} />
      <button className="rounded-full bg-primary px-6 text-primary-foreground">Create organization</button>
    </form>
  );
}

function OrgPanel({ org, members, reload }: { org: Org; members: Member[]; reload: () => void }) {
  const { user } = useAuth();
  const isOwner = org.owner_id === user?.id;
  const myRole = isOwner ? "owner" : members.find((m) => m.user_id === user?.id)?.role;
  const canManage = myRole === "owner" || myRole === "manager";
  const [f, setF] = useState({ email: "", role: "member", department: "" });
  const depts = [...new Set(members.map((m) => m.department).filter(Boolean))] as string[];
  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("org_members").insert({ org_id: org.id, email: f.email.trim().toLowerCase(), role: f.role, department: f.department || null });
    setF({ ...f, email: "" }); reload();
  };
  const setRole = async (id: string, role: string) => { await supabase.from("org_members").update({ role }).eq("id", id); reload(); };
  const remove = async (id: string) => { await supabase.from("org_members").delete().eq("id", id); reload(); };
  return (
    <section className="mb-8 rounded-xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-semibold">{org.name}</h2><div className="text-sm capitalize text-muted-foreground">Your role: {myRole}</div></div>
        <div className="flex gap-6 text-sm"><span><b>{members.filter((m) => m.status === "active").length + 1}</b> active</span><span><b>{members.filter((m) => m.status === "invited").length}</b> pending</span><span><b>{depts.length}</b> departments</span></div>
      </div>
      {canManage && (
        <form onSubmit={invite} className="mt-5 flex flex-wrap gap-2">
          <input required type="email" placeholder="Employee email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp + " flex-1"} />
          <input placeholder="Department / branch" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} className={inp} />
          <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className={inp}><option value="member">Member</option><option value="manager">Manager</option></select>
          <button className="rounded-full bg-primary px-5 text-sm text-primary-foreground">Invite</button>
        </form>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Invitation emails aren't connected yet — invited people see the invitation here after signing in with that email.</p>
      <div className="mt-4 divide-y divide-border rounded-lg border border-border">
        {members.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <div><span className="font-medium">{m.email}</span> <span className="text-muted-foreground">· {m.department ?? "No department"} · {m.status}</span></div>
            {canManage ? (
              <div className="flex items-center gap-3">
                <select value={m.role} onChange={(e) => setRole(m.id, e.target.value)} className="h-8 rounded border border-input bg-background px-2"><option value="member">Member</option><option value="manager">Manager</option></select>
                <button onClick={() => remove(m.id)} className="text-primary">Remove</button>
              </div>
            ) : <span className="capitalize">{m.role}</span>}
          </div>
        ))}
        {!members.length && <div className="p-4 text-sm text-muted-foreground">No team members yet.</div>}
      </div>
    </section>
  );
}
