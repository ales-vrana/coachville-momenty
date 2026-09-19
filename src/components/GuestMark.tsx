import Avatar from "./Avatar";
import CredentialBadge from "./CredentialBadge";
import type { Guest } from "@/lib/types";

/** Vizuální značka hosta: odznak ICF, když má certifikaci, jinak fotka nebo iniciály. */
export default function GuestMark({ g, size = 56 }: { g: Guest; size?: number }) {
  if (g.credential) return <CredentialBadge credential={g.credential} size={size} />;
  return <Avatar name={g.displayName} photo={g.consentScope.photo ? g.photo : undefined} size={size} />;
}
