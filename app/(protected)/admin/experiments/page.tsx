import { getAllFlags } from "@/lib/feature-flags";
import ExperimentsClient from "./client";

export const metadata = { title: "Experiments" };

export default async function ExperimentsPage() {
  const flags = await getAllFlags();
  return <ExperimentsClient initialFlags={flags} />;
}
