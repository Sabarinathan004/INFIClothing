"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Receipt } from "lucide-react"; // Keeping import in case we need it, though not used for logo anymore

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
  const upiId = settings?.upi_id || "";

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
          <div className="mt-2 print:hidden">
            <Badge className={getStatusColor(invoice.payment_status)} variant="outline">
              {invoice.payment_status === 'partial' ? 'Partially Paid' : invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm font-semibold text-slate-400 print:text-slate-500 uppercase tracking-wider mb-3">Bill To</h3>
        <div className="font-semibold text-lg text-slate-900">{invoice.customer_name}</div>
        {invoice.customer_address && <div className="text-sm text-slate-600 print:text-slate-800 whitespace-pre-wrap mt-1">{invoice.customer_address}</div>}
        {invoice.customer_gst && <div className="text-sm text-slate-600 print:text-slate-800 mt-1">GSTIN: <span className="uppercase font-medium text-slate-900">{invoice.customer_gst}</span></div>}
        {invoice.customer_mobile && <div className="text-sm text-slate-600 print:text-slate-800 mt-1">{invoice.customer_mobile}</div>}
      </div>

      {/* Items Table */}
      <div className="mb-6 sm:mb-8 border border-slate-200 rounded-lg overflow-hidden print:border-slate-300 print:rounded-none">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] print:min-w-full">
            <TableHeader className="bg-slate-50 print:bg-slate-100">
            <TableRow className="border-b border-slate-200 print:border-slate-300">
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3">Description</TableHead>
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3 text-right">Qty</TableHead>
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3 text-right">Rate</TableHead>
              <TableHead className="font-semibold text-slate-700 print:text-slate-900 py-3 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item: any, index: number) => (
              <TableRow key={item.id || index} className="border-b border-slate-200 print:border-slate-300">
                <TableCell className="py-4 font-medium text-slate-900">{item.bundle_name}</TableCell>
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
              <h3 className="text-sm font-semibold text-slate-400 print:text-slate-500 uppercase tracking-wider mb-2">Notes & Terms</h3>
              <p className="text-sm text-slate-600 print:text-slate-800 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {upiId && (
            <div className="bg-slate-50 print:bg-transparent print:border print:border-slate-200 p-4 rounded-lg print:rounded-sm">
              <h3 className="text-sm font-semibold text-slate-700 print:text-slate-900 mb-1">Payment Details</h3>
              <p className="text-sm text-slate-600 print:text-slate-800">UPI ID: <span className="font-medium text-slate-900">{upiId}</span></p>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-72 space-y-3">
          <div className="flex justify-between text-sm text-slate-600 print:text-slate-800">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 print:text-slate-800">
            <span>GST ({invoice.gst_rate}%)</span>
            <span>{formatCurrency(invoice.gst_amount)}</span>
          </div>
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
