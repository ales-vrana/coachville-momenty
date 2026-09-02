import { ImageResponse } from "next/og";
import { formatDuration, getMoment, getMomentViews, initials, phaseLabel, whereLabel } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getMomentViews().map((m) => ({ id: m.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getMoment(id);
  const g = m?.guestData;
  const title = m ? m.summary : "Momenty";
  const sub = g
    ? [g.displayName, g.priorProfessionText, whereLabel(g), phaseLabel(g)].filter(Boolean).join(" · ")
    : "CoachVille";
  const dur = m ? formatDuration(m.durationS) : "";
  const ini = g ? initials(g.displayName) : "M";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#fbf9f5",
          color: "#1c1a17",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              background: "linear-gradient(135deg, #1f7a6d, #145a50)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            {ini}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 600 }}>{g?.displayName ?? "Momenty"}</div>
            <div style={{ fontSize: 24, color: "#6b6560" }}>{sub}</div>
          </div>
        </div>
        <div style={{ fontSize: 46, lineHeight: 1.2, fontWeight: 600, display: "flex" }}>„{title}“</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: "#6b6560" }}>
          <span>{dur ? `${dur} z nesestříhaného rozhovoru` : ""}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: "#1f7a6d" }} />
            Momenty · CoachVille
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
