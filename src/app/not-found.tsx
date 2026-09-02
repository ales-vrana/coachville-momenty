import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Tady nic není</h1>
      <p className="text-muted">Moment nebo stránka neexistuje, nebo byla stažena na žádost hosta.</p>
      <Link href="/#temata" className="underline">
        Zpět na témata
      </Link>
    </div>
  );
}
