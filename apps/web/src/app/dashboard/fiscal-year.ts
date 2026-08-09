export type MonthRange = { start: string; end: string };

export function calendarFiscalYearRange(year: number): MonthRange {
  return { start: `${year}-01`, end: `${year}-12` };
}

export function calendarFiscalYearForRange({ start, end }: MonthRange) {
  const year = Number(start.slice(0, 4));
  const fiscalRange = calendarFiscalYearRange(year);

  return start === fiscalRange.start && end === fiscalRange.end
    ? String(year)
    : "custom";
}
