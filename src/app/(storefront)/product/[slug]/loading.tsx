import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
        <div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-3 h-8 w-2/3" />
          <Skeleton className="mt-4 h-7 w-32" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-8 h-12 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
