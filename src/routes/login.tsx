import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/site/Logo";
import { pageHead } from "@/components/site/InfoPage";
import heroViz from "@/assets/hero-viz.jpg";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { mode?: "register" } => ({ mode: s["mode"] === "register" ? ("register" as const) : undefined }),
  head: pageHead("Sign In", "Sign in or create an individual or business AQUIFY account."),
  component: Login,
});

const field = "h-12 w-full rounded-lg border border-input bg-card px-4 outline-none focus:border-primary";

function Login() {
  const { mode } = Route.useSearch();
  const register = mode === "register";
  const [type, setType] = useState<"individual" | "business">("individual");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-[8vw] py-10">
        <Logo />
        <div className="my-auto max-w-md py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{register ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-muted-foreground">{register ? "Verified accounts receive introductory data points." : "Sign in to your AQUIFY account."}</p>
          {register && (
            <div className="mt-6 grid grid-cols-2 rounded-full border border-border p-1">
              {(["individual", "business"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)} className={`rounded-full py-2 text-sm capitalize ${type === t ? "bg-primary text-primary-foreground" : ""}`}>{t}</button>
              ))}
            </div>
          )}
          <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
            {register && <input className={field} placeholder="Full name" />}
            {register && type === "business" && (<><input className={field} placeholder="Company name" /><input className={field} placeholder="Company website" /><input className={field} placeholder="Industry" /></>)}
            <input className={field} type="email" placeholder="Email" />
            <input className={field} type="password" placeholder="Password" />
            <button className="h-12 w-full rounded-full bg-primary text-primary-foreground shadow-cta hover:bg-burgundy-deep">{register ? "Create account" : "Sign In"}</button>
            <p className="text-xs text-muted-foreground">Account sign-in activates once the backend is connected.</p>
          </form>
          <p className="mt-6 text-sm">
            {register ? "Already have an account? " : "New to AQUIFY? "}
            <Link to="/login" search={{ mode: register ? undefined : "register" }} className="text-primary">{register ? "Sign in" : "Create an account"}</Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img src={heroViz} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </div>
  );
}
