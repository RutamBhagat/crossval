import { MonthlyActualCard } from "./monthly-actual-card";
import { MonthlyPlanCard } from "./monthly-plan-card";

export default function Dashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MonthlyPlanCard />
      <MonthlyActualCard />
    </div>
  );
}
