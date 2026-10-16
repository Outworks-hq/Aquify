import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/exchange", label: "Data Exchange" },
  { to: "/business", label: "For Businesses" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
] as const;

export const moreNav = [
  { to: "/contribute", label: "Contribute Data" },
  { to: "/sourcing", label: "Data Sourcing" },
  { to: "/sell", label: "Sell Your Data" },
  { to: "/intelligence", label: "Data Intelligence" },
  { to: "/outreach", label: "Outreach" },
] as const;

export const appNav = [
  { to: "/workspace", label: "Workspace" },
  { to: "/connect", label: "Connect" },
  { to: "/aos", label: "Outreach" },
  { to: "/organization", label: "Organization" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const signOut = async () => { await supabase.auth.signOut(); window.location.replace("/login"); };
  return (
    <header className="relative z-20 border-b border-border bg-card">
      {user && (
        <div className="border-b border-border bg-muted/40">
          <div className="mx-auto flex max-w-[96rem] gap-6 overflow-x-auto px-[5vw] py-2 text-sm">
            {[{ to: "/account", label: "Account" }, ...appNav].map((n) => (
              <Link key={n.to} to={n.to} className="whitespace-nowrap text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary font-medium" }}>{n.label}</Link>
            ))}
          </div>
        </div>
      )}
      <div className="mx-auto flex h-[5.2rem] max-w-[96rem] items-center justify-between px-[5vw]">
        <Logo />
        <nav className="hidden items-center gap-12 lg:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-[0.95rem] text-foreground transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-10 lg:flex">
          {user ? (<>
            {isAdmin && <Link to="/admin" className="text-[1.05rem] text-primary hover:opacity-80">Admin</Link>}
            <button onClick={signOut} className="text-[1.05rem] text-primary hover:opacity-80">Sign Out</button>
            <Link to="/account" className="inline-flex h-12 items-center gap-3 rounded-full bg-primary px-8 text-[1.05rem] text-primary-foreground shadow-cta transition hover:bg-burgundy-deep">My Account <ArrowRight className="h-5 w-5" /></Link>
          </>) : (<>
          <Link to="/login" search={{}} className="text-[1.05rem] text-primary hover:opacity-80">Sign In</Link>
          <Link to="/login" search={{ mode: "register" }} className="inline-flex h-12 items-center gap-3 rounded-full bg-primary px-8 text-[1.05rem] text-primary-foreground shadow-cta transition hover:bg-burgundy-deep">
            Get Started <ArrowRight className="h-5 w-5" />
          </Link></>)}
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-[5vw] py-5 lg:hidden">
          {[...nav, ...moreNav].map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>{n.label}</Link>)}
          {user ? <><Link to="/account">My Account</Link>{appNav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>{n.label}</Link>)}<button onClick={signOut} className="text-left text-primary">Sign Out</button></> : <Link to="/login" search={{}} className="text-primary">Sign In</Link>}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-muted">
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-6 px-[5vw] py-8 text-sm">
        <span className="font-logo tracking-[0.28em] text-ink-foreground">AQUIFY</span>
        <div className="flex flex-wrap gap-6">
          {[...nav, ...moreNav].map((n) => <Link key={n.to} to={n.to} className="hover:text-ink-foreground">{n.label}</Link>)}
        </div>
        <span>Give Data. Get Data.</span>
      </div>
    </footer>
  );
}
