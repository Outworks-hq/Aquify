import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string; full_name: string | null; account_type: string; company_name: string | null;
  company_website: string | null; industry: string | null; points_balance: number;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (u: User | null) => {
      setUser(u);
      if (!u) { setProfile(null); setRoles([]); setLoading(false); return; }
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.id),
      ]);
      if (!active) return;
      setProfile((p.data as Profile) ?? null);
      setRoles((r.data ?? []).map((x) => x.role));
      setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setTimeout(() => load(s?.user ?? null), 0); });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, profile, roles, isAdmin: roles.includes("admin"), loading };
}
