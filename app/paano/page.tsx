import type { Metadata } from "next";
import { Chat } from "@/components/Chat";

export const metadata: Metadata = {
  title: "Itanong — PAANO",
  description: "Tanong sa Taglish — commute, lutong bahay, gawa-bahay, first aid, o docs.",
};

export default async function PaanoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const initialQuestion = typeof q === "string" && q.trim() ? q.trim() : undefined;

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
      <Chat initialQuestion={initialQuestion} />
    </main>
  );
}
