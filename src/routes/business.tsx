import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plug, Users } from "lucide-react";
import { InfoPage, pageHead } from "@/components/site/InfoPage";

export const Route = createFileRoute("/business")({
  head: pageHead("Business Solutions", "Organization accounts, team seats, shared point pools, integrations and enterprise controls."),
  component: () => (
    <InfoPage eyebrow="For businesses" title="Data infrastructure" accent="for every team." intro="Organization accounts, team seats, shared point pools, integrations and enterprise controls." features={[
    { icon: Building2, title: "Company profiles and", text: "Company profiles and verification." },
    { icon: Users, title: "Team seats and", text: "Team seats and roles." },
    { icon: Plug, title: "Integrations with your", text: "Integrations with your data tools." },
    ]} />
  ),
});
