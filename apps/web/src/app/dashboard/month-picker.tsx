"use client";

import { Button } from "@crossval/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@crossval/ui/components/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const months = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2026, month)),
);

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

type MonthPickerProps = {
  id: string;
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function MonthPicker({ id, name, value, onValueChange }: MonthPickerProps) {
  const [internalValue, setInternalValue] = useState(currentMonth);
  const selectedValue = value ?? internalValue;
  const selectedYear = Number(selectedValue.slice(0, 4));
  const selectedMonth = Number(selectedValue.slice(5, 7)) - 1;
  const [year, setYear] = useState(selectedYear);
  const [open, setOpen] = useState(false);

  function selectMonth(month: number) {
    const nextValue = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setYear(selectedYear);
      }}
      open={open}
    >
      <input name={name} type="hidden" value={selectedValue} />
      <PopoverTrigger
        render={
          <Button
            className="w-full justify-start font-normal"
            id={id}
            type="button"
            variant="outline"
          />
        }
      >
        <CalendarDays />
        {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
          new Date(selectedYear, selectedMonth),
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="flex items-center justify-between">
          <Button
            aria-label="Previous year"
            onClick={() => setYear((current) => current - 1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ChevronLeft />
          </Button>
          <span className="font-medium">{year}</span>
          <Button
            aria-label="Next year"
            onClick={() => setYear((current) => current + 1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {months.map((month, index) => (
            <Button
              key={month}
              onClick={() => selectMonth(index)}
              type="button"
              variant={year === selectedYear && index === selectedMonth ? "default" : "ghost"}
            >
              {month}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
