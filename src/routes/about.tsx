import { createFileRoute } from "@tanstack/react-router";
import { Globe, Handshake, ShieldCheck } from "lucide-react";
import { InfoPage, pageHead } from "@/components/site/InfoPage";

export const Route = createFileRoute("/about")({
  head: pageHead("About AQUIFY", "AQUIFY is a contribution-powered data exchange. We believe information has value — and those who share it should benefit."),
  component: () => (
    <InfoPage eyebrow="About" title="Give Data." accent="Get Data." intro="AQUIFY is a contribution-powered data exchange. We believe information has value — and those who share it should benefit." features={[
    { icon: Handshake, title: "Fair, contribution-based exchange", text: "Fair, contribution-based exchange." },
    { icon: ShieldCheck, title: "Verification before access", text: "Verification before access." },
    { icon: Globe, title: "Multi-industry, multi-region coverage", text: "Multi-industry, multi-region coverage." },
    ]} />
  ),
});
