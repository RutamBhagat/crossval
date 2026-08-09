import { Lock, LockOpen } from "lucide-react";

export function MonthLockStatus({ locked }: { locked: boolean }) {
  const label = locked ? "Locked month" : "Open month";
  const Icon = locked ? Lock : LockOpen;

  return (
    <span
      aria-label={label}
      className="inline-flex shrink-0 text-muted-foreground"
      title={label}
    >
      <Icon aria-hidden="true" className="size-3" />
    </span>
  );
}
