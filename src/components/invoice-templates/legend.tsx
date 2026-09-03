import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";

export function LegendTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "29AAAC1895D1ZW";
  const companyAddress = settings?.company_address || "No. 18, INFI Clothing Banaswadi Road, Pulikeshi Nagar\nBengaluru Urban, KARNATAKA, 560005";
  const companyPhone = settings?.phone_number || "9999999999";
  const companyEmail = settings?.email || "swipe@gmail.com";

  const bankName = settings?.bank_name || "Indusind Bank";
  const bankAccount = settings?.bank_account_number || "250500001833";
  const bankIfsc = settings?.bank_ifsc_code || "INDB0001455";
  const bankBranch = settings?.bank_branch || "Nagercoil";
  
  const customerLocation = invoice?.customer_location || "Inside Tamil Nadu";
  const isIgst = customerLocation !== "Inside Tamil Nadu";
  const cgstRate = invoice?.cgst_rate ?? 2.5;
  const sgstRate = invoice?.sgst_rate ?? 2.5;
  const igstRate = invoice?.igst_rate ?? 5;
  const gstRate = invoice?.gst_rate ?? 5;
  
  const items = invoice?.items || [];
  const totalItems = items.length;
  const totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
  
  const isPaid = (invoice?.balance_amount || 0) === 0 && (invoice?.grand_total || 0) > 0;

  return (
    <div className={cn(
      "w-full bg-white flex flex-col font-sans text-gray-800 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-2xl shadow-2xl p-4 text-[5px]" : "min-h-[1056px] text-xs p-10"
    )}>
      
      {/* Header */}
      <div className={cn("flex justify-between items-start", isPreview ? "mb-2" : "mb-6")}>
        <div className={cn("flex", isPreview ? "gap-2" : "gap-4")}>
          <div className={cn("flex flex-col items-center justify-center text-blue-900 font-serif leading-none mt-1", isPreview ? "w-8 h-8" : "w-16 h-16")}>
            <svg viewBox="0 0 100 100" className={cn("fill-blue-900", isPreview ? "w-6 h-6" : "w-12 h-12")}>
               <polygon points="50,10 90,90 70,90 50,50 30,90 10,90" />
               <polygon points="50,65 65,90 35,90" />
            </svg>
            <span className={cn("font-bold mt-[1px]", isPreview ? "text-[3px]" : "text-[8px]")}>INFI Clothing</span>
          </div>
          <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
             <span className={cn("font-bold text-blue-900 tracking-wider uppercase", isPreview ? "text-[6px]" : "text-xl")}>{companyName}</span>
             <span className="whitespace-pre-wrap">{companyAddress}</span>
             <span className="font-bold">GSTIN: {companyGst}</span>
             <span><span className="font-bold">Mobile:</span> {companyPhone} <span className="font-bold ml-1">Email:</span> {companyEmail}</span>
             {invoice?.id && <span className={cn("text-gray-500", isPreview ? "text-[4px] mt-[1px]" : "text-[10px] mt-1")}>INV ID: {invoice.id}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end">
           <span className={cn("font-bold text-blue-900 tracking-widest", isPreview ? "text-[6px] mb-[1px]" : "text-2xl mb-1")}>TAX INVOICE</span>
           <span className={cn("text-gray-500", isPreview ? "text-[4px] mb-1" : "text-[10px] mb-3")}>ORIGINAL FOR RECIPIENT</span>
           <div className={cn("border border-gray-300", isPreview ? "w-10 h-10 p-[1px]" : "w-24 h-24 p-1")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
        </div>
      </div>

      {/* Info Grid */}
      <div className={cn("border border-gray-400 grid", isPreview ? "mb-2 grid-cols-[1fr_40px_40px] text-[4px]" : "mb-6 grid-cols-[1fr_120px_120px] text-[11px]")}>
        <div className={cn("border-r border-gray-400", isPreview ? "p-1" : "p-3")}>
          <span className={cn("font-bold block", isPreview ? "mb-[1px] text-[5px]" : "mb-2 text-sm")}>Customer Details:</span>
          <span className="font-bold block">{invoice?.customer_name || "Customer Name"}</span>
          <span className={cn("font-bold block", isPreview ? "mt-[2px]" : "mt-2")}>Billing address:</span>
          <span className="text-gray-600 block whitespace-pre-wrap">{invoice?.customer_address || "Customer Address"}</span>
          <span className={cn("font-bold block", isPreview ? "mt-[2px]" : "mt-2")}>Shipping address:</span>
          <span className="text-gray-600 block whitespace-pre-wrap">{invoice?.shipping_address || invoice?.customer_address || "Shipping Address"}</span>
          {invoice?.customer_mobile && <span className={cn("block", isPreview ? "mt-[2px]" : "mt-2")}><span className="font-bold">Ph:</span> {invoice.customer_mobile}</span>}
        </div>
        <div className="border-r border-gray-400 flex flex-col">
           <div className={cn("border-b border-gray-400", isPreview ? "p-1" : "p-2")}><span className="font-bold block">Invoice #:</span>{invoice?.invoice_number || "PREVIEW"}</div>
           <div className={cn("border-b border-gray-400", isPreview ? "p-1" : "p-2")}><span className="font-bold block">Place of Supply:</span>{customerLocation}</div>
           <div className={cn(isPreview ? "p-1" : "p-2")}><span className="font-bold block">Dispatch From:</span>{companyName}<br/><span className="text-gray-600 whitespace-pre-wrap">{companyAddress}</span></div>
        </div>
        <div className="flex flex-col">
           <div className={cn("border-b border-gray-400", isPreview ? "p-1" : "p-2")}><span className="font-bold block">Date:</span>{formatDateTime(invoice?.invoice_date)}</div>
           <div className={cn("border-b border-gray-400", isPreview ? "p-1" : "p-2")}><span className="font-bold block">Due Date:</span>{formatDateTime(invoice?.invoice_date)}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className={cn("border border-gray-400 flex flex-col flex-1", isPreview ? "mb-1" : "mb-4")}>
         <div className={cn("flex border-b border-gray-400 font-bold bg-gray-100", isPreview ? "text-[4px]" : "text-xs")}>
           <div className={cn("border-r border-gray-400", isPreview ? "w-3 px-1 py-[2px]" : "w-10 px-2 py-2")}>#</div>
           <div className={cn("flex-[1.5] border-r border-gray-400", isPreview ? "px-1 py-[2px]" : "px-2 py-2")}>Item</div>
           <div className={cn("border-r border-gray-400 text-center", isPreview ? "w-8 py-[2px]" : "w-20 py-2")}>HSN/SAC</div>
           <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-10 pr-1 py-[2px]" : "w-24 pr-2 py-2")}>Rate/Item</div>
           <div className={cn("border-r border-gray-400 text-center", isPreview ? "w-8 py-[2px]" : "w-16 py-2")}>Qty</div>
           <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-12 pr-1 py-[2px]" : "w-28 pr-2 py-2")}>Taxable Value</div>
           <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-12 pr-1 py-[2px]" : "w-32 pr-2 py-2")}>Tax</div>
           <div className={cn("text-right", isPreview ? "w-12 pr-1 py-[2px]" : "w-32 pr-2 py-2")}>Amount</div>
         </div>
         {items.map((item: any, idx: number) => {
            const taxAmt = item.amount - (item.amount / (1 + (gstRate / 100)));
            const taxableVal = item.amount - taxAmt;
            return (
              <div key={idx} className={cn("flex border-b border-gray-100", isPreview ? "text-[4px]" : "text-xs")}>
                <div className={cn("border-r border-gray-400", isPreview ? "w-3 px-1 py-[2px]" : "w-10 px-2 py-2")}>{idx + 1}</div>
                <div className={cn("flex-[1.5] border-r border-gray-400 font-bold", isPreview ? "px-1 py-[2px]" : "px-2 py-2")}>{item.bundle_name || "Item"}</div>
                <div className={cn("border-r border-gray-400 text-center", isPreview ? "w-8 py-[2px]" : "w-20 py-2")}>{item.hsn_code || "-"}</div>
                <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-10 pr-1 py-[2px]" : "w-24 pr-2 py-2")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
                <div className={cn("border-r border-gray-400 text-center", isPreview ? "w-8 py-[2px]" : "w-16 py-2")}>{item.quantity || 1}</div>
                <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-12 pr-1 py-[2px]" : "w-28 pr-2 py-2")}>{formatCurrency(taxableVal || 0).replace('₹', '')}</div>
                <div className={cn("border-r border-gray-400 text-right text-gray-600", isPreview ? "w-12 pr-1 py-[2px]" : "w-32 pr-2 py-2")}>{formatCurrency(taxAmt || 0).replace('₹', '')}</div>
                <div className={cn("text-right font-semibold", isPreview ? "w-12 pr-1 py-[2px]" : "w-32 pr-2 py-2")}>{formatCurrency(item.amount || 0).replace('₹', '')}</div>
              </div>
            )
         })}
         
         {/* Totals Box */}
         <div className={cn("mt-auto flex border-t border-gray-400", isPreview ? "h-16 text-[4px]" : "min-h-[140px] text-xs")}>
           <div className="flex-[1.5] border-r border-gray-400 flex flex-col justify-between">
              <div className={cn(isPreview ? "p-1" : "p-3")}>
                 <div>Total items / Qty : {totalItems} / {totalQty}</div>
                 <div className={cn(isPreview ? "mt-[2px]" : "mt-1")}>Total amount (in words): INR {numberToWords(invoice?.grand_total || 0)} Only.</div>
              </div>
              <div className={cn("flex justify-between items-end border-t border-gray-400 bg-gray-50/50", isPreview ? "p-1" : "p-3")}>
                 <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
                   <span className="font-bold">Bank Details:</span>
                   <span>Bank: {bankName}</span>
                   <span>Account #: {bankAccount}</span>
                   <span>IFSC: {bankIfsc}</span>
                   <span>Branch: {bankBranch}</span>
                 </div>
                 <div className={cn("border border-gray-300", isPreview ? "w-8 h-8 p-[1px]" : "w-20 h-20 p-1")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
              </div>
           </div>
           <div className={cn("flex-1 flex flex-col", isPreview ? "text-[5px]" : "text-sm")}>
              <div className={cn("flex justify-between", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}><span className="font-bold">Taxable Amount</span><span>{formatCurrency(invoice?.subtotal || 0)}</span></div>
              {isIgst ? (
                <div className={cn("flex justify-between border-b border-gray-400", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}><span>IGST {igstRate}%</span><span>{formatCurrency(invoice?.igst_amount || 0)}</span></div>
              ) : (
                <>
                  <div className={cn("flex justify-between", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}><span>CGST {cgstRate}%</span><span>{formatCurrency(invoice?.cgst_amount || 0)}</span></div>
                  <div className={cn("flex justify-between border-b border-gray-400", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}><span>SGST {sgstRate}%</span><span>{formatCurrency(invoice?.sgst_amount || 0)}</span></div>
                </>
              )}
              <div className={cn("flex justify-between font-bold border-b border-gray-400", isPreview ? "px-1 py-1 text-[6px]" : "px-3 py-3 text-lg")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
              
              {isPaid && (
                <div className={cn("flex justify-end text-green-600 font-bold items-center bg-gray-50", isPreview ? "px-1 py-1 gap-1" : "px-3 py-3 gap-2")}>
                   <div className={cn("rounded-full bg-green-500/20 flex items-center justify-center", isPreview ? "w-2 h-2" : "w-4 h-4")}><div className={cn("bg-green-500 rounded-full", isPreview ? "w-1 h-1" : "w-2 h-2")}/></div>
                   Amount Paid
                </div>
              )}
           </div>
         </div>
      </div>

      <div className={cn("flex justify-between items-end border border-gray-400", isPreview ? "p-1" : "p-3")}>
        <div className={cn("flex flex-col text-gray-700 w-2/3", isPreview ? "gap-[2px] text-[3.5px]" : "gap-1 text-[10px]")}>
           <span className="font-bold text-gray-900">Notes</span>
           <span>{invoice?.notes || "Thank you for the Business!"}</span>
           <span className={cn("font-bold text-gray-900", isPreview ? "mt-[2px]" : "mt-2")}>Terms and Conditions:</span>
           <span>1. Goods once sold cannot be taken back or exchanged.</span>
           <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
           <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
           <span>4. Subject to local jurisdiction.</span>
        </div>
        <div className="flex flex-col items-center w-1/3">
           <span className={cn("text-gray-500", isPreview ? "text-[3.5px] mb-2" : "text-[10px] mb-6")}>For {companyName}</span>
           <span className={cn("font-signature text-black/80 transform -rotate-6 tracking-tight", isPreview ? "text-lg mb-1" : "text-4xl mb-4")}>{companyName}</span>
           <span className={cn("text-gray-400", isPreview ? "text-[3px] mt-1" : "text-[8px] mt-2")}>Authorized Signatory</span>
        </div>
      </div>

      <div className={cn("text-center text-gray-400", isPreview ? "text-[4px] mt-1" : "text-[10px] mt-4")}>Page 1/1  This is a digitally signed document.</div>

    </div>
  );
}
