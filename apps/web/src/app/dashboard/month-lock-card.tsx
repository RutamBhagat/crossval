"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@crossval/ui/components/alert";
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
import { Field, FieldGroup, FieldLabel } from "@crossval/ui/components/field";
import { Separator } from "@crossval/ui/components/separator";
import { Skeleton } from "@crossval/ui/components/skeleton";
import { CalendarCheck, Lock, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { MonthPicker } from "./month-picker";
import { useLocks } from "./use-locks";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1));
}

export function MonthLockCard() {
  const [month, setMonth] = useState(currentMonth);
  const { locks, isLoading, isLocking, lockMonth } = useLocks();
  const isLocked = locks.some((lock) => lock.month === month);

  return (
    <Card className="scroll-mt-20 shadow-none" id="period-locks">
      <CardHeader className="border-b">
        <CardTitle>Close an accounting period</CardTitle>
        <CardDescription>
          Freeze targets and actual spend for a completed month.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">
            <Lock data-icon="inline-start" />
            {locks.length} {locks.length === 1 ? "period" : "periods"} closed
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_auto_minmax(0,1.15fr)] lg:gap-8">
        <section
          aria-labelledby="close-period-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
              Selected period
            </p>
            <h3 className="text-base font-medium" id="close-period-heading">
              {formatMonth(month)}
            </h3>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lock-month">Month to close</FieldLabel>
              <MonthPicker
                id="lock-month"
                name="month"
                onValueChange={setMonth}
                value={month}
              />
            </Field>
          </FieldGroup>

          <Alert>
            <ShieldAlert />
            <AlertTitle>Permanent action</AlertTitle>
            <AlertDescription>
              You cannot add or change entries after you close this period.
            </AlertDescription>
          </Alert>

          <Button
            className="w-full"
            disabled={isLoading || isLocking || isLocked}
            onClick={() => lockMonth(month)}
            type="button"
            variant={isLocked ? "secondary" : "default"}
          >
            {isLocking ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Lock data-icon="inline-start" />
            )}
            {isLocked ? "Period already closed" : `Close ${formatMonth(month)}`}
          </Button>
        </section>

        <Separator className="lg:hidden" />
        <Separator className="hidden lg:block" orientation="vertical" />

        <section
          aria-labelledby="locked-months-heading"
          className="flex min-w-0 flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                Period archive
              </p>
              <h3 className="text-base font-medium" id="locked-months-heading">
                Closed months
              </h3>
            </div>
            <CalendarCheck
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          {isLoading ? (
            <div
              className="flex flex-col gap-2"
              aria-label="Loading closed months"
            >
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : locks.length === 0 ? (
            <Empty className="min-h-28 border p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarCheck aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No closed periods</EmptyTitle>
                <EmptyDescription>
                  Closed months will appear here for reference.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul
              className="grid gap-2 sm:grid-cols-2"
              aria-label="Closed months"
            >
              {locks.map((lock) => (
                <li
                  className="flex items-center justify-between gap-3 border bg-muted/30 px-3 py-2.5"
                  key={lock.id}
                >
                  <span className="font-medium">{formatMonth(lock.month)}</span>
                  <Badge variant="secondary">
                    <Lock data-icon="inline-start" />
                    Closed
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
