import Image from "next/image";
import type { Credential } from "@/lib/types";

import acc from "../../public/badges/icf-acc.png";
import pcc from "../../public/badges/icf-pcc.png";

const SRC: Record<Credential, typeof acc> = {
  ACC: acc,
  PCC: pcc,
  MCC: pcc, // MCC odznak zatím není v repozitáři; doplnit public/badges/icf-mcc.png
};

/** Oficiální odznak ICF Credentials & Standards. Zobrazuje se místo kolečka s iniciálami, pokud host certifikaci má.
 *  next/image kvůli basePath (/coachville-momenty) a statickému importu; images.unoptimized je zapnuto v next.config. */
export default function CredentialBadge({ credential, size = 64 }: { credential: Credential; size?: number }) {
  return (
    <Image
      src={SRC[credential]}
      alt={`Odznak ICF ${credential}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0"
      loading="eager"
    />
  );
}
