import { CategoriesCard } from "./categories-card";
import { MonthlyPlanCard } from "./monthly-plan-card";

export default function Dashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      <CategoriesCard />
      <MonthlyPlanCard />
    </div>
  );
}
