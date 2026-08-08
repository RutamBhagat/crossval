import { MonthlyActualCard } from "./monthly-actual-card";
import { MonthlyPlanCard } from "./monthly-plan-card";
import { ReportCard } from "./report-card";

export default function Dashboard() {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <MonthlyPlanCard />
      <MonthlyActualCard />
      <ReportCard />
    </div>
  );
}
