"use client";

import { Button } from "@crossval/ui/components/button";
import {
  Card,
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
import { Loader2 } from "lucide-react";

import { categories } from "@/lib/categories";

import { MonthPicker } from "./month-picker";
import { usePlans } from "./use-plans";

const categoryItems = categories.map((category) => ({
  label: category.name,
  value: category.id,
}));

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function categoryName(categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
}

export function MonthlyPlanCard() {
  const { plans, isLoading, isSaving, savePlan } = usePlans();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly plan</CardTitle>
        <CardDescription>Set a spending target for one category and month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="plan-category">Category</FieldLabel>
              <Select
                defaultValue={categories[0]?.id}
                items={categoryItems}
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
            <Button disabled={isSaving} type="submit">
              {isSaving && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Save target
            </Button>
          </FieldGroup>
        </form>

        <div className="border-t pt-5">
          <h3 className="mb-3 text-sm font-medium">Saved targets</h3>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading targets…</p>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">No monthly targets yet.</p>
          ) : (
            <ul className="divide-y" aria-label="Saved monthly targets">
              {plans.map((plan) => (
                <li
                  className="flex items-center justify-between gap-4 py-3"
                  key={plan.id}
                >
                  <div>
                    <p className="font-medium">{categoryName(plan.categoryId)}</p>
                    <p className="text-muted-foreground text-sm">{plan.month}</p>
                  </div>
                  <span className="font-mono font-medium">
                    {currencyFormatter.format(plan.amountCents / 100)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
