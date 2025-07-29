import { Loader2 } from "lucide-react"

export function Spinner({ 
  className = "",
  size = "md" 
}: { 
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "h-3 w-3 sm:h-3.5 sm:w-3.5",
    md: "h-4 w-4 sm:h-5 sm:w-5",
    lg: "h-5 w-5 sm:h-6 sm:w-6",
    xl: "h-6 w-6 sm:h-8 sm:w-8"
  };

  return (
    <div 
      role="status" 
      aria-label="Loading..."
      className={`inline-block ${className}`}
    >
      <Loader2 
        className={`${sizeClasses[size]} animate-spin text-current`} 
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}