import { GetStartedWizard } from "@/components/onboarding/get-started-wizard";

export const metadata = {
  title: "Get started — NEYO",
};

/** Public first-run setup wizard (G.3). ?from=demo nudges demo→real conversion (G.14). */
export default function GetStartedPage({ searchParams }: { searchParams: { from?: string } }) {
  return <GetStartedWizard fromDemo={searchParams.from === "demo"} />;
}
