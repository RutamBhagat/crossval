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
import { Textarea } from "@crossval/ui/components/textarea";
import { Loader2 } from "lucide-react";

import { categories } from "@/lib/categories";

import { MonthPicker } from "./month-picker";
import { useActuals } from "./use-actuals";

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

export function MonthlyActualCard() {
  const { actuals, isLoading, isSaving, createActual } = useActuals();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actual spend</CardTitle>
        <CardDescription>Log one spend entry for a category and month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const note = String(form.get("note")).trim();

            createActual({
              categoryId: String(form.get("categoryId")),
              month: String(form.get("month")),
              amount: String(form.get("amount")),
              note: note || undefined,
            });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="actual-category">Category</FieldLabel>
              <Select
                defaultValue={categories[0]?.id}
                items={categoryItems}
                name="categoryId"
                required
              >
                <SelectTrigger id="actual-category">
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
                <FieldLabel htmlFor="actual-month">Month</FieldLabel>
                <MonthPicker id="actual-month" name="month" />
              </Field>
              <Field>
                <FieldLabel htmlFor="actual-amount">Amount spent</FieldLabel>
                <Input
                  id="actual-amount"
                  inputMode="decimal"
                  min="0"
                  name="amount"
                  placeholder="4800.00"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="actual-note">Note (optional)</FieldLabel>
              <Textarea
                id="actual-note"
                maxLength={500}
                name="note"
                placeholder="Campaign spend"
              />
            </Field>
            <Button disabled={isSaving} type="submit">
              {isSaving && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Log actual
            </Button>
          </FieldGroup>
        </form>

        <div className="border-t pt-5">
          <h3 className="mb-3 text-sm font-medium">Logged actuals</h3>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading actuals…</p>
          ) : actuals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No actual spend logged yet.</p>
          ) : (
            <ul className="divide-y" aria-label="Logged actual spend">
              {actuals.map((actual) => (
                <li className="flex items-start justify-between gap-4 py-3" key={actual.id}>
                  <div>
                    <p className="font-medium">{categoryName(actual.categoryId)}</p>
                    <p className="text-muted-foreground text-sm">{actual.month}</p>
                    {actual.note && (
                      <p className="text-muted-foreground mt-1 text-sm">{actual.note}</p>
                    )}
                  </div>
                  <span className="font-mono font-medium">
                    {currencyFormatter.format(actual.amountCents / 100)}
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
