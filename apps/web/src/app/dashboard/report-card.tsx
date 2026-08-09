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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@crossval/ui/components/empty";
import { Field, FieldLabel } from "@crossval/ui/components/field";
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
  ChartNoAxesColumnIncreasing,
  ChevronsUpDown,
} from "lucide-react";
import { useState } from "react";

import { getCategoryName } from "@/lib/categories";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
} from "@/lib/formatters";

import { MonthPicker } from "./month-picker";
import { MonthlyVarianceChart } from "./monthly-variance-chart";
import type { ReportRow } from "./report";
import { useReport } from "./use-report";

type SortKey =
  | "month"
  | "categoryId"
  | "planCents"
  | "actualCents"
  | "varianceCents"
  | "variancePercent";
type SortDirection = "ascending" | "descending";
type SortState = { key: SortKey; direction: SortDirection };

function sortReportRows(rows: ReportRow[], sort: SortState) {
  return [...rows].sort((left, right) => {
    const leftValue =
      sort.key === "categoryId"
        ? getCategoryName(left.categoryId)
        : left[sort.key];
    const rightValue =
      sort.key === "categoryId"
        ? getCategoryName(right.categoryId)
        : right[sort.key];

    if (leftValue === null) return rightValue === null ? 0 : 1;
    if (rightValue === null) return -1;

    const comparison =
      typeof leftValue === "string" && typeof rightValue === "string"
        ? leftValue.localeCompare(rightValue)
        : Number(leftValue) - Number(rightValue);

    return sort.direction === "ascending" ? comparison : -comparison;
  });
}

function SortableTableHead({
  align = "left",
  column,
  label,
  onSort,
  sort,
}: {
  align?: "left" | "right";
  column: SortKey;
  label: string;
  onSort: (column: SortKey) => void;
  sort: SortState;
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

export function ReportCard() {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [range, setRange] = useState({
    start: `${today.getFullYear()}-01`,
    end: currentMonth,
  });
  const [sort, setSort] = useState<SortState>({
    key: "month",
    direction: "descending",
  });
  const { rows: reportRows, isLoading } = useReport(range.start, range.end);
  const rows = sortReportRows(reportRows, sort);
  const startMonth = range.start;
  const endMonth = range.end;

  function handleSort(column: SortKey) {
    setSort((current) => ({
      key: column,
      direction:
        current.key === column && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  return (
    <Card className="scroll-mt-20 shadow-none" id="variance-report">
      <CardHeader className="border-b">
        <CardTitle>Variance report</CardTitle>
        <CardDescription>
          Plan and actual spend matched by category and month.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">{rows.length} rows</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section aria-label="Report date range" className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="report-start-month">Start month</FieldLabel>
            <MonthPicker
              id="report-start-month"
              name="startMonth"
              onValueChange={(start) =>
                setRange((current) => ({
                  start,
                  end: current.end < start ? start : current.end,
                }))
              }
              value={startMonth}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="report-end-month">End month</FieldLabel>
            <MonthPicker
              id="report-end-month"
              name="endMonth"
              onValueChange={(end) =>
                setRange((current) => ({
                  start: current.start > end ? end : current.start,
                  end,
                }))
              }
              value={endMonth}
            />
          </Field>
        </section>

        {isLoading ? (
          <div className="flex flex-col gap-2" aria-label="Loading report">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : rows.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartNoAxesColumnIncreasing />
              </EmptyMedia>
              <EmptyTitle>
                No rows in this date range
              </EmptyTitle>
              <EmptyDescription>
                Save a monthly target in the selected range to create a report row.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            <MonthlyVarianceChart rows={rows} />
            <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  column="month"
                  label="Month"
                  onSort={handleSort}
                  sort={sort}
                />
                <SortableTableHead
                  column="categoryId"
                  label="Category"
                  onSort={handleSort}
                  sort={sort}
                />
                <SortableTableHead
                  align="right"
                  column="planCents"
                  label="Plan"
                  onSort={handleSort}
                  sort={sort}
                />
                <SortableTableHead
                  align="right"
                  column="actualCents"
                  label="Actual"
                  onSort={handleSort}
                  sort={sort}
                />
                <SortableTableHead
                  align="right"
                  column="varianceCents"
                  label="Variance"
                  onSort={handleSort}
                  sort={sort}
                />
                <SortableTableHead
                  align="right"
                  column="variancePercent"
                  label="Variance %"
                  onSort={handleSort}
                  sort={sort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.categoryId}-${row.month}`}>
                  <TableCell className="font-mono text-muted-foreground">
                    {row.month}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getCategoryName(row.categoryId)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(row.planCents)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(row.actualCents)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium tabular-nums">
                    {formatSignedCurrency(row.varianceCents)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatSignedPercent(row.variancePercent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
