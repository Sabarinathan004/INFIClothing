"use client"

import { useState, useEffect } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Customer } from "@/types";
import { searchCustomers } from "@/actions/customers";
import { useDebounce } from "@/hooks/use-debounce";

interface CustomerAutocompleteProps {
  value: string | null;
  onSelect: (customer: Customer | null) => void;
  error?: boolean;
}

export function CustomerAutocomplete({ value, onSelect, error }: CustomerAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Debounce to 250ms as requested
  const debouncedSearch = useDebounce(searchQuery, 250);

  useEffect(() => {
    async function fetchCustomers() {
      setIsLoading(true);
      try {
        // When search is empty or too short, load recent customers
        // When search has 2+ chars, filter by query
        const query = debouncedSearch && debouncedSearch.length >= 2 ? debouncedSearch : "";
        const data = await searchCustomers(query);
        setCustomers(data as Customer[]);
      } catch (error) {
        console.error("Failed to search customers:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      fetchCustomers();
    }
  }, [debouncedSearch, open]);

  const selectedCustomer = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12 text-base md:text-sm",
            !value && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive"
          )}
        >
          {selectedCustomer ? (
            <span className="truncate">{selectedCustomer.name}</span>
          ) : (
            "Search customer..."
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search by name, mobile, verification number..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Searching..." : "No customer found."}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue === value ? null : customer);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start py-3"
                >
                  <div className="flex w-full justify-between items-center mb-1">
                    <span className="font-medium">{customer.name}</span>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {customer.mobile && <span>{customer.mobile}</span>}
                    {customer.verification_type && customer.verification_number && (
                      <span className="uppercase">
                        {customer.verification_type}: {customer.verification_number}
                      </span>
                    )}
                    {/* Legacy fallback */}
                    {!customer.verification_number && customer.gst_number && (
                      <span className="uppercase">GST: {customer.gst_number}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
