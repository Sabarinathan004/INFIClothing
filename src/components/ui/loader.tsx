import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ 
  className, 
  size = "default", 
  text, 
  fullScreen = false,
  ...props 
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    default: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center w-full h-full min-h-[200px] p-4";

  return (
    <div className={cn(containerClasses, className)} {...props}>
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className={cn("absolute rounded-full bg-primary/20 blur-xl animate-pulse", sizeClasses[size].split(' ')[0], sizeClasses[size].split(' ')[1])} />
        {/* Spinner */}
        <Loader2 className={cn("relative animate-spin text-primary", sizeClasses[size].split(' ').slice(0, 2).join(' '))} />
      </div>
      {text && (
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
