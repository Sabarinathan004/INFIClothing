"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceSchemaType } from "@/schemas/invoice";
import { Bundle } from "@/types";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import { getBundles } from "@/actions/bundles";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerSelector } from "@/components/invoices/customer-selector";
import {
  Plus,
  Trash2,
  Truck,
  Sparkles,
  Eye,
  WifiOff,
  CheckCircle2,
  Wallet,
  QrCode,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toDateInputValue, formatCurrency, cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { ProductCombobox } from "@/components/invoices/product-combobox";

const InvoiceDetailsView = dynamic(
  () => import("@/components/invoices/invoice-details-view").then((mod) => mod.InvoiceDetailsView),
  { ssr: false, loading: () => <div className="p-8 text-center text-muted-foreground">Loading preview...</div> }
);

interface InvoiceFormProps {
  defaultGstRate: number;
  initialData?: any;
  invoiceId?: string;
  settings?: any;
}

const DOC_TYPE_OPTIONS = [
  { value: "invoice", label: "Tax Invoice" },
  { value: "quotation", label: "Quotation" },
  { value: "challan", label: "Delivery Challan" },
] as const;

const SETTLEMENT_OPTIONS = [
  { value: "credit", label: "Credit (Unpaid)", icon: Clock, color: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40" },
  { value: "upi", label: "Paid UPI", icon: QrCode, color: "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40" },
  { value: "cash", label: "Paid Cash", icon: Wallet, color: "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/40" },
] as const;

export function InvoiceForm({ defaultGstRate = 5, initialData, invoiceId, settings }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [quickBundles, setQuickBundles] = useState<Bundle[]>([]);
  const [showLogistics, setShowLogistics] = useState(
    Boolean(initialData?.transport_mode || initialData?.shipping_address || initialData?.no_of_bundles)
  );
  const router = useRouter();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    getBundles(true, 1, 12).then((res) => {
      if (res?.data) setQuickBundles(res.data);
    });
  }, []);

  const form = useForm<InvoiceSchemaType>({
    resolver: zodResolver(invoiceSchema) as any,
    mode: "onChange",
    defaultValues: initialData
      ? {
        doc_type: initialData.doc_type || "invoice",
        invoice_date: initialData.invoice_date,
        customer_id: initialData.customer_id,
        customer_name: initialData.customer_name,
        customer_mobile: initialData.customer_mobile || "",
        customer_email: initialData.customer_email || "",
        customer_address: initialData.customer_address || "",
        verification_type: initialData.verification_type || undefined,
        verification_number: initialData.verification_number || "",
        customer_location: initialData.customer_location || "Inside Tamil Nadu",
        is_tax_inclusive: Boolean(initialData.is_tax_inclusive),
        gst_rate: initialData.gst_rate ?? defaultGstRate,
        extra_discount: Number(initialData.extra_discount) || 0,
        auto_round_off: true,
        settlement_mode: initialData.payment_status === "paid" ? "cash" : "credit",
        items: initialData.items.map((item: any) => ({
          bundle_name: item.bundle_name,
          hsn_code: item.hsn_code || "",
          unit: item.unit || "BDL",
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          discount_percent: Number(item.discount_percent) || 0,
          discount_amount: Number(item.discount_amount) || 0,
          taxable_amount: Number(item.taxable_amount) || Number(item.amount) || 0,
          gst_rate: Number(item.gst_rate ?? initialData.gst_rate ?? defaultGstRate),
          gst_amount: Number(item.gst_amount) || 0,
          amount: Number(item.amount) || 0,
        })),
        notes: initialData.notes || "",
        status: (["draft", "unpaid", "partial", "paid", "cancelled"].includes(initialData.status)
          ? initialData.status
          : "unpaid") as any,
        transport_mode: initialData.transport_mode || "",
        shipping_address: initialData.shipping_address || "",
        no_of_bundles: initialData.no_of_bundles || "",
        vehicle_number: initialData.vehicle_number || "",
        eway_bill_number: initialData.eway_bill_number || "",
      }
      : {
        doc_type: "invoice",
        invoice_date: toDateInputValue(),
        customer_id: null,
        customer_name: "",
        customer_mobile: "",
        customer_email: "",
        customer_address: "",
        verification_type: undefined,
        verification_number: "",
        customer_location: "Inside Tamil Nadu",
        is_tax_inclusive: false,
        gst_rate: defaultGstRate,
        extra_discount: 0,
        auto_round_off: true,
        settlement_mode: "credit",
        items: [
          {
            bundle_name: "",
            hsn_code: "",
            unit: "BDL",
            quantity: 1,
            rate: 0,
            discount_percent: 0,
            discount_amount: 0,
            taxable_amount: 0,
            gst_rate: defaultGstRate,
            gst_amount: 0,
            amount: 0,
          },
        ],
        notes: "",
        status: "unpaid",
        transport_mode: "",
        shipping_address: "",
        no_of_bundles: "",
        vehicle_number: "",
        eway_bill_number: "",
      },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchAll = useWatch({ control });
  const isTaxInclusive = Boolean(watchAll.is_tax_inclusive);
  const customerLocation = watchAll.customer_location || "Inside Tamil Nadu";
  const docType = watchAll.doc_type || "invoice";
  const settlementMode = watchAll.settlement_mode || "credit";

  // Deterministic row math (handles both Tax-Exclusive and MRP Tax-Inclusive)
  const recalculateRow = (index: number, overrideInclusive?: boolean) => {
    const currentItems = getValues("items") || [];
    const row = currentItems[index];
    if (!row) return;

    const inclusive = overrideInclusive !== undefined ? overrideInclusive : getValues("is_tax_inclusive");
    const qty = Math.max(0, Number(row.quantity) || 0);
    const rate = Math.max(0, Number(row.rate) || 0);
    const discPct = Math.min(100, Math.max(0, Number(row.discount_percent) || 0));
    const gstRate = Number(row.gst_rate ?? defaultGstRate);

    const gross = qty * rate;
    const discAmt = Math.round(((gross * discPct) / 100) * 100) / 100;
    const afterDisc = Math.max(0, gross - discAmt);

    let taxable = afterDisc;
    let gstAmt = 0;
    let rowTotal = 0;

    if (inclusive && gstRate > 0) {
      taxable = Math.round((afterDisc / (1 + gstRate / 100)) * 100) / 100;
      gstAmt = Math.round((afterDisc - taxable) * 100) / 100;
      rowTotal = Math.round(afterDisc * 100) / 100;
    } else {
      taxable = Math.round(afterDisc * 100) / 100;
      gstAmt = Math.round(((taxable * gstRate) / 100) * 100) / 100;
      rowTotal = Math.round((taxable + gstAmt) * 100) / 100;
    }

    setValue(`items.${index}.discount_amount`, discAmt, { shouldValidate: false });
    setValue(`items.${index}.taxable_amount`, taxable, { shouldValidate: false });
    setValue(`items.${index}.gst_amount`, gstAmt, { shouldValidate: false });
    setValue(`items.${index}.amount`, taxable, { shouldValidate: true }); // Keeps backward compatibility with subtotal = sum(amount)
  };

  const handleToggleTaxInclusive = (nextInclusive: boolean) => {
    setValue("is_tax_inclusive", nextInclusive);
    const currentItems = getValues("items") || [];
    currentItems.forEach((_, idx) => recalculateRow(idx, nextInclusive));
  };

  // One-Tap Quick Bundle Chip Handler (Swipe POS style)
  const handleQuickBundleTap = (bundle: Bundle) => {
    const currentItems = getValues("items") || [];
    const existingIndex = currentItems.findIndex(
      (i) => i.bundle_name?.trim().toLowerCase() === bundle.name.trim().toLowerCase()
    );

    if (existingIndex > -1) {
      const nextQty = (Number(currentItems[existingIndex].quantity) || 0) + 1;
      setValue(`items.${existingIndex}.quantity`, nextQty, { shouldValidate: true });
      recalculateRow(existingIndex);
      toast.success(`${bundle.name} qty → ${nextQty}`);
      return;
    }

    // If the first row is empty, fill it; otherwise append a new row
    if (currentItems.length === 1 && !currentItems[0].bundle_name?.trim()) {
      handleBundleSelect(0, bundle);
    } else {
      append({
        bundle_name: bundle.name,
        hsn_code: bundle.hsn_code || "",
        unit: (bundle as any).unit || "BDL",
        quantity: 1,
        rate: bundle.default_price,
        discount_percent: 0,
        discount_amount: 0,
        taxable_amount: bundle.default_price,
        gst_rate: Number((bundle as any).gst_rate ?? defaultGstRate),
        gst_amount: Math.round(((bundle.default_price * defaultGstRate) / 100) * 100) / 100,
        amount: bundle.default_price,
      });
    }
  };

  const handleBundleSelect = (index: number, bundle: Bundle) => {
    const currentItems = getValues("items") || [];
    const quantity = Number(currentItems[index]?.quantity) || 1;
    setValue(`items.${index}.bundle_name`, bundle.name, { shouldValidate: true });
    setValue(`items.${index}.hsn_code`, bundle.hsn_code || "", { shouldValidate: true });
    setValue(`items.${index}.rate`, bundle.default_price, { shouldValidate: true });
    setValue(`items.${index}.quantity`, quantity, { shouldValidate: true });
    recalculateRow(index);
  };

  const adjustQty = (index: number, delta: number) => {
    const currentQty = Number(getValues(`items.${index}.quantity`)) || 0;
    const nextQty = Math.max(1, currentQty + delta);
    setValue(`items.${index}.quantity`, nextQty, { shouldValidate: true });
    recalculateRow(index);
  };

  // Compute live invoice summary
  const items = watchAll.items || [];
  const totalQty = items.reduce((s, i) => s + (Number(i?.quantity) || 0), 0);
  const rawSubtotal = items.reduce((s, i) => s + (Number(i?.amount) || 0), 0);
  const extraDiscount = Number(watchAll.extra_discount) || 0;
  const subtotal = Math.max(0, Math.round((rawSubtotal - extraDiscount) * 100) / 100);

  const gstRate = Number(watchAll.gst_rate ?? defaultGstRate);
  let cgstRate = 0,
    sgstRate = 0,
    igstRate = 0;
  let cgstAmount = 0,
    sgstAmount = 0,
    igstAmount = 0;

  if (customerLocation === "Inside Tamil Nadu") {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Math.round(((subtotal * cgstRate) / 100) * 100) / 100;
    sgstAmount = Math.round(((subtotal * sgstRate) / 100) * 100) / 100;
  } else {
    igstRate = gstRate;
    igstAmount = Math.round(((subtotal * igstRate) / 100) * 100) / 100;
  }

  const gstAmount = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
  const unroundedTotal = subtotal + gstAmount;
  const grandTotal = watchAll.auto_round_off ? Math.round(unroundedTotal) : Number(unroundedTotal.toFixed(2));

  const onSubmit = async (data: InvoiceSchemaType, statusOverride: "draft" | "unpaid") => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }

    setIsLoading(true);
    try {
      data.status = statusOverride === "draft" ? "draft" : data.settlement_mode !== "credit" ? "paid" : "unpaid";
      let result;
      if (invoiceId) {
        result = await updateInvoice(invoiceId, data);
        toast.success("Bill updated!");
      } else {
        result = await createInvoice(data);
        toast.success("Bill created!");
      }
      router.push(`/invoices/${result.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save invoice");
      setIsLoading(false);
    }
  };

  const onInvalid = (errs: any) => {
    const firstKey = Object.keys(errs)[0];
    toast.error(`Please check required field: ${firstKey || "Customer / Items"}`);
    setTimeout(() => {
      const firstErrEl = document.querySelector('[data-field-error="true"]');
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const previewInvoiceData = {
    invoice_number: initialData?.invoice_number || "PREVIEW",
    invoice_date: watchAll.invoice_date,
    customer_name: watchAll.customer_name || "Walk-in / Cash Customer",
    customer_mobile: watchAll.customer_mobile,
    customer_email: watchAll.customer_email,
    customer_address: watchAll.customer_address,
    verification_type: watchAll.verification_type,
    verification_number: watchAll.verification_number,
    customer_location: customerLocation,
    items: items,
    subtotal,
    gst_rate: gstRate,
    gst_amount: gstAmount,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    igst_rate: igstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    grand_total: grandTotal,
    paid_amount: settlementMode !== "credit" ? grandTotal : initialData?.paid_amount || 0,
    balance_amount: settlementMode !== "credit" ? 0 : grandTotal - (initialData?.paid_amount || 0),
    payment_status: settlementMode !== "credit" ? "paid" : watchAll.status,
    notes: watchAll.notes,
    transport_mode: watchAll.transport_mode,
    shipping_address: watchAll.shipping_address,
    no_of_bundles: watchAll.no_of_bundles,
  };

  return (
    <form className="space-y-4 pb-44 lg:pb-12">
      {/* 1. TOP SINGLE-HANDED CONTROL STRIP: Doc Type + Date + Tax Location */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Segmented Pill: Doc Type */}
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-900 w-full sm:w-auto">
              {DOC_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("doc_type", opt.value)}
                  className={cn(
                    "flex-1 sm:flex-initial px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all",
                    docType === opt.value
                      ? "bg-white dark:bg-card text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Compact Date Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                Bill Date
              </Label>
              <Input
                type="date"
                {...register("invoice_date")}
                disabled={isLoading}
                className="h-10 w-40 text-sm font-medium"
              />
            </div>
          </div>

          {/* 1-Tap State / GST Split Pills + Tax Inclusive Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setValue("customer_location", "Inside Tamil Nadu")}
                className={cn(
                  "py-2 px-2.5 rounded-md text-xs font-semibold transition-all text-center",
                  customerLocation === "Inside Tamil Nadu"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground"
                )}
              >
                📍 Inside TN (CGST+SGST)
              </button>
              <button
                type="button"
                onClick={() => setValue("customer_location", "Outside Tamil Nadu")}
                className={cn(
                  "py-2 px-2.5 rounded-md text-xs font-semibold transition-all text-center",
                  customerLocation === "Outside Tamil Nadu"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground"
                )}
              >
                🚛 Outside TN (IGST)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => handleToggleTaxInclusive(false)}
                className={cn(
                  "py-2 px-2.5 rounded-md text-xs font-semibold transition-all text-center",
                  !isTaxInclusive ? "bg-white dark:bg-card text-foreground shadow-xs" : "text-muted-foreground"
                )}
              >
                Tax Exclusive (+GST)
              </button>
              <button
                type="button"
                onClick={() => handleToggleTaxInclusive(true)}
                className={cn(
                  "py-2 px-2.5 rounded-md text-xs font-semibold transition-all text-center",
                  isTaxInclusive ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground"
                )}
              >
                MRP (Tax Inclusive)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CUSTOMER SELECTOR + QUICK WALK-IN FILL */}
      <div className="relative">
        <CustomerSelector form={form} isLoading={isLoading} />
      </div>

      {/* 3. ONE-TAP QUICK BUNDLE CHIPS (SWIPE SPEED BOOSTER) */}
      {quickBundles.length > 0 && (
        <Card className="border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 1-Tap Quick Bundles (Tap to Add / +1)
              </span>
              <span className="text-[11px] text-muted-foreground">{quickBundles.length} items</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {quickBundles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleQuickBundleTap(b)}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-card border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 active:scale-95 transition-all shadow-2xs text-left"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground line-clamp-1">{b.name}</div>
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(b.default_price)}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. SINGLE-HANDED PRODUCT CARDS (ZERO HORIZONTAL SCROLL ON MOBILE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-foreground">
            Bill Items ({fields.length}) • Total Qty: {totalQty}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Bill GST:</span>
            {[0, 5, 12, 18].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setValue("gst_rate", rate);
                  fields.forEach((_, idx) => {
                    setValue(`items.${idx}.gst_rate`, rate);
                    recalculateRow(idx);
                  });
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-bold border transition-all",
                  Number(watchAll.gst_rate) === rate
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white dark:bg-card text-muted-foreground border-border"
                )}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        {fields.map((field, index) => {
          const itemErrors = errors.items?.[index];
          const rowValues = items[index] || {};
          const hasItemError = !!(itemErrors?.bundle_name || itemErrors?.quantity || itemErrors?.rate);

          return (
            <Card
              key={field.id}
              data-field-error={hasItemError || undefined}
              className={cn(
                "border transition-all shadow-2xs",
                hasItemError
                  ? "border-destructive bg-destructive/5"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-card"
              )}
            >
              <CardContent className="p-3 sm:p-4 space-y-3">
                {/* Row Header: Item # + Unified Search/Type Combobox + Delete */}
                <div className="flex items-start gap-2">
                  <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted-foreground">
                    #{index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <Controller
                      name={`items.${index}.bundle_name` as const}
                      control={control}
                      render={({ field: prodField }) => (
                        <ProductCombobox
                          value={prodField.value}
                          onChange={prodField.onChange}
                          onSelect={(bundle) => handleBundleSelect(index, bundle)}
                          placeholder="Search bundle or type new product name..."
                          disabled={isLoading}
                          hasError={!!itemErrors?.bundle_name}
                        />
                      )}
                    />
                    {itemErrors?.bundle_name && (
                      <p className="text-xs text-destructive mt-1">{itemErrors.bundle_name.message}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length === 1 || isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Row Controls Grid: Qty Steppers + Rate + Discount % + HSN + Line Total */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-end pt-1">
                  {/* Quantity + Thumb Quick Steppers (+1, +5, +10) */}
                  <div className="col-span-2 sm:col-span-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <div className="flex gap-1">
                        {[-1, 1, 5, 10].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => adjustQty(index, step)}
                            className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 text-foreground active:scale-95 transition-transform"
                          >
                            {step > 0 ? `+${step}` : step}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        {...register(`items.${index}.quantity` as const, {
                          onChange: () => recalculateRow(index),
                        })}
                        className="h-11 text-base font-bold text-center"
                        disabled={isLoading}
                      />
                      <select
                        {...register(`items.${index}.unit` as const)}
                        className="h-11 px-2 rounded-md border border-input bg-background text-xs font-semibold"
                      >
                        <option value="BDL">BDL</option>
                        <option value="PCS">PCS</option>
                        <option value="BOX">BOX</option>
                        <option value="SET">SET</option>
                      </select>
                    </div>
                  </div>

                  {/* Rate (₹) */}
                  <div className="col-span-1 sm:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {isTaxInclusive ? "MRP Incl. (₹)" : "Rate (₹)"}
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.rate` as const, {
                        onChange: () => recalculateRow(index),
                      })}
                      className="h-11 text-base font-bold text-right"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Discount % & HSN */}
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Disc % / HSN</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        placeholder="0%"
                        {...register(`items.${index}.discount_percent` as const, {
                          onChange: () => recalculateRow(index),
                        })}
                        className="h-11 text-sm text-center px-1.5"
                        disabled={isLoading}
                      />
                      <Input
                        {...register(`items.${index}.hsn_code` as const)}
                        placeholder="HSN"
                        className="h-11 text-xs text-center px-1.5"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Computed Taxable Amount */}
                  <div className="col-span-2 sm:col-span-2 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 flex sm:flex-col justify-between items-center sm:items-end border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-muted-foreground">Taxable Amt</span>
                    <span className="text-base font-extrabold text-primary">
                      {formatCurrency(Number(rowValues.amount) || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Full-Width Thumb Button to Add Another Item */}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              bundle_name: "",
              hsn_code: "",
              unit: "BDL",
              quantity: 1,
              rate: 0,
              discount_percent: 0,
              discount_amount: 0,
              taxable_amount: 0,
              gst_rate: gstRate,
              gst_amount: 0,
              amount: 0,
            })
          }
          className="w-full h-12 border-dashed border-2 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-50/50"
        >
          <Plus className="w-5 h-5 mr-2" /> + Add Another Bundle / Item
        </Button>
      </div>

      {/* 5. COLLAPSIBLE TRANSPORT, BUNDLES & E-WAY BILL DRAWER */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setShowLogistics(!showLogistics)}
            className="w-full flex items-center justify-between text-left py-1"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold">Transport, Bundles & Notes</span>
              {(watchAll.transport_mode || watchAll.no_of_bundles) && (
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  {watchAll.no_of_bundles ? `${watchAll.no_of_bundles} Bundles` : watchAll.transport_mode}
                </span>
              )}
            </div>
            {showLogistics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLogistics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-3 border-t">
              <div className="space-y-1">
                <Label className="text-xs">Transport Mode</Label>
                <Input placeholder="Road / Parcel / MSS" {...register("transport_mode")} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No. of Bundles (Bales)</Label>
                <Input type="number" inputMode="numeric" placeholder="0" {...register("no_of_bundles")} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vehicle No.</Label>
                <Input placeholder="TN 57 AB 1234" {...register("vehicle_number")} className="h-10 uppercase" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Extra Bill Discount (₹)</Label>
                <Input type="number" inputMode="decimal" placeholder="0" {...register("extra_discount")} className="h-10" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Shipping Address (if different)</Label>
                <Input placeholder="Same as billing address" {...register("shipping_address")} className="h-10" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Invoice Notes / Terms</Label>
                <Input placeholder="Remarks or LR Number..." {...register("notes")} className="h-10" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. STICKY SINGLE-HANDED THUMB-ZONE ACTION DOCK (ALWAYS VISIBLE) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2.5 shadow-[0_-8px_25px_-5px_rgba(0,0,0,0.1)] pb-[max(env(safe-area-inset-bottom),0.65rem)]">
        <div className="max-w-[1400px] mx-auto space-y-2">
          {/* Top Row: 1-Tap Settlement Pills + Live Tax & Grand Total */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* 1-Tap Payment Mode Selector */}
            <div className="flex items-center gap-1.5">
              {SETTLEMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = settlementMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("settlement_mode", opt.value)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                      active ? opt.color : "border-border text-muted-foreground bg-slate-50 dark:bg-slate-900"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Live Breakdown Pill */}
            <div className="flex items-center gap-3 ml-auto text-right">
              <div className="hidden sm:block text-xs text-muted-foreground">
                Sub: <strong className="text-foreground">{formatCurrency(subtotal)}</strong> •{" "}
                {customerLocation === "Inside Tamil Nadu"
                  ? `CGST+SGST: ${formatCurrency(gstAmount)}`
                  : `IGST: ${formatCurrency(gstAmount)}`}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Grand Total ({totalQty} Qty)
                </div>
                <div className="text-xl sm:text-2xl font-black text-primary leading-none">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Large Thumb Action Buttons */}
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="h-12 px-3 shrink-0 font-semibold">
                  <Eye className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-6 bg-slate-50 dark:bg-slate-900 border-none shadow-xl">
                <InvoiceDetailsView invoice={previewInvoiceData} settings={settings} />
              </DialogContent>
            </Dialog>

            <Button
              type="button"
              variant="secondary"
              className="h-12 px-3 sm:px-4 font-semibold shrink-0"
              onClick={handleSubmit((d) => onSubmit(d, "draft"), onInvalid)}
              disabled={isLoading || !isOnline}
            >
              Draft
            </Button>

            <Button
              type="button"
              className="h-12 flex-1 text-base font-extrabold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSubmit((d) => onSubmit(d, "unpaid"), onInvalid)}
              disabled={isLoading || !isOnline}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {isLoading
                ? "Saving..."
                : invoiceId
                  ? "Update Bill"
                  : settlementMode === "credit"
                    ? `Save ${docType === "quotation" ? "Quotation" : "Bill"}`
                    : `Save & Mark Paid (${settlementMode.toUpperCase()})`}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}