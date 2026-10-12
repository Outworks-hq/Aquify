import { createFileRoute } from "@tanstack/react-router";
import { Coins, ShieldCheck, Upload } from "lucide-react";
import { InfoPage, pageHead } from "@/components/site/InfoPage";

export const Route = createFileRoute("/contribute")({
  head: pageHead("Data Contributions", "Share verified business, market and operational information and earn data points you can exchange for access."),
  component: () => (
    <InfoPage eyebrow="Contribute" title="Contribute data." accent="Earn points." intro="Share verified business, market and operational information and earn data points you can exchange for access." features={[
    { icon: Upload, title: "Submit datasets, records", text: "Submit datasets, records and documents." },
    { icon: ShieldCheck, title: "Automated verification checks", text: "Automated verification checks quality and duplicates." },
    { icon: Coins, title: "Earn data points", text: "Earn data points based on assessed value." },
    ]} />
  ),
});
