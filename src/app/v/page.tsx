import type { Metadata } from "next";
import SetView, { type SetMoment } from "@/components/SetView";
import { formatDuration, getMomentViews, getSalespeople, phaseLabel, whereLabel } from "@/lib/data";

export const metadata: Metadata = {
  title: "Vybrané momenty",
  robots: { index: false, follow: false },
};

export default function SetPage() {
  const moments: SetMoment[] = getMomentViews().map((m) => ({
    id: m.id,
    guestName: m.guestData.displayName,
    prior: m.guestData.priorProfessionText,
    where: whereLabel(m.guestData),
    phase: phaseLabel(m.guestData),
    summary: m.summary,
    duration: formatDuration(m.durationS),
    topic: m.primaryTopic.label,
  }));
  return <SetView moments={moments} salespeople={getSalespeople()} />;
}
