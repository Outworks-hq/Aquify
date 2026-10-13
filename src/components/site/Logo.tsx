import { Link } from "@tanstack/react-router";

function StylizedQ() {
  return (
    <svg viewBox="0 0 100 112" aria-hidden className="mx-[0.02em] inline-block h-[0.86em] w-[0.86em] align-[-0.02em]" fill="none" strokeWidth="9.5">
      <path d="M50 6 A44 44 0 0 0 50 94" className="stroke-foreground" />
      <path d="M50 6 A44 44 0 0 1 50 94" className="stroke-primary" />
      <path d="M54 64 L84 106" className="stroke-primary" strokeLinecap="square" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" aria-label="AQUIFY home" className={`inline-flex items-center font-logo text-[1.9rem] font-medium leading-none tracking-[0.28em] text-foreground ${className}`}>
      A<StylizedQ /><span className="ml-[0.28em]">UIFY</span>
    </Link>
  );
}
