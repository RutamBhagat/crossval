import { MonthLockCard } from "./month-lock-card";
import { MonthlyActualCard } from "./monthly-actual-card";
import { MonthlyPlanCard } from "./monthly-plan-card";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <MonthLockCard />
      <section
        aria-labelledby="update-ledger-heading"
        className="flex flex-col gap-4"
      >
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <MonthlyPlanCard />
          <MonthlyActualCard />
        </div>
      </section>
    </div>
  );
}
