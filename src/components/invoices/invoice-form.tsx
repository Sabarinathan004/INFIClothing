"use client"

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceSchemaType } from "@/schemas/invoice";
import { Bundle, Customer } from "@/types";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CustomerAutocomplete } from "@/components/customers/customer-autocomplete";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ReceiptText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toDateInputValue, formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceDetailsView } from "@/components/invoices/invoice-details-view";
import { Eye, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface InvoiceFormProps {
  bundles: Bundle[];
  defaultGstRate: number;
  initialData?: any;
  invoiceId?: string;
  settings?: any;
}

export function InvoiceForm({ bundles, defaultGstRate, initialData, invoiceId, settings }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceSchemaType>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: initialData ? {
      invoice_date: initialData.invoice_date,
      customer_id: initialData.customer_id,
      customer_name: initialData.customer_name,
      customer_mobile: initialData.customer_mobile || "",
      customer_email: initialData.customer_email || "",
      customer_gst: initialData.customer_gst || "",
      customer_address: initialData.customer_address || "",
      items: initialData.items.map((item: any) => ({
        bundle_name: item.bundle_name,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      gst_rate: initialData.gst_rate,
      notes: initialData.notes || "",
      status: initialData.status,
    } : {
      invoice_date: toDateInputValue(),
      customer_id: null,
      customer_name: "",
      customer_mobile: "",
      customer_email: "",
      customer_gst: "",
      customer_address: "",
      items: [{ bundle_name: "", quantity: 1, rate: 0, amount: 0 }],
      gst_rate: defaultGstRate,
      notes: "",
      status: "unpaid",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchGstRate = watch("gst_rate");
  const watchAll = watch();

  // Calculate totals
  const subtotal = watchItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const gstAmount = (subtotal * Number(watchGstRate)) / 100;
  const grandTotal = subtotal + gstAmount;

  const previewInvoiceData = {
    invoice_number: initialData?.invoice_number || "PREVIEW",
    invoice_date: watchAll.invoice_date,
    customer_name: watchAll.customer_name || "Customer Name",
    customer_mobile: watchAll.customer_mobile,
    customer_email: watchAll.customer_email,
    customer_gst: watchAll.customer_gst,
    customer_address: watchAll.customer_address,
    items: watchAll.items,
    subtotal,
    gst_rate: watchAll.gst_rate,
    gst_amount: gstAmount,
    grand_total: grandTotal,
    paid_amount: initialData?.paid_amount || 0,
    balance_amount: grandTotal - (initialData?.paid_amount || 0),
    payment_status: watchAll.status,
    notes: watchAll.notes
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setValue("customer_id", customer.id);
      setValue("customer_name", customer.name);
      setValue("customer_mobile", customer.mobile || "");
      setValue("customer_email", customer.email || "");
      setValue("customer_gst", customer.gst_number || "");
      setValue("customer_address", customer.address || "");
    } else {
      setValue("customer_id", null);
      setValue("customer_name", "");
      setValue("customer_mobile", "");
      setValue("customer_email", "");
      setValue("customer_gst", "");
      setValue("customer_address", "");
    }
  };

  const handleBundleSelect = (index: number, bundleId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (bundle) {
      const quantity = Number(watchItems[index].quantity) || 1;
      setValue(`items.${index}.bundle_name`, bundle.name);
      setValue(`items.${index}.rate`, bundle.default_price);
      setValue(`items.${index}.amount`, bundle.default_price * quantity);
    }
  };

  const calculateAmount = (index: number) => {
    const quantity = Number(watchItems[index].quantity) || 0;
    const rate = Number(watchItems[index].rate) || 0;
    setValue(`items.${index}.amount`, quantity * rate);
  };

  const onSubmit = async (data: InvoiceSchemaType, status: 'draft' | 'unpaid') => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }
    
    setIsLoading(true);
    try {
      data.status = status;
      let result;
      if (invoiceId) {
        result = await updateInvoice(invoiceId, data);
        toast.success("Invoice updated successfully");
      } else {
        result = await createInvoice(data);
        toast.success("Invoice created successfully");
      }
      router.push(`/invoices/${result.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${invoiceId ? 'update' : 'create'} invoice`);
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6 lg:space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Date Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-primary" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    {...register("invoice_date")}
                    disabled={isLoading}
                  />
                  {errors.invoice_date && (
                    <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Search Customer</Label>
                  <CustomerAutocomplete 
                    value={watch("customer_id")} 
                    onSelect={handleCustomerSelect} 
                    error={!!errors.customer_name}
                  />
                  {errors.customer_name && (
                    <p className="text-sm text-destructive">Please select or enter a customer name.</p>
                  )}
                </div>
              </div>

              {/* Customer details manual entry fallback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Customer Name <span className="text-destructive">*</span></Label>
                  <Input {...register("customer_name")} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input {...register("customer_mobile")} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input className="uppercase" {...register("customer_gst")} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register("customer_email")} disabled={isLoading} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input {...register("customer_address")} disabled={isLoading} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Bundle Items</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ bundle_name: "", quantity: 1, rate: 0, amount: 0 })}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Bundle Select</TableHead>
                      <TableHead>Bundle Name (Editable)</TableHead>
                      <TableHead className="w-[100px] text-right">Qty</TableHead>
                      <TableHead className="w-[120px] text-right">Rate</TableHead>
                      <TableHead className="w-[120px] text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Select 
                            onValueChange={(val) => handleBundleSelect(index, val)}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select bundle..." />
                            </SelectTrigger>
                            <SelectContent>
                              {bundles.map(b => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name} - {formatCurrency(b.default_price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`items.${index}.bundle_name` as const)}
                            placeholder="Bundle Name"
                            className={errors.items?.[index]?.bundle_name ? "border-destructive" : ""}
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            {...register(`items.${index}.quantity` as const, {
                              onChange: () => calculateAmount(index)
                            })}
                            className="text-right"
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`items.${index}.rate` as const, {
                              onChange: () => calculateAmount(index)
                            })}
                            className="text-right"
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            readOnly
                            {...register(`items.${index}.amount` as const)}
                            className="text-right bg-slate-50 dark:bg-slate-900"
                            disabled={isLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length === 1 || isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {errors.items && (
                <p className="text-sm text-destructive mt-4 px-4 sm:px-0">Please ensure all item details are correct.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Totals & Actions */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <Label className="text-muted-foreground">GST Rate (%)</Label>
                  <Select 
                    value={watchGstRate.toString()} 
                    onValueChange={(val) => setValue("gst_rate", Number(val))}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST Amount</span>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Grand Total</span>
                <span className="text-primary">{formatCurrency(grandTotal)}</span>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label>Notes / Terms</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Payment terms, delivery notes..."
                  {...register("notes")}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-4 border-t bg-slate-50 dark:bg-card">
              {!isOnline && (
                <div className="w-full flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg text-sm mb-2">
                  <WifiOff className="w-4 h-4" />
                  <span>Internet connection required to save invoices</span>
                </div>
              )}
              <Button 
                type="button" 
                className="w-full text-base py-6"
                onClick={handleSubmit((data) => onSubmit(data, 'unpaid'))}
                disabled={isLoading || !isOnline}
              >
                {invoiceId ? "Update Invoice" : "Create Invoice"}
              </Button>
              <div className="flex w-full gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
                  disabled={isLoading || !isOnline}
                >
                  {invoiceId ? "Update Draft" : "Save as Draft"}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="secondary" className="flex-1" disabled={isLoading}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-6 bg-slate-50 dark:bg-slate-900 border-none shadow-xl">
                    <InvoiceDetailsView invoice={previewInvoiceData} settings={settings} />
                  </DialogContent>
                </Dialog>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => router.push('/invoices')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
