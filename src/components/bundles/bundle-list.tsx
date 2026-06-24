"use client"

import { Bundle } from "@/types";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BundleForm } from "./bundle-form";
import { deleteBundle, toggleBundleStatus } from "@/actions/bundles";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface BundleListProps {
  initialBundles: Bundle[];
}

export function BundleList({ initialBundles }: BundleListProps) {
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles);
  const [searchQuery, setSearchQuery] = useState("");

  // Keep local state in sync with server updates from router.refresh()
  useEffect(() => {
    setBundles(initialBundles);
  }, [initialBundles]);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | undefined>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const filteredBundles = bundles.filter(b => 
    b.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleEdit = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBundle) return;
    setIsDeleting(true);
    
    try {
      await deleteBundle(selectedBundle.id);
      setBundles(bundles.filter(b => b.id !== selectedBundle.id));
      toast.success("Bundle deleted successfully");
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete bundle");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (bundle: Bundle) => {
    try {
      await toggleBundleStatus(bundle.id, !bundle.is_active);
      setBundles(bundles.map(b => 
        b.id === bundle.id ? { ...b, is_active: !b.is_active } : b
      ));
      toast.success(`Bundle marked as ${!bundle.is_active ? 'Active' : 'Inactive'}`);
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to update bundle status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>HSN Code</TableHead>
              <TableHead className="text-right">Default Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBundles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBundles.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell className="font-medium">{bundle.name}</TableCell>
                  <TableCell>{bundle.hsn_code || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(bundle.default_price)}</TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => handleToggleStatus(bundle)}>
                      <Badge variant={bundle.is_active ? "default" : "secondary"} className="cursor-pointer hover:opacity-80">
                        {bundle.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(bundle)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(bundle)} className="text-destructive hover:text-destructive" title="Delete">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details.
            </DialogDescription>
          </DialogHeader>
          {selectedBundle && (
            <BundleForm
              bundle={selectedBundle}
              onSuccess={() => {
                setIsEditOpen(false);
                router.refresh();
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedBundle?.name}? 
              This will not affect historical invoices that used this product.
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
