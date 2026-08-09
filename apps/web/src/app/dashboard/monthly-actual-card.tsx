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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@crossval/ui/components/collapsible";
import { Field, FieldGroup, FieldLabel } from "@crossval/ui/components/field";
import { Input } from "@crossval/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crossval/ui/components/select";
import { Separator } from "@crossval/ui/components/separator";
import { Skeleton } from "@crossval/ui/components/skeleton";
import { ChevronDown, Loader2 } from "lucide-react";

import { categories, categoryOptions, getCategoryName } from "@/lib/categories";
import { formatCurrency } from "@/lib/formatters";

import { MonthPicker } from "./month-picker";
import { useActuals } from "./use-actuals";

type ActualEntry = {
  id: string;
  categoryId: string;
  month: string;
  amountCents: number;
  note?: string;
};

type ActualGroup = {
  categoryId: string;
  month: string;
  totalCents: number;
  entries: ActualEntry[];
};

function groupActuals(actuals: ActualEntry[]) {
  const groups = new Map<string, ActualGroup>();

  for (const actual of actuals) {
    const key = `${actual.categoryId}:${actual.month}`;
    const group = groups.get(key);

    if (group) {
      group.totalCents += actual.amountCents;
      group.entries.push(actual);
    } else {
      groups.set(key, {
        categoryId: actual.categoryId,
        month: actual.month,
        totalCents: actual.amountCents,
        entries: [actual],
      });
    }
  }

  return Array.from(groups.values());
}

export function MonthlyActualCard() {
  const { actuals, isLoading, isSaving, createActual } = useActuals();
  const actualGroups = groupActuals(actuals);

  return (
    <Card className="h-full scroll-mt-20 shadow-none" id="actual-spend">
      <CardHeader className="border-b">
        <CardTitle>Log actual spend</CardTitle>
        <CardDescription>Record what was spent for a category and month.</CardDescription>
        <CardAction>
          <Badge variant="outline">Actual</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
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
            <div className="grid gap-4 sm:grid-cols-2">
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
                    <SelectGroup>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="actual-note">Note (optional)</FieldLabel>
                <Input
                  id="actual-note"
                  maxLength={500}
                  name="note"
                  placeholder="Campaign spend"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button disabled={isSaving} type="submit">
                {isSaving && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Log actual
              </Button>
            </div>
          </FieldGroup>
        </form>

        <Separator />
        <section aria-labelledby="logged-actuals-heading">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 id="logged-actuals-heading" className="text-xs font-medium">
              Logged actuals
            </h3>
            <span className="text-xs text-muted-foreground">
              {actuals.length} {actuals.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-label="Loading actuals">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
            </div>
          ) : actuals.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">No actual spend logged yet.</p>
          ) : (
            <ul className="divide-y" aria-label="Logged actual spend grouped by month">
              {actualGroups.map((group) => {
                const entryLabel = group.entries.length === 1 ? "entry" : "entries";

                return (
                  <li className="py-3" key={`${group.categoryId}:${group.month}`}>
                    <Collapsible>
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {getCategoryName(group.categoryId)}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {group.month}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-xs font-medium tabular-nums">
                            {formatCurrency(group.totalCents)}
                          </span>
                          <CollapsibleTrigger
                            render={
                              <Button
                                aria-label={`View ${group.entries.length} ${entryLabel} for ${getCategoryName(group.categoryId)} in ${group.month}`}
                                className="group"
                                size="sm"
                                variant="ghost"
                              />
                            }
                          >
                            {group.entries.length} {entryLabel}
                            <ChevronDown
                              className="transition-transform group-data-panel-open:rotate-180"
                              data-icon="inline-end"
                            />
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <Separator className="mt-2" />
                        <ul className="flex flex-col gap-2 pt-2" aria-label="Spend entries">
                          {group.entries.map((actual) => (
                            <li
                              className="flex items-start justify-between gap-4 px-3 py-1"
                              key={actual.id}
                            >
                              <p className="min-w-0 truncate text-xs text-muted-foreground">
                                {actual.note || "No note"}
                              </p>
                              <span className="shrink-0 font-mono text-xs tabular-nums">
                                {formatCurrency(actual.amountCents)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
