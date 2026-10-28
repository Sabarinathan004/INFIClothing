import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

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
  const gstRate = invoice?.gst_rate ?? 5;
  
  const items = invoice?.items || [];
  const totalItems = items.length;
  const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);

  // Swipe compliance fields
  const customerName = (invoice?.legal_name || invoice?.customer_name || "Customer Name").toUpperCase();
  const customerCompany = (invoice?.trade_name || "").toUpperCase();
  const hasDistinctCompany = customerCompany && customerCompany !== customerName;

  const gstin = (invoice?.verification_number || invoice?.customer_gst || "").trim();
  const panNumber = (invoice?.pan_number || (gstin.length >= 12 ? gstin.substring(2, 12) : "")).toUpperCase();
  const placeOfSupply = invoice?.place_of_supply || getPlaceOfSupply(gstin || customerLocation);

  return (
    <div className={cn(
      "w-full bg-white flex flex-col font-sans text-gray-800 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-2xl shadow-2xl p-3 text-[5px]" : "min-h-[1056px] print:min-h-0 text-xs p-8 print:p-2"
    )}>
      {/* Outer Border Box */}
      <div className={cn("absolute border border-gray-300 rounded-sm pointer-events-none", isPreview ? "inset-2" : "inset-4 print:inset-1")} />
      
      <div className={cn("flex flex-col h-full z-10", isPreview ? "px-1 py-1" : "px-2 py-2")}>
        
        {/* Header */}
        <div className={cn("flex justify-between items-center border-b border-gray-300", isPreview ? "pb-1 mb-1" : "pb-3 mb-3")}>
          <div className="flex-1" />
          <div className={cn("flex-[2] text-center font-bold tracking-widest text-gray-900", isPreview ? "text-[6px]" : "text-xl")}>TAX INVOICE</div>
          <div className={cn("flex-1 text-right uppercase text-gray-500", isPreview ? "text-[4px]" : "text-[10px]")}>Original For Recipient</div>
        </div>

        {/* Top Details */}
        <div className={cn("flex border-b border-gray-300", isPreview ? "pb-1 mb-1" : "pb-3 mb-3")}>
          {/* Logo & Company */}
          <div className={cn("flex-[1.5] flex border-r border-gray-300", isPreview ? "gap-2 pr-2" : "gap-5 pr-5")}>
            <div className={cn("flex-shrink-0 flex items-center justify-center font-serif text-blue-800 font-black", isPreview ? "w-8 h-8 text-2xl" : "w-16 h-16 text-5xl")}>
              I
            </div>
            <div className="flex flex-col">
              <span className={cn("font-bold text-gray-900", isPreview ? "text-[6px]" : "text-base")}>{companyName}</span>
              <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN {companyGst}</span>
              <span className={cn("text-gray-500 whitespace-pre-wrap", isPreview ? "mt-[1px]" : "mt-1")}>{companyAddress}</span>
              {companyPhone && <span className="text-gray-500">Mobile {companyPhone}</span>}
            </div>
          </div>
          {/* Invoice Details */}
          <div className={cn("flex-1", isPreview ? "pl-2" : "pl-5")}>
            <div className={cn("grid grid-cols-2 w-full", isPreview ? "gap-y-1 gap-x-2" : "gap-y-1.5 gap-x-3")}>
              <div className="font-semibold text-gray-600">Invoice #:</div>
              <div className="font-bold">{invoice?.invoice_number || "PREVIEW"}</div>
              <div className="font-semibold text-gray-600">Invoice Date:</div>
              <div>{formatDateTime(invoice?.invoice_date)}</div>
              <div className="font-semibold text-gray-600">Place of Supply:</div>
              <div className="font-bold text-gray-900">{placeOfSupply}</div>
              <div className="font-semibold text-gray-600">Due Date:</div>
              <div>{formatDateTime(invoice?.invoice_date)}</div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className={cn("flex border-b border-gray-300", isPreview ? "mb-1 pb-1 gap-2" : "mb-3 pb-3 gap-5")}>
          <div className={cn("flex-1 border-r border-gray-300", isPreview ? "pr-2" : "pr-5")}>
            <div className={cn("font-bold text-gray-900", isPreview ? "mb-[2px]" : "mb-1")}>Customer Details:</div>
            <div className="font-semibold text-gray-900 uppercase">{customerName}</div>
            {hasDistinctCompany && (
              <div className="font-bold text-gray-900 uppercase">{customerCompany}</div>
            )}
            {gstin && <div className="font-bold text-gray-900">GSTIN: {gstin}</div>}
            {panNumber && <div className="font-bold text-gray-900">PAN: {panNumber}</div>}
            {invoice?.customer_mobile && <div className="text-gray-600">Ph: {invoice.customer_mobile}</div>}
          </div>
          <div className="flex-1">
            <div className={cn("font-bold text-gray-900", isPreview ? "mb-[2px]" : "mb-1")}>Billing Address:</div>
            <div className="text-gray-600 whitespace-pre-wrap">{invoice?.customer_address || invoice?.shipping_address || "Billing Address"}</div>
          </div>
        </div>

        {/* Item Table */}
        <div className={cn("border border-gray-300 flex-1 flex flex-col", isPreview ? "mb-1" : "mb-3")}>
          <div className={cn("flex border-b border-gray-300 font-bold bg-gray-50 text-gray-900", isPreview ? "py-[2px] px-1 text-[4px]" : "py-2 px-3 text-xs")}>
            <div className={cn(isPreview ? "w-3" : "w-10")}>#</div>
            <div className="flex-1">Item</div>
            <div className={cn("text-center", isPreview ? "w-10" : "w-24")}>HSN/SAC</div>
            <div className={cn("text-right", isPreview ? "w-10" : "w-24")}>Rate</div>
            <div className={cn("text-center", isPreview ? "w-8" : "w-20")}>Qty</div>
            <div className={cn("text-right", isPreview ? "w-10" : "w-28")}>Taxable Value</div>
            <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>Tax Amount</div>
            <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>Amount</div>
          </div>
          
          {items.map((item: any, idx: number) => {
            const itemGstRate = item.tax_rate ?? gstRate;
            const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
            const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
            const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
            const unit = item.unit || "BDL";

            return (
              <div key={idx} className={cn("flex border-b border-gray-200", isPreview ? "px-1 py-[2px] text-[3.5px]" : "px-3 py-2 text-xs", idx % 2 !== 0 && "bg-gray-50/50")}>
                <div className={cn(isPreview ? "w-3" : "w-10")}>{idx + 1}</div>
                <div className="flex-1 font-semibold">{item.bundle_name || "Item Name"}</div>
                <div className={cn("text-center text-gray-600", isPreview ? "w-10" : "w-24")}>{item.hsn_code || "-"}</div>
                <div className={cn("text-right", isPreview ? "w-10" : "w-24")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
                <div className={cn("text-center font-semibold", isPreview ? "w-8" : "w-20")}>{item.quantity || 1} {unit}</div>
                <div className={cn("text-right font-medium", isPreview ? "w-10" : "w-28")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
                <div className={cn("text-right text-gray-700", isPreview ? "w-12" : "w-28")}>
                  {formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)
                </div>
                <div className={cn("text-right font-bold text-gray-900", isPreview ? "w-12" : "w-28")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
              </div>
            );
          })}

          <div className="mt-auto border-t border-gray-300 break-inside-avoid print:break-inside-avoid">
             <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
               <div className={cn("text-right font-semibold text-gray-600", isPreview ? "w-24" : "w-48")}>Taxable Amount</div>
               <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(invoice?.subtotal || 0)}</div>
             </div>
             {isIgst ? (
               <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
                 <div className={cn("text-right font-semibold text-gray-600", isPreview ? "w-24" : "w-48")}>IGST {igstRate}%</div>
                 <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(invoice?.igst_amount || 0)}</div>
               </div>
             ) : (
               <>
                 <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
                   <div className={cn("text-right font-semibold text-gray-600", isPreview ? "w-24" : "w-48")}>CGST {cgstRate}%</div>
                   <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>{formatCurrency(invoice?.cgst_amount || 0)}</div>
                 </div>
                 <div className={cn("flex justify-end", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}>
                   <div className={cn("text-right font-semibold text-gray-600", isPreview ? "w-24" : "w-48")}>SGST {sgstRate}%</div>
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

        <div className={cn("flex justify-between border border-gray-300 text-gray-700 p-2 mb-3 break-inside-avoid print:break-inside-avoid", isPreview ? "text-[4px] p-1 mb-1" : "text-xs")}>
          <span>Total items / Qty : {totalItems} / {totalQty}</span>
          <span>Total amount (in words): INR <span className="font-bold text-gray-900">{numberToWords(invoice?.grand_total || 0)}</span></span>
        </div>

        {/* Footer info */}
        <div className={cn("flex border border-gray-300 break-inside-avoid print:break-inside-avoid", isPreview ? "h-14 mb-1" : "min-h-[100px] mb-3")}>
          <div className={cn("flex-1 border-r border-gray-300 flex flex-col", isPreview ? "p-1 gap-[1px]" : "p-3 gap-1")}>
            <span className="font-bold text-gray-900">Bank Details:</span>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24", "text-gray-600")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24", "text-gray-600")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24", "text-gray-600")}>IFSC:</span><span className="font-semibold">{bankIfsc}</span></div>
            <div className="flex"><span className={cn(isPreview ? "w-10" : "w-24", "text-gray-600")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
          </div>
          <div className="flex-1 border-r border-gray-300 flex flex-col items-center justify-center">
            <span className={cn("font-bold text-gray-900", isPreview ? "mb-1" : "mb-2")}>Pay using UPI:</span>
            <div className={cn("bg-black/10 flex items-center justify-center p-[2px]", isPreview ? "w-8 h-8" : "w-16 h-16")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
          </div>
          <div className={cn("flex-[1.2] flex flex-col items-end justify-end relative", isPreview ? "p-1 pb-2" : "p-3 pb-4")}>
            <span className={cn("text-gray-500", isPreview ? "text-[4px] mb-4" : "text-[10px] mb-8")}>For {companyName}</span>
            <div className={cn("rounded-full border border-blue-800/20 absolute flex items-center justify-center -rotate-12 opacity-80", isPreview ? "w-12 h-12 bottom-6 right-3" : "w-20 h-20 bottom-8 right-6")}>
              <span className={cn("font-bold text-blue-800 tracking-widest uppercase", isPreview ? "text-[4px]" : "text-[9px]")}>Signature</span>
            </div>
            <span className={cn("text-gray-400 text-[10px]")}>Authorized Signatory</span>
          </div>
        </div>

        <div className={cn("flex text-gray-500 break-inside-avoid print:break-inside-avoid", isPreview ? "gap-1 text-[3px]" : "gap-4 text-[10px]")}>
           <div className={cn("flex-1 border border-gray-300", isPreview ? "p-1" : "p-2.5")}>
             <div className={cn("font-bold text-gray-800", isPreview ? "mb-[1px]" : "mb-1")}>Notes:</div>
             {invoice?.notes || "Thank you for the Business"}
           </div>
           <div className={cn("flex-[2] border border-gray-300", isPreview ? "p-1" : "p-2.5")}>
             <div className={cn("font-bold text-gray-800", isPreview ? "mb-[1px]" : "mb-1")}>Terms and Conditions:</div>
             1. Goods once sold cannot be taken back or exchanged.<br/>
             2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.<br/>
             3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.<br/>
             4. Subject to local jurisdiction.
           </div>
        </div>

        <div className={cn("text-center text-gray-400", isPreview ? "text-[4px] mt-1 pb-1" : "text-xs mt-3 pb-1")}>This is a digitally signed document.</div>

      </div>
    </div>
  );
}
