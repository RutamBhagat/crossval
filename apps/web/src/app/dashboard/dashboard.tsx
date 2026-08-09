import { MonthLockCard } from "./month-lock-card";
import { MonthlyActualCard } from "./monthly-actual-card";
import { MonthlyPlanCard } from "./monthly-plan-card";
import { ReportCard } from "./report-card";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="update-ledger-heading" className="flex flex-col gap-4">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Monthly inputs
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight" id="update-ledger-heading">
            Update the ledger
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the target first, then record what was spent.
          </p>
        </header>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <MonthlyPlanCard />
          <MonthlyActualCard />
        </div>
      </section>

      <MonthLockCard />

      <ReportCard />
    </div>
  );
}
