"use client"

import { Customer } from "@/types";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Search, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import { deleteCustomer } from "@/actions/customers";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";

interface CustomerListProps {
  initialCustomers: Customer[];
}

export function CustomerList({ initialCustomers }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");

  // Keep local state in sync with server updates from router.refresh()
  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  // Simple client-side filtering for MVP speed
  const filteredCustomers = customers.filter(c => {
    const query = debouncedSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.mobile && c.mobile.includes(query)) ||
      (c.gst_number && c.gst_number.toLowerCase().includes(query))
    );
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;
    setIsDeleting(true);
    
    try {
      await deleteCustomer(selectedCustomer.id);
      setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
      toast.success("Customer deleted successfully");
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, mobile, or GST..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>GST Number</TableHead>
              <TableHead>City/Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.mobile || "-"}</TableCell>
                  <TableCell className="uppercase">{customer.gst_number || "-"}</TableCell>
                  <TableCell className="truncate max-w-[200px]">
                    {customer.address || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild title="View Ledger">
                        <Link href={`/customers/${customer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(customer)} className="text-destructive hover:text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer details.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              customer={selectedCustomer}
              onSuccess={(updatedCustomer) => {
                setIsEditOpen(false);
                if (updatedCustomer) {
                  setCustomers(prev => 
                    prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
                  );
                }
                router.refresh(); // Still refresh to ensure sync
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.
              If this customer has existing invoices, the deletion will fail.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
