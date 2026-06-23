"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerSchemaType } from "@/schemas/customer";
import { Customer } from "@/types";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerSchemaType>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: customer?.name || "",
      mobile: customer?.mobile || "",
      email: customer?.email || "",
      gst_number: customer?.gst_number || "",
      address: customer?.address || "",
    },
  });

  const onSubmit = async (data: CustomerSchemaType) => {
    setIsLoading(true);

    try {
      if (isEditing && customer) {
        await updateCustomer(customer.id, data);
        toast.success("Customer updated successfully");
      } else {
        await createCustomer(data);
        toast.success("Customer created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Business / Customer Name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          placeholder="Raj Textiles"
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number</Label>
          <Input
            id="mobile"
            placeholder="9876543210"
            {...register("mobile")}
            disabled={isLoading}
          />
          {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gst_number">GST Number</Label>
          <Input
            id="gst_number"
            placeholder="29ABCDE1234F2Z5"
            className="uppercase"
            {...register("gst_number")}
            disabled={isLoading}
          />
          {errors.gst_number && <p className="text-sm text-destructive">{errors.gst_number.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="contact@rajtextiles.com"
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="123 Market Street, City"
          {...register("address")}
          disabled={isLoading}
        />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Customer"}
        </Button>
      </DialogFooter>
    </form>
  );
}
