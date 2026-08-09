"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@crossval/ui/components/chart";
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis } from "recharts";

import { formatSignedCurrency } from "@/lib/formatters";

import { buildMonthlyVariance, type ReportRow } from "./report";

const chartConfig = {
  varianceCents: {
    label: "Net variance",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function MonthlyVarianceChart({ rows }: { rows: ReportRow[] }) {
  const data = buildMonthlyVariance(rows);

  return (
    <section aria-labelledby="monthly-variance-heading" className="flex flex-col gap-3">
      <header>
        <h3 className="text-sm font-medium" id="monthly-variance-heading">
          Monthly net variance
        </h3>
        <p className="text-sm text-muted-foreground">
          Actual minus plan across all categories in the selected range.
        </p>
      </header>
      <ChartContainer
        aria-label="Monthly net variance chart"
        className="h-64 w-full"
        config={chartConfig}
      >
        <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="month"
            tickLine={false}
            tickMargin={8}
          />
          <ReferenceLine y={0} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex min-w-36 items-center justify-between gap-4">
                    <span className="text-muted-foreground">Net variance</span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatSignedCurrency(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="varianceCents"
            fill="var(--color-varianceCents)"
            radius={4}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
