"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bundleSchema, BundleSchemaType } from "@/schemas/bundle";
import { Bundle } from "@/types";
import { createBundle, updateBundle } from "@/actions/bundles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

interface BundleFormProps {
  bundle?: Bundle;
  onSuccess: (data?: any) => void;
  onCancel: () => void;
}

export function BundleForm({ bundle, onSuccess, onCancel }: BundleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!bundle;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BundleSchemaType>({
    resolver: zodResolver(bundleSchema) as any,
    defaultValues: {
      name: bundle?.name || "",
      hsn_code: bundle?.hsn_code || "",
      default_price: bundle?.default_price || 0,
      is_active: bundle?.is_active ?? true,
    },
  });

  const onSubmit = async (data: BundleSchemaType) => {
    setIsLoading(true);

    try {
      if (isEditing && bundle) {
        const result = await updateBundle(bundle.id, data);
        toast.success("Product updated successfully");
        onSuccess(result.data);
      } else {
        const result = await createBundle(data);
        toast.success("Product created successfully");
        onSuccess(result.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          placeholder="e.g. Mixed Kids Wear"
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hsn_code">HSN Code</Label>
        <Input
          id="hsn_code"
          placeholder="e.g. 6111"
          {...register("hsn_code")}
          disabled={isLoading}
        />
        {errors.hsn_code && <p className="text-sm text-destructive">{errors.hsn_code.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="default_price">Default Price (₹) <span className="text-destructive">*</span></Label>
        <Input
          id="default_price"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("default_price")}
          disabled={isLoading}
        />
        {errors.default_price && <p className="text-sm text-destructive">{errors.default_price.message}</p>}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="is_active"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          {...register("is_active")}
          disabled={isLoading}
        />
        <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Product"}
        </Button>
      </DialogFooter>
    </form>
  );
}
