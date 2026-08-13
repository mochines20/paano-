import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PAANO — Ang praktikal na 'paano' sa Pilipinas",
  description:
    "Commute, lutong bahay, gawa-bahay, first aid, at government docs — sagot na Taglish, hyper-local, at praktikal. Parang tita o kuya na ginawa na ito.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fil"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-zinc-50"
            >
              PAANO<span className="text-orange-500">.</span>
            </Link>
            <Link
              href="/paano"
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-300"
            >
              Itanong
            </Link>
          </nav>
        </header>
        {children}
        <footer className="mt-auto border-t border-zinc-800 py-6 text-center text-sm leading-relaxed text-zinc-400/90">
          PAANO — hindi opisyal na source ng gobyerno o medikal na payo.
          I-verify sa opisyal na ahensya bago kumilos.
        </footer>
      </body>
    </html>
  );
}
