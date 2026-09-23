import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => (
    <div className="p-4 sm:p-6 space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
);

export default Loading;
