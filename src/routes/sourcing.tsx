import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck, Target, Workflow } from "lucide-react";
import { InfoPage, pageHead } from "@/components/site/InfoPage";

export const Route = createFileRoute("/sourcing")({
  head: pageHead("Data Sourcing", "Post a sourcing request and let contributors and AQUIFY acquisition fill it."),
  component: () => (
    <InfoPage eyebrow="Data sourcing" title="Request the data" accent="you need." intro="Post a sourcing request and let contributors and AQUIFY acquisition fill it." features={[
    { icon: Target, title: "Define industry, region", text: "Define industry, region and attributes." },
    { icon: Workflow, title: "Matched to contributors", text: "Matched to contributors and public sources." },
    { icon: PackageCheck, title: "Delivered verified, ready", text: "Delivered verified, ready to use." },
    ]} />
  ),
});
