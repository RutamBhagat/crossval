"use client";

import { Badge } from "@crossval/ui/components/badge";
import { Button } from "@crossval/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@crossval/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@crossval/ui/components/field";
import { Input } from "@crossval/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crossval/ui/components/select";
import { Separator } from "@crossval/ui/components/separator";
import { Skeleton } from "@crossval/ui/components/skeleton";
import { Loader2 } from "lucide-react";

import { categories, categoryOptions, getCategoryName } from "@/lib/categories";
import { formatCurrency } from "@/lib/formatters";

import { MonthPicker } from "./month-picker";
import { usePlans } from "./use-plans";

export function MonthlyPlanCard() {
  const { plans, isLoading, isSaving, savePlan } = usePlans();

  return (
    <Card className="scroll-mt-20 shadow-xs" id="monthly-plan">
      <CardHeader className="border-b">
        <CardTitle>Set a monthly plan</CardTitle>
        <CardDescription>Choose a category, month, and target amount.</CardDescription>
        <CardAction>
          <Badge variant="outline">Plan</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);

            void savePlan({
              categoryId: String(form.get("categoryId")),
              month: String(form.get("month")),
              amount: String(form.get("amount")),
            });
          }}
        >
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="plan-category">Category</FieldLabel>
              <Select
                defaultValue={categories[0]?.id}
                items={categoryOptions}
                name="categoryId"
                required
              >
                <SelectTrigger id="plan-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="plan-month">Month</FieldLabel>
                <MonthPicker id="plan-month" name="month" />
              </Field>
              <Field>
                <FieldLabel htmlFor="plan-amount">Target amount</FieldLabel>
                <Input
                  id="plan-amount"
                  inputMode="decimal"
                  min="0"
                  name="amount"
                  placeholder="5000.00"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
            </div>
            <Button className="w-full sm:w-fit" disabled={isSaving} type="submit">
              {isSaving && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Save target
            </Button>
          </FieldGroup>
        </form>

        <Separator />
        <section aria-labelledby="saved-targets-heading">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 id="saved-targets-heading" className="text-xs font-medium">
              Saved targets
            </h3>
            <span className="font-mono text-xs text-muted-foreground">{plans.length}</span>
          </div>
          {isLoading ? (
            <div className="space-y-2" aria-label="Loading targets">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
            </div>
          ) : plans.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">No monthly targets yet.</p>
          ) : (
            <ul className="divide-y" aria-label="Saved monthly targets">
              {plans.map((plan) => (
                <li
                  className="flex items-center justify-between gap-4 py-3"
                  key={plan.id}
                >
                  <div>
                    <p className="text-xs font-medium">{getCategoryName(plan.categoryId)}</p>
                    <p className="font-mono text-xs text-muted-foreground">{plan.month}</p>
                  </div>
                  <span className="font-mono text-xs font-medium tabular-nums">
                    {formatCurrency(plan.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
