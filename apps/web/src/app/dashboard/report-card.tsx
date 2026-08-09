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
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
} from "lucide-react";
import { useState } from "react";

import { getCategoryName } from "@/lib/categories";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
} from "@/lib/formatters";

import {
  calendarFiscalYearForRange,
  calendarFiscalYearRange,
} from "./fiscal-year";
import { MonthPicker } from "./month-picker";
import { MonthlyVarianceChart } from "./monthly-variance-chart";
import { PaginationControls } from "./pagination-controls";
import { ReportActualsDialog } from "./report-actuals-dialog";
import {
  type ReportSortDirection,
  type ReportSortKey,
  useReport,
} from "./use-report";

type SortState = { key: ReportSortKey; direction: ReportSortDirection };

function SortableTableHead({
  align = "left",
  column,
  label,
  onSort,
  sort,
}: {
  align?: "left" | "right";
  column: ReportSortKey;
  label: string;
  onSort: (column: ReportSortKey) => void;
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
  const [range, setRange] = useState(() =>
    calendarFiscalYearRange(today.getFullYear()),
  );
  const [pagination, setPagination] = useState({ offset: 0, limit: 10 });
  const [sort, setSort] = useState<SortState>({
    key: "month",
    direction: "descending",
  });
  const [selectedRow, setSelectedRow] = useState<{
    categoryId: string;
    month: string;
  }>();
  const { rows, monthlyVariance, total, isLoading } = useReport(
    range.start,
    range.end,
    pagination.offset,
    pagination.limit,
    sort.key,
    sort.direction,
  );
  const startMonth = range.start;
  const endMonth = range.end;
  const fiscalYear = calendarFiscalYearForRange(range);
  const rangeYear = Number(startMonth.slice(0, 4));
  const displayedFiscalYear =
    fiscalYear === "custom" ? rangeYear : Number(fiscalYear);

  function selectFiscalYear(year: number) {
    setPagination((current) => ({ ...current, offset: 0 }));
    setRange(calendarFiscalYearRange(year));
  }

  function handleSort(column: ReportSortKey) {
    setPagination((current) => ({ ...current, offset: 0 }));
    setSort((current) => ({
      key: column,
      direction:
        current.key === column && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  function exportReport() {
    const query = new URLSearchParams({
      start: startMonth,
      end: endMonth,
      sort: sort.key,
      direction: sort.direction,
    });

    window.location.assign(`/api/reports/export?${query}`);
  }

  return (
    <Card className="scroll-mt-20 shadow-none" id="variance-report">
      <CardHeader className="border-b">
        <CardTitle>Variance report</CardTitle>
        <CardDescription>
          Plan and actual spend matched by category and month.
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{total} rows</Badge>
            <Button
              disabled={isLoading || total === 0}
              onClick={exportReport}
              size="sm"
              type="button"
              variant="outline"
            >
              <Download data-icon="inline-start" />
              Export CSV
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section
          aria-label="Report date range"
          className="grid gap-4 sm:grid-cols-3"
        >
          <Field>
            <FieldLabel>Fiscal year (Jan–Dec)</FieldLabel>
            <div className="grid grid-cols-[auto_1fr_auto]">
              <Button
                aria-label={`Show fiscal year ${displayedFiscalYear - 1}`}
                className="rounded-r-none"
                onClick={() => selectFiscalYear(displayedFiscalYear - 1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronLeft />
              </Button>
              <div className="flex items-center justify-center border-y text-sm font-medium tabular-nums">
                {fiscalYear === "custom" ? "Custom range" : fiscalYear}
              </div>
              <Button
                aria-label={`Show fiscal year ${displayedFiscalYear + 1}`}
                className="rounded-l-none"
                onClick={() => selectFiscalYear(displayedFiscalYear + 1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronRight />
              </Button>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="report-start-month">Start month</FieldLabel>
            <MonthPicker
              id="report-start-month"
              name="startMonth"
              onValueChange={(start) => {
                setPagination((current) => ({ ...current, offset: 0 }));
                setRange((current) => ({
                  start,
                  end: current.end < start ? start : current.end,
                }));
              }}
              value={startMonth}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="report-end-month">End month</FieldLabel>
            <MonthPicker
              id="report-end-month"
              name="endMonth"
              onValueChange={(end) => {
                setPagination((current) => ({ ...current, offset: 0 }));
                setRange((current) => ({
                  start: current.start > end ? end : current.start,
                  end,
                }));
              }}
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
              <EmptyTitle>No rows in this date range</EmptyTitle>
              <EmptyDescription>
                Save a monthly plan or actual entry in the selected range to
                create a report row.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            <MonthlyVarianceChart data={monthlyVariance} />
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
                    column="category"
                    label="Category"
                    onSort={handleSort}
                    sort={sort}
                  />
                  <SortableTableHead
                    align="right"
                    column="target"
                    label="Plan"
                    onSort={handleSort}
                    sort={sort}
                  />
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Variance %</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        aria-label={`Show actual entries for ${getCategoryName(row.categoryId)} in ${row.month}`}
                        className="-my-2 -mr-2 ml-auto"
                        onClick={() =>
                          setSelectedRow({
                            categoryId: row.categoryId,
                            month: row.month,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <span className="font-mono tabular-nums">
                          {formatCurrency(row.actualCents)}
                        </span>
                      </Button>
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
            <PaginationControls
              limit={pagination.limit}
              offset={pagination.offset}
              onLimitChange={(limit) => setPagination({ limit, offset: 0 })}
              onOffsetChange={(offset) =>
                setPagination((current) => ({ ...current, offset }))
              }
              total={total}
            />
          </div>
        )}
      </CardContent>
      <ReportActualsDialog
        onOpenChange={(open) => {
          if (!open) setSelectedRow(undefined);
        }}
        row={selectedRow}
      />
    </Card>
  );
}
