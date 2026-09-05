"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { InvoiceSchemaType } from "@/schemas/invoice";
import { Customer } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerAutocomplete } from "@/components/customers/customer-autocomplete";
import { fetchAndVerifyGST } from "@/actions/customer-actions";
import { toast } from "sonner";
import { CheckCircle2, Edit2, MapPin, ReceiptText, Building2, User } from "lucide-react";

interface CustomerSelectorProps {
  form: UseFormReturn<InvoiceSchemaType>;
  isLoading: boolean;
}

const VERIFICATION_TYPES = ["NONE", "GST", "Aadhar", "PAN"] as const;

export function CustomerSelector({ form, isLoading }: CustomerSelectorProps) {
  const { setValue, watch, formState: { errors } } = form;
  
  const customerId = watch("customer_id");
  const customerName = watch("customer_name");
  const customerAddress = watch("customer_address");
  const verificationType = watch("verification_type");

  const [activeTab, setActiveTab] = useState<string>("gst");
  const [gstInput, setGstInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLocked, setIsLocked] = useState(!!customerId || !!customerName);

  const handleFetchGST = async () => {
    if (!gstInput || gstInput.length !== 15) {
      toast.error("Please enter a valid 15-character GSTIN");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await fetchAndVerifyGST(gstInput);
      
      setValue("customer_name", result.data.name, { shouldValidate: true });
      setValue("customer_address", result.data.address || "", { shouldValidate: true });
      setValue("verification_type", "GST", { shouldValidate: true });
      setValue("verification_number", result.data.verification_number, { shouldValidate: true });
      
      if (result.data.id) {
        setValue("customer_id", result.data.id, { shouldValidate: true });
      }
      
      toast.success(`Verified & fetched successfully via ${result.source === 'api' ? 'RapidAPI' : 'Local DB'}!`);
      setIsLocked(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to verify GST");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setValue("customer_id", customer.id, { shouldValidate: true });
      setValue("customer_name", customer.name, { shouldValidate: true });
      setValue("customer_address", customer.address || "", { shouldValidate: true });
      setValue("customer_mobile", customer.mobile || "", { shouldValidate: true });
      setValue("customer_email", customer.email || "", { shouldValidate: true });
      // @ts-ignore
      setValue("verification_type", customer.verification_type || null, { shouldValidate: true });
      setValue("verification_number", customer.verification_number || "", { shouldValidate: true });
      setIsLocked(true);
    } else {
      handleClear();
    }
  };

  const handleClear = () => {
    setValue("customer_id", null);
    setValue("customer_name", "");
    setValue("customer_address", "");
    setValue("customer_mobile", "");
    setValue("customer_email", "");
    setValue("verification_type", null);
    setValue("verification_number", "");
    setIsLocked(false);
  };

  const handleManualLock = () => {
    if (!customerName) {
      toast.error("Customer Name is required");
      return;
    }
    setIsLocked(true);
  };

  if (isLocked) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              Customer Selected
            </CardTitle>
            <CardDescription className="text-primary/80 mt-1">
              {verificationType === "GST" ? "Verified Business Entity" : "Manual/Local Record"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleClear} disabled={isLoading}>
            <Edit2 className="w-4 h-4 mr-2" />
            Change
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{customerName}</p>
                {watch("verification_number") && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {verificationType}: {watch("verification_number")}
                  </p>
                )}
              </div>
            </div>
            
            {customerAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{customerAddress}</p>
              </div>
            )}
            
            {(watch("customer_email") || watch("customer_mobile")) && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {watch("customer_email")} {watch("customer_email") && watch("customer_mobile") ? '•' : ''} {watch("customer_mobile")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-primary" />
          Select Customer
        </CardTitle>
        <CardDescription>
          Verify via GSTIN, search existing records, or create manually.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="gst">Fetch GSTIN</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gst" className="space-y-4">
            <div className="space-y-2">
              <Label>GSTIN Number</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter 15-character GSTIN" 
                  value={gstInput}
                  onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                  className="uppercase font-mono flex-1"
                  disabled={isLoading || isVerifying}
                />
                <Button 
                  type="button" 
                  onClick={handleFetchGST}
                  disabled={isLoading || isVerifying || gstInput.length !== 15}
                >
                  {isVerifying ? "Verifying..." : "Fetch & Verify"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We will securely verify this GSTIN and automatically populate the customer details.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label>Search Database</Label>
              <CustomerAutocomplete
                value={customerId}
                onSelect={handleCustomerSelect}
                error={!!errors.customer_name}
              />
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={errors.customer_name ? "text-destructive" : ""}>
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input 
                  {...form.register("customer_name")} 
                  disabled={isLoading} 
                  className={errors.customer_name ? "border-destructive ring-1 ring-destructive" : ""} 
                />
                {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Verification Type</Label>
                <Select
                  value={verificationType ?? "NONE"}
                  onValueChange={(val) => {
                    // @ts-ignore
                    setValue("verification_type", val === "NONE" ? null : val);
                    setValue("verification_number", "");
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type === "NONE" ? "None" : type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {verificationType && (
                <div className="space-y-2">
                  <Label>Verification Number</Label>
                  <Input 
                    {...form.register("verification_number")} 
                    disabled={isLoading} 
                    className="uppercase"
                  />
                  {errors.verification_number && <p className="text-xs text-destructive">{errors.verification_number.message}</p>}
                </div>
              )}
              
              <div className="space-y-2 md:col-span-2">
                <Label>Billing Address</Label>
                <Input {...form.register("customer_address")} disabled={isLoading} />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={handleManualLock} disabled={isLoading || !customerName}>
                Confirm Customer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
