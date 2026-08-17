"use client";

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
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Loader2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import { categories, categoryOptions, getCategoryName } from "@crossval/domain/categories";
import { formatCurrency } from "@/lib/formatters";

import { MonthLockStatus } from "./month-lock-status";
import { MonthPicker } from "./month-picker";
import { PaginationControls } from "./pagination-controls";
import {
  type ActualSortDirection,
  type ActualSortKey,
  useActuals,
} from "./use-actuals";
import { useLocks } from "./use-locks";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function ActualTableHead({
  align = "left",
  column,
  label,
  onSort,
  sort,
}: {
  align?: "left" | "right";
  column: ActualSortKey;
  label: string;
  onSort: (column: ActualSortKey) => void;
  sort: { key: ActualSortKey; direction: ActualSortDirection };
}) {
  const isActive = sort.key === column;
  const isAscending = sort.direction === 1;
  const SortIcon = isActive
    ? isAscending
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <TableHead
      aria-sort={isActive ? (isAscending ? "ascending" : "descending") : "none"}
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

export function MonthlyActualCard() {
  const [month, setMonth] = useState(currentMonth);
  const [pagination, setPagination] = useState({ offset: 0, limit: 10 });
  const [sort, setSort] = useState<{
    key: ActualSortKey;
    direction: ActualSortDirection;
  }>({ key: "month", direction: -1 });
  const {
    actuals,
    total,
    isImporting,
    isLoading,
    isSaving,
    createActual,
    importActuals,
  } = useActuals(pagination.offset, pagination.limit, sort.key, sort.direction);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { locks, isLoading: locksAreLoading } = useLocks();
  const monthIsLocked = locks.some((lock) => lock.month === month);

  function handleSort(column: ActualSortKey) {
    setPagination((current) => ({ ...current, offset: 0 }));
    setSort((current) => ({
      key: column,
      direction:
        current.key === column && current.direction === 1 ? -1 : 1,
    }));
  }

  return (
    <Card className="h-full scroll-mt-20 shadow-none" id="actual-spend">
      <CardHeader className="border-b">
        <CardTitle>Log actual spend</CardTitle>
        <CardDescription>
          Record what was spent for a category and month.
        </CardDescription>
        <CardAction>
          <Input
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (!file) return;

              void importActuals(file)
                .catch(() => undefined)
                .finally(() => {
                  input.value = "";
                });
            }}
            ref={importInputRef}
            type="file"
          />
          <Button
            disabled={isImporting}
            onClick={() => importInputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            {isImporting ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            Import CSV
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const note = String(form.get("note")).trim();
            const category = categories.find(
              ({ id }) => id === String(form.get("categoryId")),
            );
            if (!category) return;

            createActual({
              categoryId: category.id,
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
                <MonthPicker
                  id="actual-month"
                  name="month"
                  onValueChange={setMonth}
                  value={month}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="actual-amount">Amount spent</FieldLabel>
                <Input
                  disabled={monthIsLocked}
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
                  disabled={monthIsLocked}
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
                  disabled={monthIsLocked}
                  id="actual-note"
                  maxLength={500}
                  name="note"
                  placeholder="Campaign spend"
                />
              </Field>
            </div>
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
                {isSaving && (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                )}
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
              {total} {total === 1 ? "entry" : "entries"}
            </span>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-label="Loading actuals">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
            </div>
          ) : actuals.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">
              No actual spend logged yet.
            </p>
          ) : (
            <Table aria-label="Logged actual spend">
              <TableHeader>
                <TableRow>
                  <ActualTableHead
                    column="month"
                    label="Month"
                    onSort={handleSort}
                    sort={sort}
                  />
                  <ActualTableHead
                    column="categoryId"
                    label="Category"
                    onSort={handleSort}
                    sort={sort}
                  />
                  <ActualTableHead
                    column="note"
                    label="Note"
                    onSort={handleSort}
                    sort={sort}
                  />
                  <ActualTableHead
                    align="right"
                    column="amountCents"
                    label="Actual"
                    onSort={handleSort}
                    sort={sort}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {actuals.map((actual) => (
                  <TableRow key={actual.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MonthLockStatus
                          locked={locks.some(
                            (lock) => lock.month === actual.month,
                          )}
                        />
                        {actual.month}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getCategoryName(actual.categoryId)}
                    </TableCell>
                    <TableCell
                      className="max-w-44 truncate text-muted-foreground"
                      title={actual.note || "No note"}
                    >
                      {actual.note || "No note"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium tabular-nums">
                      {formatCurrency(actual.amountCents)}
                    </TableCell>
                  </TableRow>
                ))}
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
