import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-100 dark:bg-gray-800 rounded-md",
        "h-4 w-full min-w-[20px]",
        className
      )}
      {...props}
    />
  );
}
