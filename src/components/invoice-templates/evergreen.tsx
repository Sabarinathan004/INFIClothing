import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";

export function EvergreenTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "27AAACT2727Q1ZW";
  const companyAddress = settings?.company_address || "64, Whitefield Main Rd, Palm Meadows, Whitefield\nBengaluru, KARNATAKA, 560066";
  const companyPhone = settings?.phone_number || "9977538551";

  const bankName = settings?.bank_name || "YES BANK";
  const bankAccount = settings?.bank_account_number || "66789999222445";
  const bankIfsc = settings?.bank_ifsc_code || "YESB0IN4567";
  const bankBranch = settings?.bank_branch || "Kodihalli";
  
  const customerLocation = invoice?.customer_location || "Inside Tamil Nadu";
  const isIgst = customerLocation !== "Inside Tamil Nadu";
  const cgstRate = invoice?.cgst_rate ?? 2.5;
  const sgstRate = invoice?.sgst_rate ?? 2.5;
  const igstRate = invoice?.igst_rate ?? 5;
  
  const items = invoice?.items || [];
  
  return (
    <div className={cn(
      "w-full bg-white flex flex-col font-sans text-gray-800 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-2xl shadow-2xl p-3 text-[5px]" : "min-h-[1056px] text-xs p-8"
    )}>
      {/* Outer Border Box */}
      <div className={cn("absolute border border-gray-300 rounded-sm pointer-events-none", isPreview ? "inset-2" : "inset-4")} />
      
      <div className={cn("flex flex-col h-full z-10", isPreview ? "px-1 py-1" : "px-2 py-2")}>
        
        {/* Header */}
        <div className={cn("flex justify-between items-center border-b border-gray-300", isPreview ? "pb-1 mb-1" : "pb-4 mb-4")}>
          <div className="flex-1" />
          <div className={cn("flex-[2] text-center font-bold tracking-widest", isPreview ? "text-[6px]" : "text-xl")}>TAX INVOICE</div>
          <div className={cn("flex-1 text-right uppercase text-gray-500", isPreview ? "text-[4px]" : "text-[10px]")}>Original For Recipient</div>
        </div>

        {/* Top Details */}
        <div className={cn("flex border-b border-gray-300", isPreview ? "pb-1 mb-1" : "pb-4 mb-4")}>
          {/* Logo & Company */}
          <div className={cn("flex-[1.5] flex border-r border-gray-300", isPreview ? "gap-2 pr-2" : "gap-6 pr-6")}>
            <div className={cn("flex-shrink-0 flex items-center justify-center font-serif text-blue-800 font-black", isPreview ? "w-8 h-8 text-2xl" : "w-20 h-20 text-6xl")}>
              I
            </div>
            <div className="flex flex-col">
              <span className={cn("font-bold", isPreview ? "text-[6px]" : "text-lg")}>{companyName}</span>
              <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN {companyGst}</span>
              <span className={cn("text-gray-500 whitespace-pre-wrap", isPreview ? "mt-[1px]" : "mt-1")}>{companyAddress}</span>
              {companyPhone && <span className="text-gray-500">Mobile {companyPhone}</span>}
            </div>
          </div>
          {/* Invoice Details */}
          <div className={cn("flex-1", isPreview ? "pl-2" : "pl-6")}>
            <div className={cn("grid grid-cols-2 w-full", isPreview ? "gap-y-1 gap-x-2" : "gap-y-2 gap-x-4")}>
              <div className="font-semibold">Invoice #:</div>
              <div>{invoice?.invoice_number || "PREVIEW"}</div>
              <div className="font-semibold">Invoice Date:</div>
              <div>{formatDateTime(invoice?.invoice_date)}</div>
              <div className="font-semibold">Place of Supply:</div>
              <div>{customerLocation}</div>
              <div className="font-semibold">Due Date:</div>
              <div>{formatDateTime(invoice?.invoice_date)}</div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className={cn("flex border-b border-gray-300", isPreview ? "mb-1 pb-1 gap-2" : "mb-4 pb-4 gap-6")}>
          <div className={cn("flex-1 border-r border-gray-300", isPreview ? "pr-2" : "pr-6")}>
            <div className={cn("font-semibold", isPreview ? "mb-[2px]" : "mb-1")}>Customer Details:</div>
            <div className="font-bold">{invoice?.customer_name || "Customer Name"}</div>
            <div className="text-gray-500">Billing address:</div>
            <div className="text-gray-500 whitespace-pre-wrap">{invoice?.customer_address || "Customer Address"}</div>
            {invoice?.customer_mobile && <div className="text-gray-500">Ph: {invoice.customer_mobile}</div>}
          </div>
          <div className="flex-1">
            <div className={cn("text-gray-500", isPreview ? "mb-[2px]" : "mb-1")}>Shipping address:</div>
            <div className="text-gray-500 whitespace-pre-wrap">{invoice?.shipping_address || invoice?.customer_address || "Shipping Address"}</div>
          </div>
        </div>

        {/* Item Table */}
        <div className={cn("border border-gray-300 flex-1 flex flex-col", isPreview ? "mb-1" : "mb-4")}>
          <div className={cn("flex border-b border-gray-300 font-bold bg-gray-50", isPreview ? "py-[2px] px-1 text-[4px]" : "py-2 px-3 text-sm")}>
            <div className={cn(isPreview ? "w-3" : "w-10")}>#</div>
            <div className="flex-1">Item</div>
            <div className={cn("text-right", isPreview ? "w-10" : "w-24")}>HSN/SAC</div>
            <div className={cn("text-right", isPreview ? "w-6" : "w-16")}>Tax</div>
            <div className={cn("text-right", isPreview ? "w-8" : "w-20")}>Qty</div>
            <div className={cn("text-right", isPreview ? "w-10" : "w-24")}>Rate</div>
            <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>Amount</div>
          </div>
          
          {items.map((item: any, idx: number) => (
            <div key={idx} className={cn("flex", isPreview ? "px-1 py-[2px]" : "px-3 py-2", idx % 2 !== 0 && "bg-gray-50/50")}>
              <div className={cn(isPreview ? "w-3" : "w-10")}>{idx + 1}</div>
              <div className="flex-1 font-semibold">{item.bundle_name || "Item Name"}</div>
              <div className={cn("text-right", isPreview ? "w-10" : "w-24")}>{item.hsn_code || "-"}</div>
              <div className={cn("text-right", isPreview ? "w-6" : "w-16")}>{invoice?.gst_rate || 5}%</div>
              <div className={cn("text-right", isPreview ? "w-8" : "w-20")}>{item.quantity || 1}</div>
              <div className={cn("text-right", isPreview ? "w-10" : "w-24")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
              <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(item.amount || 0).replace('₹', '')}</div>
            </div>
          ))}

          <div className="mt-auto border-t border-gray-300">
             <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
               <div className={cn("text-right font-semibold", isPreview ? "w-24" : "w-48")}>Taxable Amount</div>
               <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(invoice?.subtotal || 0)}</div>
             </div>
             {isIgst ? (
               <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
                 <div className={cn("text-right font-semibold", isPreview ? "w-24" : "w-48")}>IGST {igstRate}%</div>
                 <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(invoice?.igst_amount || 0)}</div>
               </div>
             ) : (
               <>
                 <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
                   <div className={cn("text-right font-semibold", isPreview ? "w-24" : "w-48")}>CGST {cgstRate}%</div>
                   <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(invoice?.cgst_amount || 0)}</div>
                 </div>
                 <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
                   <div className={cn("text-right font-semibold", isPreview ? "w-24" : "w-48")}>SGST {sgstRate}%</div>
                   <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(invoice?.sgst_amount || 0)}</div>
                 </div>
               </>
             )}
             <div className={cn("flex border-t border-gray-300 font-bold bg-gray-100", isPreview ? "px-1 py-[2px]" : "px-3 py-2")}>
               <div className="flex-1 text-center">Total</div>
               <div className={cn("text-right", isPreview ? "flex-1" : "w-32")}>{formatCurrency(invoice?.grand_total || 0)}</div>
             </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={cn("flex border border-gray-300", isPreview ? "h-14 mb-1" : "min-h-[120px] mb-4")}>
          <div className={cn("flex-1 border-r border-gray-300 flex flex-col", isPreview ? "p-1 gap-[1px]" : "p-4 gap-1")}>
            <span className="font-semibold">Bank Details:</span>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24")}>IFSC:</span><span className="font-semibold">{bankIfsc}</span></div>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
          </div>
          <div className="flex-1 border-r border-gray-300 flex flex-col items-center justify-center">
            <span className={cn("font-semibold", isPreview ? "mb-1" : "mb-3")}>Pay using UPI:</span>
            <div className={cn("bg-black/10 flex items-center justify-center p-[2px]", isPreview ? "w-8 h-8" : "w-20 h-20")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
          </div>
          <div className={cn("flex-[1.2] flex flex-col items-end justify-end relative", isPreview ? "p-1 pb-2" : "p-4 pb-6")}>
            <span className={cn("text-gray-500", isPreview ? "text-[4px] mb-4" : "text-[10px] mb-12")}>For {companyName}</span>
            <div className={cn("rounded-full border border-blue-800/20 absolute flex items-center justify-center -rotate-12 opacity-80", isPreview ? "w-12 h-12 bottom-6 right-3" : "w-24 h-24 bottom-16 right-8")}>
              <span className={cn("font-bold text-blue-800 tracking-widest uppercase", isPreview ? "text-[4px]" : "text-[10px]")}>Signature</span>
            </div>
          </div>
        </div>

        <div className={cn("flex text-gray-500", isPreview ? "gap-1 text-[3px]" : "gap-4 text-[10px]")}>
           <div className={cn("flex-1 border border-gray-300", isPreview ? "p-1" : "p-3")}>
             <div className={cn("font-semibold", isPreview ? "mb-[1px]" : "mb-1")}>Notes:</div>
             {invoice?.notes || "Thank you for the Business"}
           </div>
           <div className={cn("flex-[2] border border-gray-300", isPreview ? "p-1" : "p-3")}>
             <div className={cn("font-semibold", isPreview ? "mb-[1px]" : "mb-1")}>Terms and Conditions:</div>
             1. Goods once sold cannot be taken back or exchanged.<br/>
             2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.<br/>
             3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.<br/>
             4. Subject to local jurisdiction.
           </div>
        </div>

        <div className={cn("text-center text-gray-400", isPreview ? "text-[4px] mt-1 pb-1" : "text-xs mt-4 pb-2")}>This is a digitally signed document.</div>

      </div>
    </div>
  );
}
