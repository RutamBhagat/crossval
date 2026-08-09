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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crossval/ui/components/select";
import { Separator } from "@crossval/ui/components/separator";
import { Skeleton } from "@crossval/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@crossval/ui/components/table";
import { cn } from "@crossval/ui/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";

import { getCategoryName } from "@/lib/categories";
import { formatCurrency } from "@/lib/formatters";

import { MonthLockStatus } from "./month-lock-status";
import { MonthPicker } from "./month-picker";
import { PaginationControls } from "./pagination-controls";
import { useLocks } from "./use-locks";
import { useCategories } from "./use-categories";
import {
  type PlanSortDirection,
  type PlanSortKey,
  usePlans,
} from "./use-plans";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function PlanTableHead({
  align = "left",
  column,
  label,
  onSort,
  sort,
}: {
  align?: "left" | "right";
  column: PlanSortKey;
  label: string;
  onSort: (column: PlanSortKey) => void;
  sort: { key: PlanSortKey; direction: PlanSortDirection };
}) {
  const isActive = sort.key === column;
  const SortIcon = isActive
    ? sort.direction === "ascending"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <TableHead
      aria-sort={isActive ? sort.direction : "none"}
      className={cn(align === "right" && "text-right")}
    >
      <Button
        className={cn("-mx-2", align === "right" && "ml-auto")}
        onClick={() => onSort(column)}
        size="sm"
        type="button"
        variant="ghost"
      >
        {label}
        <SortIcon data-icon="inline-end" />
      </Button>
    </TableHead>
  );
}

export function MonthlyPlanCard() {
  const [month, setMonth] = useState(currentMonth);
  const [pagination, setPagination] = useState({ offset: 0, limit: 10 });
  const [sort, setSort] = useState<{
    key: PlanSortKey;
    direction: PlanSortDirection;
  }>({ key: "month", direction: "descending" });
  const { categories } = useCategories();
  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));
  const { plans, total, isLoading, isSaving, savePlan } = usePlans(
    pagination.offset,
    pagination.limit,
    sort.key,
    sort.direction,
  );
  const { locks, isLoading: locksAreLoading } = useLocks();
  const monthIsLocked = locks.some((lock) => lock.month === month);
  const visiblePlans = plans;

  function handleSort(column: PlanSortKey) {
    setPagination((current) => ({ ...current, offset: 0 }));
    setSort((current) => ({
      key: column,
      direction:
        current.key === column && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  return (
    <Card className="h-full scroll-mt-20 shadow-none" id="monthly-plan">
      <CardHeader className="border-b">
        <CardTitle>Set a monthly plan</CardTitle>
        <CardDescription>Choose a category, month, and target amount.</CardDescription>
        <CardAction>
          <Badge variant="outline">Plan</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="plan-month">Month</FieldLabel>
                <MonthPicker
                  id="plan-month"
                  name="month"
                  onValueChange={setMonth}
                  value={month}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="plan-amount">Target amount</FieldLabel>
                <Input
                  disabled={monthIsLocked}
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
            <Field>
              <FieldLabel htmlFor="plan-category">Category</FieldLabel>
              <Select
                defaultValue={categories[0]?.id}
                disabled={monthIsLocked}
                items={categoryOptions}
                name="categoryId"
                required
              >
                <SelectTrigger id="plan-category">
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
            <div className="flex items-center justify-between gap-4">
              {monthIsLocked && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MonthLockStatus locked />
                  This month is read-only.
                </p>
              )}
              <Button
                className="ml-auto"
                disabled={isSaving || locksAreLoading || monthIsLocked}
                type="submit"
              >
                {isSaving && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Save target
              </Button>
            </div>
          </FieldGroup>
        </form>

        <Separator />
        <section aria-labelledby="saved-targets-heading">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 id="saved-targets-heading" className="text-xs font-medium">
              Saved targets
            </h3>
            <span className="font-mono text-xs text-muted-foreground">{total}</span>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-label="Loading targets">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
            </div>
          ) : plans.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">No monthly targets yet.</p>
          ) : (
            <Table aria-label="Saved monthly targets">
              <TableHeader>
                <TableRow>
                  <PlanTableHead
                    column="month"
                    label="Month"
                    onSort={handleSort}
                    sort={sort}
                  />
                  <PlanTableHead
                    column="category"
                    label="Category"
                    onSort={handleSort}
                    sort={sort}
                  />
                  <PlanTableHead
                    align="right"
                    column="amount"
                    label="Target"
                    onSort={handleSort}
                    sort={sort}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePlans.map((plan) => {
                  const isLocked = locks.some((lock) => lock.month === plan.month);

                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MonthLockStatus locked={isLocked} />
                          {plan.month}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getCategoryName(plan.categoryId)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium tabular-nums">
                        {formatCurrency(plan.amountCents)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {total > 0 && (
            <PaginationControls
              limit={pagination.limit}
              offset={pagination.offset}
              onLimitChange={(limit) => setPagination({ limit, offset: 0 })}
              onOffsetChange={(offset) =>
                setPagination((current) => ({ ...current, offset }))
              }
              total={total}
            />
          )}
        </section>
      </CardContent>
    </Card>
  );
}
