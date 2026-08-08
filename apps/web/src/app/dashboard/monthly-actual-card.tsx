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
import { Textarea } from "@crossval/ui/components/textarea";
import { Loader2 } from "lucide-react";

import { categories, categoryOptions, getCategoryName } from "@/lib/categories";
import { formatCurrency } from "@/lib/formatters";

import { MonthPicker } from "./month-picker";
import { useActuals } from "./use-actuals";

export function MonthlyActualCard() {
  const { actuals, isLoading, isSaving, createActual } = useActuals();

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b">
        <CardTitle>Log actual spend</CardTitle>
        <CardDescription>Record what was spent for a category and month.</CardDescription>
        <CardAction>
          <Badge variant="outline">Actual</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
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
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="actual-category">Category</FieldLabel>
              <Select
                defaultValue={categories[0]?.id}
                items={categoryOptions}
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
            <Button className="w-full sm:w-fit" disabled={isSaving} type="submit">
              {isSaving && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Log actual
            </Button>
          </FieldGroup>
        </form>

        <Separator />
        <section aria-labelledby="logged-actuals-heading">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 id="logged-actuals-heading" className="text-xs font-medium">
              Logged actuals
            </h3>
            <span className="font-mono text-xs text-muted-foreground">{actuals.length}</span>
          </div>
          {isLoading ? (
            <div className="space-y-2" aria-label="Loading actuals">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
            </div>
          ) : actuals.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">No actual spend logged yet.</p>
          ) : (
            <ul className="divide-y" aria-label="Logged actual spend">
              {actuals.map((actual) => (
                <li className="flex items-start justify-between gap-4 py-3" key={actual.id}>
                  <div>
                    <p className="text-xs font-medium">{getCategoryName(actual.categoryId)}</p>
                    <p className="font-mono text-xs text-muted-foreground">{actual.month}</p>
                    {actual.note && (
                      <p className="mt-1 max-w-64 truncate text-xs text-muted-foreground">
                        {actual.note}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-xs font-medium tabular-nums">
                    {formatCurrency(actual.amountCents)}
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
