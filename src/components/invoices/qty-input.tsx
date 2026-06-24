import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface QtyInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function QtyInput({ value, onChange, disabled }: QtyInputProps) {
  return (
    <div className="flex items-center w-full max-w-[110px] rounded-md border border-input bg-background overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-none bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-slate-900/50"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min="1"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full rounded-none border-0 text-center font-medium focus-visible:ring-0 focus-visible:ring-offset-0 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-none bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-slate-900/50"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
