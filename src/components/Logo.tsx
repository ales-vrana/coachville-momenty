/** Textové logo CoachVille Europe podle brand manuálu: Coach = teal, Ville = navy, EUROPE ★ = gold s prostrkáním. */
export default function Logo({ inverse = false, size = "md" }: { inverse?: boolean; size?: "sm" | "md" }) {
  const main = size === "sm" ? "text-base" : "text-xl";
  const sub = size === "sm" ? "text-[8px]" : "text-[10px]";
  return (
    <span className="inline-flex flex-col leading-none" aria-label="CoachVille Europe">
      <span className={`${main} font-bold tracking-tight`}>
        <span className={inverse ? "text-white" : "text-teal"}>Coach</span>
        <span className={inverse ? "text-white" : "text-navy"}>Ville</span>
      </span>
      <span className={`${sub} font-semibold uppercase tracking-[0.35em] ${inverse ? "text-white/80" : "text-gold"}`}>
        Europe ★
      </span>
    </span>
  );
}
