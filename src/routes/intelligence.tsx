import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, LineChart, Sparkles } from "lucide-react";
import { InfoPage, pageHead } from "@/components/site/InfoPage";

export const Route = createFileRoute("/intelligence")({
  head: pageHead("Data Intelligence", "Advanced analysis, enrichment, market mapping and signals for teams that need more than raw records."),
  component: () => (
    <InfoPage eyebrow="Paid intelligence" title="Turn data into" accent="decisions." intro="Advanced analysis, enrichment, market mapping and signals for teams that need more than raw records." features={[
    { icon: BarChart3, title: "Market and industry", text: "Market and industry analytics." },
    { icon: Sparkles, title: "Enrichment and scoring", text: "Enrichment and scoring." },
    { icon: LineChart, title: "Trend and demand", text: "Trend and demand signals." },
    ]} />
  ),
});
