import { Badge } from "@crossval/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@crossval/ui/components/card";

import { categories } from "@/lib/categories";

export default function Dashboard() {
  return (
    <Card className="p-0 gap-0">
      <CardHeader className="border-b pt-4">
        <CardTitle>Categories</CardTitle>
        <CardDescription>
          Seeded categories available for plans and actuals.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">{categories.length} active</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <ul aria-label="Available categories" className="divide-y">
          {categories.map((category) => (
            <li
              className="flex items-center justify-between gap-4 px-4 py-3"
              key={category.id}
            >
              <span className="font-medium">{category.name}</span>
              <Badge className="font-mono" variant="outline">
                {category.code}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
