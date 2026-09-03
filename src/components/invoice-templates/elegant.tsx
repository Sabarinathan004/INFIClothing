import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";

export function ElegantTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "27AABCT2727Q1ZW";
  const companyAddress = settings?.company_address || "Olympia Building, 66/1\nBagmane TechPark\nBengaluru, KARNATAKA, 560093";
  const companyPhone = settings?.phone_number || "9999999999";

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
  const totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
  const roundOff = invoice?.grand_total ? +(invoice.grand_total - Math.round(invoice.grand_total)).toFixed(2) : 0;
  
  const isPaid = (invoice?.balance_amount || 0) === 0 && (invoice?.grand_total || 0) > 0;

  return (
    <div className={cn(
      "w-full bg-white flex flex-col font-sans text-gray-900 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-2xl shadow-2xl p-5 text-[5px]" : "min-h-[1056px] text-xs p-10"
    )}>
      
      {/* Header */}
      <div className={cn("flex justify-between items-start border-black", isPreview ? "mb-4 border-b-2 pb-3" : "mb-8 border-b-4 pb-6")}>
        <div className={cn("flex items-center", isPreview ? "gap-4" : "gap-8")}>
          <div className={cn("flex items-center justify-center font-black italic tracking-tighter transform -skew-x-12 bg-black text-white px-2 py-1", isPreview ? "text-xl" : "text-4xl")}>
            INFI
          </div>
          <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
             <span className={cn("font-bold uppercase", isPreview ? "text-[7px]" : "text-lg")}>{companyName}</span>
             <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN {companyGst}</span>
             <span className={cn("text-gray-600 whitespace-pre-wrap", isPreview ? "mt-[1px]" : "mt-1")}>{companyAddress}</span>
             {companyPhone && <span className="font-semibold">Mobile {companyPhone}</span>}
          </div>
        </div>
        <div className={cn("text-right flex flex-col items-end", isPreview ? "pt-1" : "pt-2")}>
           <span className={cn("font-bold tracking-widest", isPreview ? "text-[7px]" : "text-2xl")}>TAX INVOICE</span>
           <span className={cn("text-gray-500 uppercase", isPreview ? "text-[4px]" : "text-[10px]")}>Original For Recipient</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className={cn("flex justify-between", isPreview ? "mb-4" : "mb-8")}>
        <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
          <span className={cn("font-bold", isPreview ? "mb-[2px]" : "mb-1")}>Bill To:</span>
          <span className={cn("font-bold", isPreview ? "text-[6px]" : "text-sm")}>{invoice?.customer_name || "Customer Name"}</span>
          {invoice?.customer_mobile && <span className="font-semibold">Ph: {invoice.customer_mobile}</span>}
          <span className={cn("text-gray-600 whitespace-pre-wrap", isPreview ? "mt-[1px]" : "mt-1")}>{invoice?.customer_address || "Customer Address"}</span>
          
          <span className={cn("font-bold", isPreview ? "mt-2 mb-[2px]" : "mt-4 mb-1")}>Ship To:</span>
          <span className="text-gray-600 whitespace-pre-wrap">{invoice?.shipping_address || invoice?.customer_address || "Shipping Address"}</span>
        </div>
        <div className={cn("grid grid-cols-[auto_auto] text-right h-fit", isPreview ? "gap-x-3 gap-y-[2px] mt-2" : "gap-x-6 gap-y-1 mt-4")}>
           <span className="text-gray-600">Invoice #:</span><span className="font-bold">{invoice?.invoice_number || "PREVIEW"}</span>
           <span className="text-gray-600">Invoice Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
           <span className="text-gray-600">Due Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
           <span className={cn("text-gray-600", isPreview ? "mt-1" : "mt-2")}>Place of Supply:</span><span className={cn("font-bold", isPreview ? "mt-1" : "mt-2")}>{customerLocation}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className={cn("flex flex-col flex-1", isPreview ? "mb-2" : "mb-4")}>
         <div className={cn("flex bg-black text-white font-bold", isPreview ? "px-2 py-[4px] text-[5px]" : "px-4 py-3 text-sm")}>
           <div className={cn(isPreview ? "w-4" : "w-12")}>#</div>
           <div className="flex-1">Item</div>
           <div className={cn("text-center", isPreview ? "w-14" : "w-32")}>HSN/SAC</div>
           <div className={cn("text-right", isPreview ? "w-16" : "w-32")}>Rate/Item</div>
           <div className={cn("text-center", isPreview ? "w-10" : "w-24")}>Qty</div>
           <div className={cn("text-right", isPreview ? "w-16" : "w-32")}>Amount</div>
         </div>
         {items.map((item: any, idx: number) => (
           <div key={idx} className={cn("flex border-b border-gray-200", isPreview ? "px-2 py-2" : "px-4 py-3")}>
             <div className={cn("font-bold", isPreview ? "w-4" : "w-12")}>{idx + 1}</div>
             <div className={cn("flex-1 flex flex-col", isPreview ? "gap-[2px]" : "gap-1")}>
               <span className="font-bold">{item.bundle_name || "Item"}</span>
             </div>
             <div className={cn("text-center", isPreview ? "w-14" : "w-32")}>{item.hsn_code || "-"}</div>
             <div className={cn("text-right font-semibold", isPreview ? "w-16" : "w-32")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
             <div className={cn("text-center", isPreview ? "w-10" : "w-24")}>{item.quantity || 1}</div>
             <div className={cn("text-right font-semibold", isPreview ? "w-16" : "w-32")}>{formatCurrency(item.amount || 0).replace('₹', '')}</div>
           </div>
         ))}

         {/* Totals Section */}
         <div className={cn("mt-auto flex justify-end", isPreview ? "px-2 pt-2" : "px-4 pt-4")}>
           <div className={cn("text-right flex flex-col", isPreview ? "w-48 gap-[3px]" : "w-80 gap-1")}>
             <div className="flex justify-between"><span className="font-semibold text-gray-600">Taxable Amount</span><span className="font-bold">{formatCurrency(invoice?.subtotal || 0)}</span></div>
             {isIgst ? (
               <div className="flex justify-between"><span className="font-semibold text-gray-600">IGST {igstRate}%</span><span className="font-bold">{formatCurrency(invoice?.igst_amount || 0)}</span></div>
             ) : (
               <>
                 <div className="flex justify-between"><span className="font-semibold text-gray-600">CGST {cgstRate}%</span><span className="font-bold">{formatCurrency(invoice?.cgst_amount || 0)}</span></div>
                 <div className="flex justify-between"><span className="font-semibold text-gray-600">SGST {sgstRate}%</span><span className="font-bold">{formatCurrency(invoice?.sgst_amount || 0)}</span></div>
               </>
             )}
             {roundOff !== 0 && <div className="flex justify-between"><span className="font-semibold text-gray-600">Round Off</span><span className="font-bold">{roundOff}</span></div>}
             <div className={cn("flex justify-between font-bold border-black", isPreview ? "text-[7px] mt-1 pt-1 border-t-2" : "text-xl mt-2 pt-2 border-t-4")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
           </div>
         </div>
         
         <div className={cn("flex justify-between border-t border-b border-gray-300 text-gray-500", isPreview ? "py-1 mt-2 text-[4px]" : "py-3 mt-4 text-[10px]")}>
           <span>Total items / Qty : {totalItems} / {totalQty}</span>
           <span>Total amount (in words): INR {numberToWords(invoice?.grand_total || 0)} Only.</span>
         </div>
         
         <div className={cn("flex justify-end border-black", isPreview ? "pt-1 mb-2 border-b-2 pb-2" : "pt-4 mb-6 border-b-4 pb-6")}>
           <div className={cn("flex items-center", isPreview ? "gap-10" : "gap-24")}><span className={cn("font-semibold text-gray-600", isPreview ? "text-[5px]" : "text-sm")}>Amount Payable:</span><span className={cn("font-bold", isPreview ? "text-[6px]" : "text-xl")}>{formatCurrency(invoice?.grand_total || 0)}</span></div>
         </div>
      </div>

      {/* Footer Info */}
      <div className={cn("flex justify-between", isPreview ? "mb-4 mt-2" : "mb-8 mt-4")}>
         <div className={cn("flex", isPreview ? "gap-4" : "gap-8")}>
           <div className="flex flex-col">
             <span className={cn("font-bold", isPreview ? "mb-1" : "mb-3")}>Pay using UPI:</span>
             <div className={cn("bg-black/5 flex items-center justify-center p-[2px] rounded", isPreview ? "w-12 h-12" : "w-24 h-24")}><div className="w-full h-full bg-black/70 pattern-dots" /></div>
           </div>
           <div className={cn("flex flex-col", isPreview ? "gap-[2px]" : "gap-1")}>
             <span className={cn("font-bold", isPreview ? "mb-1" : "mb-3")}>Bank Details:</span>
             <div className="flex"><span className={cn("text-gray-600", isPreview ? "w-12" : "w-24")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
             <div className="flex"><span className={cn("text-gray-600", isPreview ? "w-12" : "w-24")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
             <div className="flex"><span className={cn("text-gray-600", isPreview ? "w-12" : "w-24")}>IFSC:</span><span className="font-semibold">{bankIfsc}</span></div>
             <div className="flex"><span className={cn("text-gray-600", isPreview ? "w-12" : "w-24")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
           </div>
         </div>
         <div className={cn("flex flex-col items-center justify-end", isPreview ? "pb-2" : "pb-4")}>
            <span className={cn("text-gray-400", isPreview ? "text-[4px] mb-6" : "text-[10px] mb-12")}>For {companyName}</span>
            <div className={cn("border border-blue-800 rounded-full flex items-center justify-center opacity-60 transform -rotate-12", isPreview ? "w-10 h-10" : "w-24 h-24")}>
               <span className={cn("text-blue-800 font-bold tracking-widest", isPreview ? "text-[3px]" : "text-[8px]")}>SIGNATURE</span>
            </div>
         </div>
      </div>

      <div className={cn("flex flex-col text-gray-600 mt-auto", isPreview ? "gap-[2px] text-[4px]" : "gap-1 text-[10px]")}>
         <span className="font-bold text-gray-900">Notes:</span>
         <span>{invoice?.notes || "Thank you for the Business"}</span>
         <span className={cn("font-bold text-gray-900", isPreview ? "mt-[2px]" : "mt-2")}>Terms and Conditions:</span>
         <span>1. Goods once sold cannot be taken back or exchanged.</span>
         <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
         <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
         <span>4. Subject to local jurisdiction.</span>
      </div>

      <div className={cn("text-left text-gray-500 flex gap-1 font-semibold", isPreview ? "text-[4px] pt-2 mt-2" : "text-xs pt-4 mt-4")}>
        Page 1/1  <span className="font-normal text-gray-800">This is a digitally signed document</span>
      </div>

    </div>
  );
}
