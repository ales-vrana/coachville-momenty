import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2 no-underline">
              <span className="text-lg font-bold tracking-tight">{site.siteName}</span>
              <span className="hidden text-xs text-muted sm:inline">CoachVille</span>
            </Link>
            <nav className="flex shrink-0 gap-3 whitespace-nowrap text-xs sm:gap-4 sm:text-sm">
              <Link href="/#temata" className="hover:underline">
                Témata
              </Link>
              <Link href="/pro-partnera" className="hover:underline">
                Pro partnera
              </Link>
              <Link href="/podminky-poctive" className="hover:underline">
                Podmínky
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:pt-8">{children}</main>
        <footer className="border-t border-line bg-paper-2">
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm text-muted">
            <p>{site.footer.operator}</p>
            <p>{site.footer.consentNote}</p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/otazky-pro-hosty" className="underline">
                Otázky, které dostává každý host
              </Link>
              <Link href="/podminky-poctive" className="underline">
                Podmínky poctivě
              </Link>
              <a href={site.links.coachReviews} className="underline" target="_blank" rel="noopener">
                Písemné zkušenosti koučů
              </a>
              <a href={site.links.clientReferences} className="underline" target="_blank" rel="noopener">
                Reference klientů
              </a>
            </p>
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
