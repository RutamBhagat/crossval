import Image from "next/image";
import Link from "next/link";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="flex flex-col gap-8 p-6 md:p-10">
        <Link
          className="flex w-fit items-center gap-2 font-mono text-sm font-semibold tracking-tight"
          href="/"
        >
          <Image
            alt=""
            className="size-7 shrink-0 bg-background object-contain"
            height={28}
            src="/logo.svg"
            width={28}
          />
          CrossVal
        </Link>

        <div className="flex flex-1 items-center justify-center py-6">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </section>

      <aside
        aria-label="CrossVal"
        className="hidden items-center justify-center overflow-hidden bg-primary text-primary-foreground lg:flex"
      >
        <div className="flex items-center gap-4">
          <Image
            alt=""
            className="size-12 shrink-0 bg-background object-contain"
            height={48}
            src="/logo.svg"
            width={48}
          />
          <span className="font-mono text-xl font-medium tracking-[0.32em]">
            CROSSVAL
          </span>
        </div>
      </aside>
    </main>
  );
}
