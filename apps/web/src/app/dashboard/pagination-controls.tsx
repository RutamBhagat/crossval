import { Button } from "@crossval/ui/components/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crossval/ui/components/select";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const limitOptions = [10, 20, 30, 40, 50].map((limit) => ({
  label: String(limit),
  value: String(limit),
}));

export function PaginationControls({
  limit,
  offset,
  onLimitChange,
  onOffsetChange,
  total,
}: {
  limit: number;
  offset: number;
  onLimitChange: (limit: number) => void;
  onOffsetChange: (offset: number) => void;
  total: number;
}) {
  const pageCount = Math.ceil(total / limit);
  const page = Math.floor(offset / limit) + 1;
  const isFirstPage = offset === 0;
  const isLastPage = page >= pageCount;

  return (
    <div className="mt-3 flex items-center justify-end border-t pt-3">
      <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Rows per page</span>
          <Select
            items={limitOptions}
            onValueChange={(value) => {
              if (value) onLimitChange(Number(value));
            }}
            value={String(limit)}
          >
            <SelectTrigger aria-label="Rows per page" className="w-16" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {limitOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <span className="min-w-16 text-center text-xs font-medium">
          Page {page} of {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Go to first page"
            className="hidden sm:inline-flex"
            disabled={isFirstPage}
            onClick={() => onOffsetChange(0)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronFirst />
          </Button>
          <Button
            aria-label="Go to previous page"
            disabled={isFirstPage}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label="Go to next page"
            disabled={isLastPage}
            onClick={() => onOffsetChange(offset + limit)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronRight />
          </Button>
          <Button
            aria-label="Go to last page"
            className="hidden sm:inline-flex"
            disabled={isLastPage}
            onClick={() => onOffsetChange((pageCount - 1) * limit)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronLast />
          </Button>
        </div>
      </div>
    </div>
  );
}
