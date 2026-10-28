"use client"

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerSchemaType } from "@/schemas/customer";
import { Customer } from "@/types";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VERIFICATION_PLACEHOLDERS: Record<string, string> = {
  GST: "33ABCDE1234F1Z5",
  Aadhar: "123412341234",
  PAN: "ABCDE1234F",
};

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: (data?: any) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!customer;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerSchemaType>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: customer?.name || "",
      trade_name: customer?.trade_name || customer?.name || "",
      legal_name: customer?.legal_name || customer?.name || "",
      pan_number: customer?.pan_number || "",
      place_of_supply: customer?.place_of_supply || "",
      mobile: customer?.mobile || "",
      email: customer?.email || "",
      address: customer?.address || "",
      verification_type: customer?.verification_type || undefined,
      verification_number: customer?.verification_number || "",
    },
  });

  const watchVerificationType = watch("verification_type");

  const onSubmit = async (data: CustomerSchemaType) => {
    setIsLoading(true);

    try {
      if (isEditing && customer) {
        const result = await updateCustomer(customer.id, data);
        toast.success("Customer updated successfully");
        onSuccess(result.data);
      } else {
        const result = await createCustomer(data);
        toast.success("Customer created successfully");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            placeholder=""
            {...register("name")}
            onChange={(e) => {
              register("name").onChange(e);
              setValue("legal_name", e.target.value);
            }}
            disabled={isLoading}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade_name">Company Name</Label>
          <Input
            id="trade_name"
            placeholder=""
            {...register("trade_name")}
            disabled={isLoading}
          />
        </div>
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
      </div>

      {/* Verification Details */}
      <div className="space-y-3 pt-2 border-t">
        <p className="text-sm font-medium text-foreground">Verification Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="verification_type">
              Verification Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="verification_type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="verification_type" className={errors.verification_type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GST">GST</SelectItem>
                    <SelectItem value="Aadhar">Aadhar</SelectItem>
                    <SelectItem value="PAN">PAN</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.verification_type && (
              <p className="text-sm text-destructive">{errors.verification_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification_number">
              Verification Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="verification_number"
              placeholder={
                watchVerificationType
                  ? VERIFICATION_PLACEHOLDERS[watchVerificationType]
                  : "Select type first..."
              }
              className={`uppercase ${errors.verification_number ? "border-destructive" : ""}`}
              {...register("verification_number")}
              disabled={isLoading || !watchVerificationType}
            />
            {errors.verification_number && (
              <p className="text-sm text-destructive">{errors.verification_number.message}</p>
            )}
          </div>
        </div>
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
