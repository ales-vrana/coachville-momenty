import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import Logo from "@/components/Logo";
import { site } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL(site.baseUrl),
  title: {
    default: `${site.siteName} · CoachVille`,
    template: `%s · ${site.siteName}`,
  },
  description: site.tagline,
  openGraph: { siteName: `${site.siteName} · CoachVille`, locale: "cs_CZ", type: "website" },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Stránka /podminky-poctive zůstává dostupná přes URL, ale odkazy na ni jsou zatím skryté (text není dopsaný).
const SHOW_TERMS_LINKS = false;
// Stránka /otazky-pro-hosty zůstává dostupná přes URL, odkaz v zápatí je skrytý.
const SHOW_QUESTIONS_LINK = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <Logo size="sm" />
              <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
              <span className="hidden text-sm font-bold uppercase tracking-wide text-navy sm:inline">{site.siteName}</span>
            </Link>
            <nav className="flex shrink-0 gap-3 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-navy sm:gap-6 sm:text-[13px]">
              <Link href="/#temata" className="hover:text-teal-deep">
                Témata
              </Link>
              <Link href="/#hoste" className="hover:text-teal-deep">
                Studenti
              </Link>
              <Link href="/pro-partnera" className="hover:text-teal-deep">
                Pro partnera
              </Link>
              <a href={site.links.coachReviews} className="hidden hover:text-teal-deep md:inline" target="_blank" rel="noopener">
                Zkušenosti koučů
              </a>
              <a href={site.links.clientReferences} className="hidden hover:text-teal-deep md:inline" target="_blank" rel="noopener">
                Reference klientů
              </a>
              {SHOW_TERMS_LINKS && (
                <Link href="/podminky-poctive" className="hover:text-teal-deep">
                  Podmínky
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:pt-8">{children}</main>
        <footer className="bg-dark text-white/80">
          <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 text-sm">
            <Logo inverse />
            <p>{site.footer.operator}</p>
            <p>{site.footer.consentNote}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/15 pt-4">
              {SHOW_QUESTIONS_LINK && (
                <Link href="/otazky-pro-hosty" className="text-white underline decoration-teal hover:text-teal">
                  Otázky, které dostává každý host
                </Link>
              )}
              {SHOW_TERMS_LINKS && (
                <Link href="/podminky-poctive" className="text-white underline decoration-teal hover:text-teal">
                  Podmínky poctivě
                </Link>
              )}
              <a href={site.links.coachReviews} className="btn-primary" target="_blank" rel="noopener">
                Písemné zkušenosti koučů ↗
              </a>
              <a href={site.links.clientReferences} className="btn-primary" target="_blank" rel="noopener">
                Reference koučovaných klientů ↗
              </a>
            </div>
            <p className="text-xs text-white/50">CoachVille Europe · jediná škola v ČR/SK s ICF Level 3 akreditací · od roku 2001</p>
          </div>
        </footer>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
