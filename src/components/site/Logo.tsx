import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" aria-label="AQUIFY home" className={`font-logo text-[1.9rem] font-medium leading-none tracking-[0.28em] text-foreground ${className}`}>
      A<span className="relative inline-block">Q<span className="absolute -bottom-[0.08em] left-[52%] h-[0.32em] w-[0.12em] -rotate-45 rounded-full bg-primary" /></span>UIFY
    </Link>
  );
}
