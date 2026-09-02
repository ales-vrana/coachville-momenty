import { initials } from "@/lib/data";

export default function Avatar({
  name,
  photo,
  size = 48,
}: {
  name: string;
  photo?: string;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} style={style} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep font-semibold text-white"
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
