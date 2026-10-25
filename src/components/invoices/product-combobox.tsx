"use client"

import { useState, useEffect } from "react";
import { Check, ChevronDown, Plus, Package } from "lucide-react";
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
import { searchBundles } from "@/actions/bundles";
import { useDebounce } from "@/hooks/use-debounce";

interface ProductComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (bundle: Bundle) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  icon?: LucideIcon;
}

export function ProductCombobox({
  value,
  onChange,
  onSelect,
  placeholder = "Search bundle or type custom name...",
  disabled = false,
  hasError = false,
  className,
  icon: Icon,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 200);

  useEffect(() => {
    async function fetchBundles() {
      setIsLoading(true);
      try {
        const data = await searchBundles(debouncedSearch);
        setBundles(data as unknown as Bundle[]);
      } catch (error) {
        console.error("Failed to search bundles:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      fetchBundles();
    } else {
      setBundles([]);
    }
  }, [debouncedSearch, open]);

  const handleSelectCustom = (customName: string) => {
    const clean = customName.trim();
    if (!clean) return;
    onChange(clean);
    onSelect({
      id: "",
      name: clean,
      hsn_code: "",
      unit: "BDL",
      default_price: 0,
      is_active: true,
      created_at: "",
      updated_at: "",
    });
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-background px-3 h-10 text-left",
            !value && "text-muted-foreground",
            hasError && "border-destructive focus-visible:ring-destructive",
            Icon && "pl-9",
            className
          )}
        >
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate font-semibold text-foreground text-sm">
            {value || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type product name or search..." 
            value={search}
            onValueChange={setSearch}
            className="h-10 text-sm"
          />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-center text-sm px-3">
              <p className="text-muted-foreground mb-2 text-xs">
                {isLoading ? "Searching bundles..." : "No existing product matches."}
              </p>
              {search && !isLoading && (
                <Button 
                  size="sm"
                  type="button"
                  variant="default"
                  className="w-full text-xs font-bold"
                  onClick={() => handleSelectCustom(search)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Use custom product "{search}"
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
                  className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-accent"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-sm text-foreground truncate">{bundle.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {bundle.hsn_code && <span>HSN: {bundle.hsn_code}</span>}
                      {bundle.unit && <span>• {bundle.unit}</span>}
                      {typeof bundle.current_stock === 'number' && (
                        <span className={cn(
                          "px-1.5 py-0.2 rounded text-[10px] font-semibold",
                          bundle.current_stock > 10 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        )}>
                          Stock: {bundle.current_stock}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(bundle.default_price)}
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary",
                        value === bundle.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
              
              {search && !isLoading && !bundles.some(b => b.name.toLowerCase() === search.toLowerCase()) && (
                <CommandItem
                  value={search}
                  onSelect={() => handleSelectCustom(search)}
                  className="flex items-center py-2.5 px-3 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer border-t"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{search}" as new product
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
