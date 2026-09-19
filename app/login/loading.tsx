import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => (
    <div className="min-h-[100dvh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
);

export default Loading;
