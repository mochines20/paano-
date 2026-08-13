import type { Metadata } from "next";
import { Chat } from "@/components/Chat";

export const metadata: Metadata = {
  title: "Itanong — PAANO",
  description: "Tanong sa Taglish — commute, lutong bahay, gawa-bahay, first aid, o docs.",
};

export default function PaanoPage() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
      <Chat />
    </main>
  );
}
