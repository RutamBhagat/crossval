"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@crossval/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@crossval/ui/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@crossval/ui/components/table";

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
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Plan vs actual</CardTitle>
        <CardDescription>
          Compare targets with logged spend for the same category and month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading report…</p>
        ) : rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
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
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.planCents)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.actualCents)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatSignedCurrency(row.varianceCents)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
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
