import { createFileRoute } from "@tanstack/react-router";
import { Activity, ListChecks, Send } from "lucide-react";
import { InfoPage, pageHead } from "@/components/site/InfoPage";

export const Route = createFileRoute("/outreach")({
  head: pageHead("Outreach", "Build compliant campaigns from verified data with sequencing, tracking and deliverability tools."),
  component: () => (
    <InfoPage eyebrow="Paid outreach" title="Reach the right people," accent="at the right time." intro="Build compliant campaigns from verified data with sequencing, tracking and deliverability tools." features={[
    { icon: Send, title: "Email and multi-step", text: "Email and multi-step sequences." },
    { icon: ListChecks, title: "Audience building from", text: "Audience building from verified data." },
    { icon: Activity, title: "Engagement tracking and", text: "Engagement tracking and reporting." },
    ]} />
  ),
});
