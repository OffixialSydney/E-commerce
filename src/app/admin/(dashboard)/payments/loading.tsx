import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPaymentsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-navy/10 bg-white p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="mt-4 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
