import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Lock, Scale } from "lucide-react";
import { InfoPage, pageHead } from "@/components/site/InfoPage";

export const Route = createFileRoute("/sell")({
  head: pageHead("Sell Your Data", "Eligible contributors can choose cash payouts instead of points for qualifying data."),
  component: () => (
    <InfoPage eyebrow="Earn cash" title="Your information has value." accent="Get paid for it." intro="Eligible contributors can choose cash payouts instead of points for qualifying data." features={[
    { icon: Banknote, title: "Cash payouts for", text: "Cash payouts for qualifying data." },
    { icon: Scale, title: "Transparent valuation per", text: "Transparent valuation per record." },
    { icon: Lock, title: "You control what", text: "You control what is shared." },
    ]} />
  ),
});
