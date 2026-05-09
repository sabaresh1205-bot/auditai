import type { Metadata } from "next";
import { EmbedAuditWidget } from "@/components/embed/EmbedAuditWidget";

export const metadata: Metadata = {
  title: "AuditAI Embed",
  description: "Embed a lightweight AI spend audit widget.",
};

export default function EmbedPage() {
  return <EmbedAuditWidget />;
}
