import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PAANO", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fil"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <PwaRegister />
        <Header />
        {children}
        <footer className="mt-auto border-t border-zinc-800 py-6 text-center text-sm leading-relaxed text-zinc-400/90">
          PAANO — hindi opisyal na source ng gobyerno o medikal na payo.
          I-verify sa opisyal na ahensya bago kumilos.
        </footer>
      </body>
    </html>
  );
}
