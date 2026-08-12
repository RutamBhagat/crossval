"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@crossval/ui/components/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
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

import { getCategoryName } from "@crossval/domain/categories";
import { formatCurrency } from "@/lib/formatters";

import { useReportActuals } from "./use-report-actuals";

type SelectedReportRow = {
  categoryId: string;
  month: string;
};

export function ReportActualsDialog({
  onOpenChange,
  row,
}: {
  onOpenChange: (open: boolean) => void;
  row?: SelectedReportRow;
}) {
  const { actuals, isLoading } = useReportActuals(row?.categoryId, row?.month);

  return (
    <Dialog open={Boolean(row)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Actual spend entries</DialogTitle>
          <DialogDescription>
            {row
              ? `${getCategoryName(row.categoryId)} in ${row.month}`
              : "Entries behind the selected report total."}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div
            aria-label="Loading actual entries"
            className="flex flex-col gap-2"
          >
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
          </div>
        ) : actuals.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No actual entries</EmptyTitle>
              <EmptyDescription>
                The report treats the missing actual as zero.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table aria-label="Actual entries for report row">
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actuals.map((actual) => (
                <TableRow key={actual.id}>
                  <TableCell className="max-w-72 truncate text-muted-foreground">
                    {actual.note || "No note"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(actual.amountCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
