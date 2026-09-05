"use client"

import { useState } from "react";
import { useForm, useFieldArray, Controller, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceSchemaType } from "@/schemas/invoice";
import { Bundle, Customer } from "@/types";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import { fetchGSTDetails } from "@/actions/customers";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CustomerSelector } from "@/components/invoices/customer-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ReceiptText, Store, Pencil, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toDateInputValue, formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
const InvoiceDetailsView = dynamic(
  () => import("@/components/invoices/invoice-details-view").then(mod => mod.InvoiceDetailsView),
  { ssr: false, loading: () => <div className="p-8 text-center text-muted-foreground">Loading preview...</div> }
);
import { Eye, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { QtyInput } from "@/components/invoices/qty-input";
import { ProductCombobox } from "@/components/invoices/product-combobox";

const GST_RATE = 5; // Fixed at 5%

interface InvoiceFormProps {
  defaultGstRate: number;
  initialData?: any;
  invoiceId?: string;
  settings?: any;
}

export function InvoiceForm({ defaultGstRate, initialData, invoiceId, settings }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGST, setIsFetchingGST] = useState(false);
  const [productMode, setProductMode] = useState<'store' | 'manual'>('store');
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const form = useForm<InvoiceSchemaType>({
    resolver: zodResolver(invoiceSchema) as any,
    mode: "onChange",
    defaultValues: initialData ? {
      invoice_date: initialData.invoice_date,
      customer_id: initialData.customer_id,
      customer_name: initialData.customer_name,
      customer_mobile: initialData.customer_mobile || "",
      customer_email: initialData.customer_email || "",
      customer_address: initialData.customer_address || "",
      verification_type: initialData.verification_type || undefined,
      verification_number: initialData.verification_number || "",
      customer_location: initialData.customer_location || "Inside Tamil Nadu",
      items: initialData.items.map((item: any) => ({
        bundle_name: item.bundle_name,
        hsn_code: item.hsn_code || "",
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      gst_rate: GST_RATE,
      notes: initialData.notes || "",
      // Map DB status values ('created') to valid form enum values
      status: (['draft', 'unpaid', 'partial', 'paid', 'cancelled'].includes(initialData.status)
        ? initialData.status
        : 'unpaid') as any,
      transport_mode: initialData.transport_mode || "",
      shipping_address: initialData.shipping_address || "",
      no_of_bundles: initialData.no_of_bundles || "",
    } : {
      invoice_date: toDateInputValue(),
      customer_id: null,
      customer_name: "",
      customer_mobile: "",
      customer_email: "",
      customer_address: "",
      verification_type: undefined,
      verification_number: "",
      customer_location: "Inside Tamil Nadu",
      items: [{ bundle_name: "", hsn_code: "", quantity: 1, rate: 0, amount: 0 }],
      gst_rate: GST_RATE,
      notes: "",
      status: "unpaid",
      transport_mode: "",
      shipping_address: "",
      no_of_bundles: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // We don't watch items at the root to prevent full form re-renders on every keystroke
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const { getValues } = form; // We actually get this from the destructured useForm above

  const handleBundleSelect = (index: number, bundle: Bundle) => {
    // @ts-ignore
    const items = control._formValues.items || [];
    const quantity = Number(items[index]?.quantity) || 1;
    setValue(`items.${index}.bundle_name`, bundle.name, { shouldValidate: true });
    setValue(`items.${index}.hsn_code`, bundle.hsn_code || "", { shouldValidate: true });
    setValue(`items.${index}.rate`, bundle.default_price, { shouldValidate: true });
    setValue(`items.${index}.amount`, bundle.default_price * quantity, { shouldValidate: true });
  };

  const calculateAmount = (index: number) => {
    // @ts-ignore
    const items = control._formValues.items || [];
    const quantity = Number(items[index]?.quantity) || 0;
    const rate = Number(items[index]?.rate) || 0;
    setValue(`items.${index}.amount`, quantity * rate, { shouldValidate: true });
  };

  const onSubmit = async (data: InvoiceSchemaType, status: 'draft' | 'unpaid') => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }

    setIsLoading(true);
    try {
      data.status = status;
      data.gst_rate = GST_RATE;
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

  const onInvalid = (errs: any) => {
    // Collect human-readable field names from errors
    const fieldLabels: Record<string, string> = {
      invoice_date: 'Invoice Date',
      customer_name: 'Customer Name',
      customer_location: 'Customer Location',
      verification_type: 'Verification Type',
      verification_number: 'Verification Number',
      items: 'Product Items',
    };
    const errFields = Object.keys(errs)
      .map((k) => fieldLabels[k] || k)
      .join(', ');
    // Also handle nested items errors
    const hasItemErrors = errs.items && Array.isArray(errs.items)
      ? errs.items.some((item: any) => item)
      : false;
    const msg = errFields
      ? `Please fix: ${errFields}`
      : 'Please fill all required fields correctly.';
    toast.error(msg);
    // Scroll to the first error field
    setTimeout(() => {
      const firstErrEl = document.querySelector('[data-field-error="true"]');
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <form className="space-y-6 lg:space-y-8">
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
                <div className="space-y-2" data-field-error={!!errors.invoice_date || undefined}>
                  <Label className={errors.invoice_date ? "text-destructive" : ""}>Invoice Date <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    {...register("invoice_date")}
                    disabled={isLoading}
                    className={errors.invoice_date ? "border-destructive ring-1 ring-destructive" : ""}
                  />
                  {errors.invoice_date && (
                    <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <CustomerSelector form={form} isLoading={isLoading} />

            <Card>
              <CardContent className="pt-6 space-y-6">

              {/* Customer Location */}
              <div className="space-y-2 pt-2" data-field-error={!!errors.customer_location || undefined}>
                <Label className={errors.customer_location ? "text-destructive" : ""}>
                  Customer Location <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="customer_location"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`max-w-xs ${errors.customer_location ? "border-destructive ring-1 ring-destructive" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inside Tamil Nadu">Inside Tamil Nadu</SelectItem>
                        <SelectItem value="Outside Tamil Nadu">Outside Tamil Nadu</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.customer_location && (
                  <p className="text-sm text-destructive">{errors.customer_location.message}</p>
                )}
              </div>

              {/* Transport Details */}
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-semibold text-foreground">Transport Details <span className="text-muted-foreground font-normal">(Optional)</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transport Mode</Label>
                    <Input placeholder="e.g. Road, Courier, Rail" {...register("transport_mode")} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label>No. of Bundles</Label>
                    <Input type="number" min="0" placeholder="0" {...register("no_of_bundles")} disabled={isLoading} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Shipping Address</Label>
                    <Input placeholder="Leave blank if same as Customer Address" {...register("shipping_address")} disabled={isLoading} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div>
                <CardTitle className="text-xl font-semibold">Product Items</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Add products to your invoice</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ bundle_name: "", hsn_code: "", quantity: 1, rate: 0, amount: 0 })}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-6">

              {/* Custom Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${productMode === 'store' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setProductMode('store')}
                >
                  <div className={`flex items-center gap-2 font-semibold mb-1 ${productMode === 'store' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                    <Store className="w-5 h-5" /> Select from Product Store
                  </div>
                  <p className="text-xs text-muted-foreground">Choose from your existing products</p>
                </div>
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${productMode === 'manual' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setProductMode('manual')}
                >
                  <div className={`flex items-center gap-2 font-semibold mb-1 ${productMode === 'manual' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                    <Pencil className="w-5 h-5" /> Create Manually
                  </div>
                  <p className="text-xs text-muted-foreground">Add a product not in the store</p>
                </div>
              </div>



              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:bg-card dark:border-slate-800">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-900/50">
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead className="w-[300px] font-semibold text-slate-700 dark:text-slate-300">Product Name</TableHead>
                      <TableHead className="w-[150px] font-semibold text-slate-700 dark:text-slate-300">HSN Code</TableHead>
                      <TableHead className="w-[140px] font-semibold text-center text-slate-700 dark:text-slate-300">Qty</TableHead>
                      <TableHead className="w-[150px] font-semibold text-right text-slate-700 dark:text-slate-300">Rate (₹)</TableHead>
                      <TableHead className="w-[150px] font-semibold text-right text-slate-700 dark:text-slate-300">Amount (₹)</TableHead>
                      <TableHead className="w-[60px] font-semibold text-center text-slate-700 dark:text-slate-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const itemErrors = errors.items?.[index];
                      const hasItemError = !!(itemErrors?.bundle_name || itemErrors?.quantity || itemErrors?.rate);
                      return (
                        <TableRow key={field.id} className={`hover:bg-transparent border-slate-100 dark:border-slate-800 ${hasItemError ? 'bg-destructive/5' : ''}`} data-field-error={hasItemError || undefined}>
                          <TableCell className="p-3 align-top">
                            {productMode === 'store' ? (
                              <Controller
                                name={`items.${index}.bundle_name` as const}
                                control={control}
                                render={({ field }) => (
                                  <ProductCombobox
                                    value={field.value}
                                    onChange={field.onChange}
                                    onSelect={(bundle) => handleBundleSelect(index, bundle)}
                                    placeholder="Select a product..."
                                    disabled={isLoading}
                                    hasError={!!itemErrors?.bundle_name}
                                  />
                                )}
                              />
                            ) : (
                              <>
                                <Input
                                  {...register(`items.${index}.bundle_name` as const)}
                                  placeholder="Enter product name manually..."
                                  className={itemErrors?.bundle_name ? "border-destructive ring-1 ring-destructive" : ""}
                                  disabled={isLoading}
                                />
                                {itemErrors?.bundle_name && <p className="text-xs text-destructive mt-1">{itemErrors.bundle_name.message}</p>}
                              </>
                            )}
                          </TableCell>
                          <TableCell className="p-3 align-top">
                            <Input
                              {...register(`items.${index}.hsn_code` as const)}
                              placeholder="HSN Code"
                              disabled={isLoading}
                            />
                          </TableCell>
                          <TableCell className="p-3 align-top flex justify-center">
                            <Controller
                              name={`items.${index}.quantity` as const}
                              control={control}
                              render={({ field: { value, onChange } }) => (
                                <QtyInput
                                  value={Number(value)}
                                  onChange={(newVal) => {
                                    onChange(newVal);
                                    calculateAmount(index);
                                  }}
                                  disabled={isLoading}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="p-3 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...register(`items.${index}.rate` as const, {
                                onChange: () => calculateAmount(index)
                              })}
                              className={`text-right ${itemErrors?.rate ? 'border-destructive ring-1 ring-destructive' : ''}`}
                              disabled={isLoading}
                            />
                            {itemErrors?.rate && <p className="text-xs text-destructive mt-1">{itemErrors.rate.message}</p>}
                          </TableCell>
                          <TableCell className="p-3 align-top">
                            <Input
                              type="number"
                              readOnly
                              {...register(`items.${index}.amount` as const)}
                              className="text-right bg-slate-50/80 dark:bg-slate-900/80 font-medium"
                              disabled={isLoading}
                            />
                          </TableCell>
                          <TableCell className="p-3 align-top text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 mx-auto"
                              onClick={() => fields.length > 1 && remove(index)}
                              disabled={fields.length === 1 || isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Inner Totals Footer */}
              <InnerTotals control={control} fieldsLength={fields.length} />
              {errors.items && (
                <p className="text-sm text-destructive mt-4 px-4 sm:px-0">Please ensure all item details are correct.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Totals & Actions */}
        <div className="space-y-6">
          <TotalsCard
            control={control}
            isLoading={isLoading}
            isOnline={isOnline}
            invoiceId={invoiceId}
            initialData={initialData}
            settings={settings}
            onSubmitDraft={handleSubmit((data) => onSubmit(data, 'draft'), onInvalid)}
            onSubmitFinal={handleSubmit((data) => onSubmit(data, 'unpaid'), onInvalid)}
          />
        </div>
      </div>
    </form>
  );
}

// Subcomponents to isolate re-renders

function InnerTotals({ control, fieldsLength }: { control: Control<InvoiceSchemaType>; fieldsLength: number }) {
  const items = useWatch({ control, name: "items" }) || [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

  return (
    <div className="mt-6 border border-slate-200 dark:border-slate-800 bg-[#f8f9fc] dark:bg-slate-900 rounded-lg p-4 px-6 flex justify-between items-center">
      <div className="flex items-center gap-3 font-medium">
        <span className="text-slate-600 dark:text-slate-400">Total Items:</span>
        <span className="bg-[#e9e6ff] dark:bg-indigo-900/50 text-[#6039db] dark:text-indigo-400 px-3 py-1 rounded-md text-sm font-bold">{fieldsLength}</span>
      </div>
      <div className="flex items-center gap-3 font-medium">
        <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
        <span className="text-[#6039db] dark:text-indigo-400 text-xl font-bold tracking-tight">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}

function TotalsCard({
  control,
  isLoading,
  isOnline,
  invoiceId,
  initialData,
  settings,
  onSubmitDraft,
  onSubmitFinal
}: any) {
  const router = useRouter();
  const watchAll = useWatch({ control });
  const items = watchAll.items || [];
  const customerLocation = watchAll.customer_location || "Inside Tamil Nadu";

  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item?.amount) || 0), 0);

  let cgstRate = 0, sgstRate = 0, igstRate = 0;
  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

  if (customerLocation === "Inside Tamil Nadu") {
    cgstRate = GST_RATE / 2;
    sgstRate = GST_RATE / 2;
    cgstAmount = Math.round(subtotal * cgstRate / 100 * 100) / 100;
    sgstAmount = Math.round(subtotal * sgstRate / 100 * 100) / 100;
  } else {
    igstRate = GST_RATE;
    igstAmount = Math.round(subtotal * igstRate / 100 * 100) / 100;
  }

  const gstAmount = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = subtotal + gstAmount;

  const previewInvoiceData = {
    invoice_number: initialData?.invoice_number || "PREVIEW",
    invoice_date: watchAll.invoice_date,
    customer_name: watchAll.customer_name || "Customer Name",
    customer_mobile: watchAll.customer_mobile,
    customer_email: watchAll.customer_email,
    customer_address: watchAll.customer_address,
    verification_type: watchAll.verification_type,
    verification_number: watchAll.verification_number,
    customer_location: customerLocation,
    items: watchAll.items,
    subtotal,
    gst_rate: GST_RATE,
    gst_amount: gstAmount,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    igst_rate: igstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    grand_total: grandTotal,
    paid_amount: initialData?.paid_amount || 0,
    balance_amount: grandTotal - (initialData?.paid_amount || 0),
    payment_status: watchAll.status,
    notes: watchAll.notes,
    transport_mode: watchAll.transport_mode,
    shipping_address: watchAll.shipping_address,
    no_of_bundles: watchAll.no_of_bundles
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Totals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* Dynamic GST split rows */}
        <div className="space-y-2 pt-2 border-t">
          {customerLocation === "Inside Tamil Nadu" ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST ({cgstRate}%)</span>
                <span>{formatCurrency(cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST ({sgstRate}%)</span>
                <span>{formatCurrency(sgstAmount)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGST ({igstRate}%)</span>
              <span>{formatCurrency(igstAmount)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between font-bold text-lg pt-4 border-t">
          <span>Grand Total</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
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
          onClick={onSubmitFinal}
          disabled={isLoading || !isOnline}
        >
          {isLoading ? 'Saving...' : (invoiceId ? "Update Invoice" : "Create Invoice")}
        </Button>
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onSubmitDraft}
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
  );
}
