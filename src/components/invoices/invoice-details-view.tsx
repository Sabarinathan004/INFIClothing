"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * Determines whether to show CGST+SGST or IGST based on customer_location.
 * Falls back gracefully for old invoices that don't have the new split columns.
 */
function GstRows({ invoice }: { invoice: any }) {
  const location = invoice.customer_location;
  const hasSplitData = invoice.cgst_rate != null || invoice.igst_rate != null;

  // New invoices: use split columns
  if (hasSplitData) {
    if (location === 'Inside Tamil Nadu') {
      return (
        <>
          <div className="flex justify-between text-sm text-slate-600 print:text-slate-800">
            <span>CGST ({invoice.cgst_rate ?? 2.5}%)</span>
            <span>{formatCurrency(invoice.cgst_amount ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 print:text-slate-800">
            <span>SGST ({invoice.sgst_rate ?? 2.5}%)</span>
            <span>{formatCurrency(invoice.sgst_amount ?? 0)}</span>
          </div>
        </>
      );
    } else {
      // Outside Tamil Nadu
      return (
        <div className="flex justify-between text-sm text-slate-600 print:text-slate-800">
          <span>IGST ({invoice.igst_rate ?? 5}%)</span>
          <span>{formatCurrency(invoice.igst_amount ?? 0)}</span>
        </div>
      );
    }
  }

  // Legacy fallback: old invoices with just gst_rate + gst_amount
  return (
    <div className="flex justify-between text-sm text-slate-600 print:text-slate-800">
      <span>GST ({invoice.gst_rate}%)</span>
      <span>{formatCurrency(invoice.gst_amount)}</span>
    </div>
  );
}

/**
 * Renders the verification info line in the Bill To section.
 * Partially masks Aadhaar numbers for privacy.
 */
function VerificationInfo({ invoice }: { invoice: any }) {
  const type = invoice.verification_type;
  const num = invoice.verification_number;

  // Legacy fallback
  const legacyGst = invoice.customer_gst;

  if (!type && !num) {
    if (legacyGst) {
      return (
        <div className="text-sm text-slate-600 print:text-slate-800 mt-1">
          GSTIN: <span className="uppercase font-medium text-slate-900">{legacyGst}</span>
        </div>
      );
    }
    return null;
  }

  // Mask Aadhaar: show only last 4 digits
  const displayNum = type === 'Aadhar' && num && num.length === 12
    ? `●●●● ●●●● ${num.slice(-4)}`
    : num;

  return (
    <div className="text-sm text-slate-600 print:text-slate-800 mt-1">
      {type}: <span className="uppercase font-medium text-slate-900">{displayNum}</span>
    </div>
  );
}

export function InvoiceDetailsView({ invoice, settings }: { invoice: any, settings: any }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const companyName = settings?.company_name || "Your Company";
  const companyAddress = settings?.company_address || "";
  const companyPhone = settings?.phone_number || "";
  const companyEmail = settings?.email || "";
  const companyGst = settings?.gst_number || "";
  // Legacy fallback
  const upiId = settings?.upi_id || "";
  const paymentMethod = settings?.payment_method || (upiId ? "upi" : "none");
  const bankAccountNumber = settings?.bank_account_number || "";
  const bankIfscCode = settings?.bank_ifsc_code || "";
  const bankName = settings?.bank_name || "";
  const bankAccountHolder = settings?.bank_account_holder || "";
  const cashInstructions = settings?.cash_instructions || "";

  const hasPaymentDetails =
    paymentMethod === "upi" ? !!upiId :
    paymentMethod === "bank" ? !!(bankAccountNumber || bankIfscCode) :
    paymentMethod === "cash" ? true :
    false;

  return (
    <div className="bg-white text-black print:text-black rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-0 p-4 sm:p-8 md:p-12 max-w-4xl mx-auto print:max-w-none print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6 mb-6 sm:pb-8 sm:mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0 print:border print:border-gray-200">
            <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
            {companyAddress && <p className="text-sm text-slate-500 print:text-slate-700 whitespace-pre-wrap mt-1">{companyAddress}</p>}
            {companyGst && <p className="text-sm text-slate-500 print:text-slate-700 mt-1">GSTIN: <span className="uppercase font-medium">{companyGst}</span></p>}
            {(companyPhone || companyEmail) && (
              <p className="text-sm text-slate-500 print:text-slate-700 mt-1">
                {companyPhone}{companyPhone && companyEmail ? ' | ' : ''}{companyEmail}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-light text-slate-400 print:text-slate-600 mb-2 tracking-widest uppercase">Invoice</h2>
          <p className="font-medium text-lg text-slate-900">#{invoice.invoice_number}</p>
          <p className="text-sm text-slate-500 print:text-slate-700 mt-1">
            Date: <span className="font-medium text-slate-900">{formatDate(invoice.invoice_date)}</span>
          </p>
          {invoice.customer_location && (
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              {invoice.customer_location}
            </p>
          )}
          <div className="mt-2 print:hidden">
            <Badge className={getStatusColor(invoice.payment_status)} variant="outline">
              {invoice.payment_status === 'partial' ? 'Partially Paid' : invoice.payment_status?.charAt(0).toUpperCase() + invoice.payment_status?.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bill To & Transport */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6 sm:mb-8">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-400 print:text-slate-500 uppercase tracking-wider mb-3">Bill To</h3>
          <div className="font-semibold text-lg text-slate-900">{invoice.customer_name}</div>
          {invoice.customer_address && <div className="text-sm text-slate-600 print:text-slate-800 whitespace-pre-wrap mt-1">{invoice.customer_address}</div>}
          <VerificationInfo invoice={invoice} />
          {invoice.customer_mobile && <div className="text-sm text-slate-600 print:text-slate-800 mt-1">{invoice.customer_mobile}</div>}
        </div>

        {(invoice.transport_mode || invoice.shipping_address || invoice.no_of_bundles) && (
          <div className="flex-1 sm:text-right">
            <h3 className="text-sm font-semibold text-slate-400 print:text-slate-500 uppercase tracking-wider mb-3">Transport Details</h3>
            <div className="space-y-1.5 text-sm text-slate-600 print:text-slate-800">
              {invoice.transport_mode && (
                <div className="flex flex-col sm:flex-row sm:justify-end gap-1 sm:gap-2">
                  <span className="text-slate-400 print:text-slate-500">Mode:</span> 
                  <span className="font-medium text-slate-900">{invoice.transport_mode}</span>
                </div>
              )}
              {invoice.no_of_bundles && (
                <div className="flex flex-col sm:flex-row sm:justify-end gap-1 sm:gap-2">
                  <span className="text-slate-400 print:text-slate-500">Bundles:</span> 
                  <span className="font-medium text-slate-900">{invoice.no_of_bundles}</span>
                </div>
              )}
              {companyAddress && (
                <div className="flex flex-col sm:flex-row sm:justify-end gap-1 sm:gap-2">
                  <span className="text-slate-400 print:text-slate-500 whitespace-nowrap">From:</span> 
                  <span className="font-medium text-slate-900 whitespace-pre-wrap text-left sm:text-right">{companyAddress}</span>
                </div>
              )}
              {invoice.shipping_address && (
                <div className="flex flex-col sm:flex-row sm:justify-end gap-1 sm:gap-2 mt-1">
                  <span className="text-slate-400 print:text-slate-500 whitespace-nowrap">To:</span> 
                  <span className="font-medium text-slate-900 whitespace-pre-wrap text-left sm:text-right">{invoice.shipping_address}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-6 sm:mb-8 border border-slate-200 rounded-lg overflow-hidden print:border-slate-300 print:rounded-none">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] print:min-w-full">
            <TableHeader className="bg-slate-50 print:bg-slate-100">
            <TableRow className="border-b border-slate-200 print:border-slate-300">
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3">Description</TableHead>
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3 text-center">HSN</TableHead>
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3 text-right">Qty</TableHead>
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3 text-right">Rate</TableHead>
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item: any, index: number) => (
              <TableRow key={item.id || index} className="border-b border-slate-200 print:border-slate-300">
                <TableCell className="py-4 font-medium text-slate-900">{item.bundle_name}</TableCell>
                <TableCell className="py-4 text-center text-slate-700">{item.hsn_code || '-'}</TableCell>
                <TableCell className="py-4 text-right text-slate-700">{item.quantity}</TableCell>
                <TableCell className="py-4 text-right text-slate-700">{formatCurrency(item.rate)}</TableCell>
                <TableCell className="py-4 text-right text-slate-900 font-medium">{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Totals & Notes */}
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1">
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 print:text-slate-500 uppercase tracking-wider mb-2">Notes &amp; Terms</h3>
              <p className="text-sm text-slate-600 print:text-slate-800 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {hasPaymentDetails && (
            <div className="bg-slate-50 print:bg-transparent print:border print:border-slate-200 p-4 rounded-lg print:rounded-sm">
              <h3 className="text-sm font-semibold text-slate-700 print:text-slate-900 mb-2">Payment Details</h3>
              <div className="space-y-1 text-sm text-slate-600 print:text-slate-800">
                {paymentMethod === "upi" && upiId && (
                  <p>UPI ID: <span className="font-medium text-slate-900">{upiId}</span></p>
                )}
                {paymentMethod === "bank" && (
                  <>
                    {bankAccountHolder && <p>Name: <span className="font-medium text-slate-900">{bankAccountHolder}</span></p>}
                    {bankName && <p>Bank: <span className="font-medium text-slate-900">{bankName}</span></p>}
                    {bankAccountNumber && <p>Account No: <span className="font-medium text-slate-900">{bankAccountNumber}</span></p>}
                    {bankIfscCode && <p>IFSC: <span className="font-medium text-slate-900 uppercase">{bankIfscCode}</span></p>}
                  </>
                )}
                {paymentMethod === "cash" && (
                  <>
                    <p className="font-medium text-slate-900">Cash Payment</p>
                    {cashInstructions && <p className="text-slate-600">{cashInstructions}</p>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-72 space-y-3">
          <div className="flex justify-between text-sm text-slate-600 print:text-slate-800">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>

          {/* Dynamic GST rows */}
          <GstRows invoice={invoice} />

          <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-200 print:border-slate-300 text-slate-900">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grand_total)}</span>
          </div>
          
          <div className="pt-3 border-t border-slate-200 print:border-slate-300 space-y-2">
            <div className="flex justify-between text-sm text-emerald-600 print:text-slate-800 font-medium">
              <span>Paid Amount</span>
              <span>{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600 print:text-slate-800 font-bold">
              <span>Balance Due</span>
              <span>{formatCurrency(invoice.balance_amount)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print:block mt-24 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
        Thank you for your business!
      </div>
    </div>
  );
}
