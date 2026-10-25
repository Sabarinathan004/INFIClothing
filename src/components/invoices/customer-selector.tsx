"use client";

import { useState, useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { InvoiceSchemaType } from "@/schemas/invoice";
import { Customer } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fetchAndVerifyGST } from "@/actions/customer-actions";
import { searchCustomers } from "@/actions/customers";
import { toast } from "sonner";
import {
  CheckCircle2,
  Edit2,
  MapPin,
  Building2,
  User,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Phone,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerSelectorProps {
  form: UseFormReturn<InvoiceSchemaType>;
  isLoading: boolean;
}

const VERIFICATION_TYPES = ["GST", "PAN", "Aadhar"] as const;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function CustomerSelector({ form, isLoading }: CustomerSelectorProps) {
  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = form;

  const customerId = watch("customer_id");
  const customerName = watch("customer_name");
  const customerMobile = watch("customer_mobile");
  const customerAddress = watch("customer_address");
  const verificationType = watch("verification_type");
  const verificationNumber = watch("verification_number");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [isVerifyingGst, setIsVerifyingGst] = useState(false);
  const [showDetailsCollapse, setShowDetailsCollapse] = useState(false);
  const [isLocked, setIsLocked] = useState(Boolean(customerId || customerName));
  const lastVerifiedGstRef = useRef<string>("");

  useEffect(() => {
    if (customerId) {
      setIsLocked(true);
    }
  }, [customerId]);

  // Omni-search debounce & auto GST detection
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || isLocked) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    // Auto-detect 15-character GSTIN
    const upper = q.toUpperCase();
    if (upper.length === 15 && GST_REGEX.test(upper)) {
      handleAutoGSTLookup(upper);
      return;
    }

    if (q.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const results = await searchCustomers(q);
          setSearchResults(results as Customer[]);
          setShowResultsDropdown(true);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 250);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResultsDropdown(false);
    }
  }, [searchQuery, isLocked]);

  // Auto-detect GST from lower GST field as well
  useEffect(() => {
    if (verificationType === "GST" && verificationNumber && !isLocked) {
      const clean = verificationNumber.trim().toUpperCase();
      if (clean.length === 15 && GST_REGEX.test(clean) && clean !== lastVerifiedGstRef.current) {
        handleAutoGSTLookup(clean);
      }
    }
  }, [verificationNumber, verificationType, isLocked]);

  const handleAutoGSTLookup = async (cleanGst: string) => {
    setIsVerifyingGst(true);
    lastVerifiedGstRef.current = cleanGst;
    try {
      const result = await fetchAndVerifyGST(cleanGst);
      if (result.success && result.data) {
        applyCustomerRecord({
          id: result.data.id,
          name: result.data.name,
          address: result.data.address,
          mobile: result.data.mobile || "",
          email: result.data.email || "",
          verification_type: "GST",
          verification_number: cleanGst,
          gst_number: cleanGst,
          created_at: "",
          updated_at: "",
        });
        toast.success(`GSTIN Verified: ${result.data.name}`);
      } else {
        toast.error(result.error || "Invalid GSTIN");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify GSTIN");
    } finally {
      setIsVerifyingGst(false);
    }
  };

  const applyCustomerRecord = (customer: Customer) => {
    setValue("customer_id", customer.id || null, { shouldValidate: true });
    setValue("customer_name", customer.name, { shouldValidate: true });
    setValue("customer_address", customer.address || "", { shouldValidate: true });
    setValue("customer_mobile", customer.mobile || "", { shouldValidate: true });
    setValue("customer_email", customer.email || "", { shouldValidate: true });

    const vType = (customer.verification_type as any) || (customer.gst_number ? "GST" : null);
    const vNum = customer.verification_number || customer.gst_number || "";

    setValue("verification_type", vType, { shouldValidate: true });
    setValue("verification_number", vNum, { shouldValidate: true });
    lastVerifiedGstRef.current = vNum;

    // Auto State-Code Detection from GSTIN
    if (vType === "GST" && vNum.length >= 2) {
      const stateCode = vNum.substring(0, 2);
      if (stateCode === "33") {
        setValue("customer_location", "Inside Tamil Nadu", { shouldValidate: true });
      } else {
        setValue("customer_location", "Outside Tamil Nadu", { shouldValidate: true });
      }
    }

    setIsLocked(true);
    setShowResultsDropdown(false);
    setSearchQuery("");
  };

  const handleInstantWalkIn = () => {
    setValue("customer_id", null, { shouldValidate: true });
    setValue("customer_name", "Cash / Walk-in Customer", { shouldValidate: true });
    setValue("customer_mobile", "", { shouldValidate: true });
    setValue("customer_email", "", { shouldValidate: true });
    setValue("customer_address", "", { shouldValidate: true });
    setValue("verification_type", null, { shouldValidate: true });
    setValue("verification_number", "", { shouldValidate: true });
    setValue("customer_location", "Inside Tamil Nadu", { shouldValidate: true });
    setIsLocked(true);
    lastVerifiedGstRef.current = "";
    toast.success("Walk-in customer selected");
  };

  const handleEdit = () => {
    setIsLocked(false);
    setShowDetailsCollapse(true);
  };

  const handleClear = () => {
    setValue("customer_id", null);
    setValue("customer_name", "");
    setValue("customer_mobile", "");
    setValue("customer_email", "");
    setValue("customer_address", "");
    setValue("verification_type", null);
    setValue("verification_number", "");
    setSearchQuery("");
    setIsLocked(false);
    setShowDetailsCollapse(false);
    lastVerifiedGstRef.current = "";
  };

  // Locked Party Summary Card
  if (isLocked && customerName) {
    return (
      <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-2xs">
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-base text-foreground truncate">
                  {customerName}
                </span>
                {verificationType && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                    <ShieldCheck className="w-3 h-3" />
                    {verificationType}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {customerMobile ? (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Phone className="w-3 h-3 text-primary" /> {customerMobile}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <Phone className="w-3 h-3" /> + Add Mobile
                  </button>
                )}
                {verificationNumber && (
                  <span className="font-mono font-semibold">
                    {verificationType}: {verificationNumber}
                  </span>
                )}
                {customerAddress && (
                  <span className="flex items-center gap-1 truncate max-w-xs">
                    <MapPin className="w-3 h-3 shrink-0" /> {customerAddress}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={isLoading}
                className="h-8 px-2.5 text-xs font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isLoading}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Unified Omni-Party Input Card (Zero Tab Switching)
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
      <CardContent className="p-3.5 sm:p-4 space-y-3">
        {/* Header + 1-Tap Walk-In Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Customer / Party</span>
          </div>
          <button
            type="button"
            onClick={handleInstantWalkIn}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 active:scale-95 transition-all shadow-2xs"
          >
            <Zap className="w-3 h-3 fill-amber-500" />
            1-Tap Cash / Walk-In
          </button>
        </div>

        {/* Omni-Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party by Name, Phone, or type 15-char GSTIN..."
            className="pl-9 pr-24 h-10 text-sm font-medium"
            disabled={isLoading || isVerifyingGst}
          />
          {isVerifyingGst && (
            <span className="absolute right-3 top-2.5 text-xs font-bold text-indigo-600 animate-pulse">
              Verifying GST...
            </span>
          )}
          {isSearching && (
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
              Searching...
            </span>
          )}

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border bg-popover shadow-xl max-h-60 overflow-y-auto p-1.5 space-y-1">
              {searchResults.map((cust) => (
                <button
                  key={cust.id}
                  type="button"
                  onClick={() => applyCustomerRecord(cust)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-accent flex items-start justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{cust.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cust.mobile || "No phone"} {cust.verification_number ? `• ${cust.verification_number}` : ""}
                    </p>
                  </div>
                  {cust.verification_type && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      {cust.verification_type}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Manual Entry Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Customer Name *</Label>
            <Input
              {...register("customer_name")}
              placeholder="e.g. Sri Balaji Textiles"
              disabled={isLoading}
              className={errors.customer_name ? "border-destructive ring-1 ring-destructive" : ""}
            />
            {errors.customer_name && (
              <p className="text-[11px] text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Mobile Number</Label>
            <Input
              {...register("customer_mobile")}
              placeholder="10-digit mobile"
              type="tel"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 1-Tap Collapsible: Verification & Billing Address */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowDetailsCollapse(!showDetailsCollapse)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline py-1"
          >
            {showDetailsCollapse ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showDetailsCollapse ? "Hide GST & Address Details" : "+ Add GST / PAN / Address"}
          </button>

          {showDetailsCollapse && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 mt-2">
              {/* 1-Tap Segmented Verification Pills */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Verification Type
                </Label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setValue("verification_type", null);
                      setValue("verification_number", "");
                    }}
                    className={cn(
                      "py-1.5 px-2 rounded-md text-xs font-bold transition-all text-center",
                      !verificationType ? "bg-primary text-primary-foreground shadow-2xs" : "bg-white dark:bg-card border text-muted-foreground"
                    )}
                  >
                    None
                  </button>
                  {VERIFICATION_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setValue("verification_type", t)}
                      className={cn(
                        "py-1.5 px-2 rounded-md text-xs font-bold transition-all text-center",
                        verificationType === t
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-white dark:bg-card border text-muted-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {verificationType && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">{verificationType} Number</Label>
                    {isVerifyingGst && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Verifying {verificationType}...
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      {...register("verification_number", {
                        onChange: (e) => {
                          const val = (e.target.value || "").toUpperCase().trim();
                          if (verificationType === "GST" && val.length === 15 && GST_REGEX.test(val) && val !== lastVerifiedGstRef.current) {
                            handleAutoGSTLookup(val);
                          }
                        },
                      })}
                      placeholder={`Enter ${verificationType} number`}
                      className="uppercase font-mono text-sm flex-1"
                      disabled={isLoading || isVerifyingGst}
                    />
                    {verificationType === "GST" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const val = (verificationNumber || "").trim().toUpperCase();
                          if (val && GST_REGEX.test(val)) {
                            handleAutoGSTLookup(val);
                          } else {
                            toast.error("Please enter a valid 15-digit GST Number");
                          }
                        }}
                        disabled={isLoading || isVerifyingGst || !verificationNumber || verificationNumber.trim().length !== 15}
                        className="shrink-0 h-10 px-3 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                      >
                        {isVerifyingGst ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Fetching...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Fetch GST
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                  {errors.verification_number && (
                    <p className="text-[11px] text-destructive">{errors.verification_number.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Billing Address</Label>
                <Input
                  {...register("customer_address")}
                  placeholder="Street, City, Pincode"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
