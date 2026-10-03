import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAANO — Ang praktikal na 'paano' sa Pilipinas",
  description:
    "Commute, lutong bahay, gawaing bahay, first aid, at government docs — sagot na Taglish, hyper-local, at praktikal. Parang tita o kuya na ginawa na ito.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PAANO", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#003153",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fil"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-deep text-body">
        <PwaRegister />
        <Header />
        {children}
        <footer className="mt-auto border-t border-line px-4 py-5 text-center text-xs leading-relaxed text-muted backdrop-blur-sm sm:py-6 sm:text-[13px]">
          PAANO — impormasyon lamang. Hindi ito opisyal na source ng gobyerno,
          doktor, o abogado.
        </footer>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('paano:theme');if(t==='light'){document.documentElement.classList.remove('dark');}}catch(e){}`,
          }}
        />
      </body>
    </html>
  );
}
