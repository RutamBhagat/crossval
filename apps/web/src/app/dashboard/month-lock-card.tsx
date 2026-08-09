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
import { Skeleton } from "@crossval/ui/components/skeleton";
import { Lock, Loader2 } from "lucide-react";
import { useState } from "react";

import { MonthPicker } from "./month-picker";
import { useLocks } from "./use-locks";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthLockCard() {
  const [month, setMonth] = useState(currentMonth);
  const { locks, isLoading, isLocking, lockMonth } = useLocks();
  const isLocked = locks.some((lock) => lock.month === month);

  return (
    <Card className="scroll-mt-20 shadow-none" id="period-locks">
      <CardHeader className="border-b">
        <CardTitle>Lock a month</CardTitle>
        <CardDescription>
          Close a monthly period. Unlocking is not available.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">Monthly</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="lock-month">Month</FieldLabel>
            <MonthPicker
              id="lock-month"
              name="month"
              onValueChange={setMonth}
              value={month}
            />
          </Field>
        </FieldGroup>
        <Button
          disabled={isLoading || isLocking || isLocked}
          onClick={() => lockMonth(month)}
          type="button"
        >
          {isLocking ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Lock data-icon="inline-start" />
          )}
          {isLocked ? "Month locked" : "Lock month"}
        </Button>
        <section aria-labelledby="locked-months-heading">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 className="text-xs font-medium" id="locked-months-heading">
              Locked months
            </h3>
            <span className="font-mono text-xs text-muted-foreground">{locks.length}</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : locks.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">No months are locked.</p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Locked months">
              {locks.map((lock) => (
                <li key={lock.id}>
                  <Badge variant="secondary">{lock.month}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
