"use client"

import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Bundle } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LucideIcon } from "lucide-react";

interface ProductComboboxProps {
  bundles: Bundle[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (bundle: Bundle) => void;
  onCreateCustom?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  icon?: LucideIcon;
}

export function ProductCombobox({
  bundles,
  value,
  onChange,
  onSelect,
  onCreateCustom,
  placeholder = "Select a product...",
  disabled = false,
  hasError = false,
  className,
  icon: Icon,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedBundle = bundles.find((b) => b.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-background px-3",
            !value && "text-muted-foreground",
            hasError && "border-destructive focus-visible:ring-destructive",
            Icon && "pl-9",
            className
          )}
        >
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search products..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              <p className="text-muted-foreground mb-3">No products found.</p>
              {search && (
                <Button 
                  size="sm"
                  variant="secondary"
                  className="w-[80%] mx-auto"
                  onClick={() => {
                    onChange(search);
                    if (onCreateCustom) {
                      onCreateCustom(search);
                    }
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Use "{search}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {bundles.map((bundle) => (
                <CommandItem
                  key={bundle.id}
                  value={bundle.name}
                  onSelect={() => {
                    onChange(bundle.name);
                    onSelect(bundle);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center justify-between py-2.5 cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{bundle.name}</p>
                    {bundle.hsn_code && (
                      <p className="text-xs text-muted-foreground">HSN: {bundle.hsn_code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{formatCurrency(bundle.default_price)}</span>
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary",
                        value === bundle.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
              
              {search && !bundles.find(b => b.name.toLowerCase() === search.toLowerCase()) && (
                <CommandItem
                  value={search}
                  onSelect={() => {
                    onChange(search);
                    if (onCreateCustom) {
                      onCreateCustom(search);
                    }
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center py-2.5 text-primary font-medium cursor-pointer border-t mt-1 pt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{search}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
