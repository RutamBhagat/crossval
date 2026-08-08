"use client";

import { Badge } from "@crossval/ui/components/badge";
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
import { Skeleton } from "@crossval/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@crossval/ui/components/table";
import { ChartNoAxesColumnIncreasing } from "lucide-react";

import { getCategoryName } from "@/lib/categories";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
} from "@/lib/formatters";

import { buildReportRows } from "./report";
import { useActuals } from "./use-actuals";
import { usePlans } from "./use-plans";

export function ReportCard() {
  const { plans, isLoading: plansAreLoading } = usePlans();
  const { actuals, isLoading: actualsAreLoading } = useActuals();
  const rows = buildReportRows(plans, actuals);
  const isLoading = plansAreLoading || actualsAreLoading;

  return (
    <Card className="scroll-mt-20 shadow-xs lg:col-span-2" id="variance-report">
      <CardHeader className="border-b">
        <CardTitle>Variance report</CardTitle>
        <CardDescription>
          Plan and actual spend matched by category and month.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">{rows.length} rows</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2" aria-label="Loading report">
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
              <EmptyTitle>No report rows yet</EmptyTitle>
              <EmptyDescription>
                Save a target and log actual spend for the same category and month.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Plan</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Variance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.categoryId}-${row.month}`}>
                  <TableCell className="font-medium">
                    {getCategoryName(row.categoryId)}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {row.month}
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
        )}
      </CardContent>
    </Card>
  );
}
