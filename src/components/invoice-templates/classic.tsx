import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

export function ClassicTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "27AAACT2727Q1ZW";
  const companyAddress = settings?.company_address || "DLF Centre, Sansad Marg 6th Floor\nDelhi, DELHI, 110001";
  const companyPhone = settings?.phone_number || "9999999999";

  const bankName = settings?.bank_name || "YES BANK";
  const bankAccount = settings?.bank_account_number || "66789999222445";
  const bankIfsc = settings?.bank_ifsc_code || "YESB0IN4567";
  const bankBranch = settings?.bank_branch || "Kodihalli";
  
  const customerName = (invoice?.legal_name || invoice?.customer_name || "Customer Name").toUpperCase();
  const customerCompany = (invoice?.trade_name || "").toUpperCase();
  const hasDistinctCompany = customerCompany && customerCompany !== customerName;

  const gstin = (
    invoice?.verification_type === "GST"
      ? invoice?.verification_number
      : (invoice?.verification_number?.length === 15 ? invoice?.verification_number : invoice?.customer_gst)
  )?.trim().toUpperCase() || (invoice?.customer_gst || "");

  const panNumber = (
    invoice?.pan_number ||
    (gstin && gstin.length === 15 ? gstin.substring(2, 12) : null) ||
    (invoice?.verification_type === "PAN" ? invoice?.verification_number : null)
  )?.trim().toUpperCase();

  const customerLocation = invoice?.customer_location || "Inside Tamil Nadu";
  const isIgst = customerLocation !== "Inside Tamil Nadu";
  const placeOfSupply =
    invoice?.place_of_supply ||
    getPlaceOfSupply(gstin) ||
    (customerLocation === "Inside Tamil Nadu" ? "33-TAMIL NADU" : customerLocation);

  const cgstRate = invoice?.cgst_rate ?? 2.5;
  const sgstRate = invoice?.sgst_rate ?? 2.5;
  const igstRate = invoice?.igst_rate ?? 5;
  
  const items = invoice?.items || [];
  const totalItems = items.length;
  const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
  const roundOff = invoice?.grand_total ? +(invoice.grand_total - Math.round(invoice.grand_total)).toFixed(2) : 0;

  return (
    <div className={cn(
      "w-full bg-white flex flex-col font-sans text-gray-900 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-2xl shadow-2xl p-4 text-[5px]" : "min-h-[1056px] text-xs p-10 print:min-h-0 print:p-2 print:shadow-none print:ring-0 print:text-[11px]"
    )}>
      
      {/* Header */}
      <div className={cn("flex justify-between items-start", isPreview ? "mb-2" : "mb-5 print:mb-3")}>
        <div className={cn("flex items-center", isPreview ? "gap-2" : "gap-6")}>
          <div className={cn("bg-blue-900 rounded-full flex items-center justify-center italic text-white font-bold tracking-wider relative -skew-x-12", isPreview ? "w-10 h-3 text-[6px]" : "w-32 h-10 text-xl print:w-24 print:h-8 print:text-base")}>
            INFI
          </div>
          <div className="flex flex-col">
             <span className={cn("font-bold", isPreview ? "text-[7px]" : "text-xl print:text-base")}>{companyName}</span>
             <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN: {companyGst}</span>
             <span className={cn("text-gray-500 whitespace-pre-wrap", isPreview ? "mt-[1px]" : "mt-1")}>{companyAddress}</span>
             {companyPhone && <span className="font-semibold">Mobile: {companyPhone}</span>}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
           <span className={cn("font-bold tracking-widest", isPreview ? "text-[7px]" : "text-xl print:text-base")}>TAX INVOICE</span>
           <span className={cn("text-gray-500 uppercase", isPreview ? "text-[4px] mb-1" : "text-[10px] mb-3 print:mb-1")}>Original For Recipient</span>
           <div className={cn("grid grid-cols-2 text-right mt-1", isPreview ? "gap-x-2" : "gap-x-6 gap-y-1 print:gap-x-3")}>
             <span className="text-gray-500">Invoice #:</span><span className="font-bold">{invoice?.invoice_number || "PREVIEW"}</span>
             <span className="text-gray-500">Invoice Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
             <span className="text-gray-500">Due Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
           </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className={cn("flex justify-between", isPreview ? "mb-2" : "mb-5 print:mb-3")}>
        <div className="flex flex-col max-w-[50%]">
          <span className={cn("text-gray-500 font-semibold", isPreview ? "mb-[2px]" : "mb-1")}>Bill To:</span>
          <span className="font-semibold uppercase text-black">{customerName}</span>
          {hasDistinctCompany && (
            <span className="font-bold uppercase text-black">{customerCompany}</span>
          )}
          {gstin && (
            <span className="font-bold mt-0.5 text-black">
              GSTIN: <span className="font-mono font-bold">{gstin}</span>
            </span>
          )}
          {panNumber && (
            <span className="font-bold mt-0.5 text-black">
              PAN: <span className="font-mono font-bold">{panNumber}</span>
            </span>
          )}
          {invoice?.customer_mobile && <span>Ph: {invoice.customer_mobile}</span>}
          <div className={cn(isPreview ? "mt-[2px]" : "mt-1")}>
            <span className="text-gray-500 font-semibold">Place of Supply:</span> <span className="font-bold text-black">{placeOfSupply}</span>
          </div>
        </div>
        <div className="flex flex-col text-right max-w-[45%]">
          <span className={cn("text-gray-500 font-semibold", isPreview ? "mb-[2px]" : "mb-1")}>Billing Address:</span>
          <span className={cn("text-gray-600 whitespace-pre-wrap", isPreview ? "mt-[1px]" : "mt-1")}>{invoice?.customer_address || invoice?.shipping_address || "Billing Address"}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className={cn("flex flex-col flex-1 border-blue-900", isPreview ? "border-t-2 border-b-2 pb-1 mb-2" : "border-t-4 border-b-4 pb-3 mb-5 print:border-t-2 print:border-b-2 print:pb-2 print:mb-3")}>
         <div className={cn("flex bg-blue-900 text-white font-bold", isPreview ? "px-1 py-[3px]" : "px-3 py-2 print:py-1.5 print:px-2")}>
           <div className={cn(isPreview ? "w-3" : "w-10 print:w-8")}>#</div>
           <div className="flex-[2]">Item</div>
           <div className={cn("text-center", isPreview ? "w-10" : "w-20 print:w-16")}>HSN/SAC</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-24 print:w-20")}>Rate</div>
           <div className={cn("text-center", isPreview ? "w-8" : "w-20 print:w-16")}>Qty</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28 print:w-24")}>Taxable Value</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28 print:w-24")}>Tax Amount</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28 print:w-24")}>Amount</div>
         </div>
         
         {items.map((item: any, idx: number) => {
           const itemGstRate = Number(item.gst_rate ?? invoice?.gst_rate ?? 5);
           const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
           const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
           const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
           const unit = item.unit || "BDL";

           return (
             <div key={idx} className={cn("flex border-b border-gray-100", isPreview ? "px-1 py-1" : "px-3 py-2 print:py-1.5 print:px-2")}>
               <div className={cn(isPreview ? "w-3" : "w-10 print:w-8")}>{idx + 1}</div>
               <div className={cn("flex-[2] flex flex-col", isPreview ? "gap-[2px]" : "gap-0.5")}>
                 <span className="font-bold">{item.bundle_name || "Item"}</span>
               </div>
               <div className={cn("text-center", isPreview ? "w-10" : "w-20 print:w-16")}>{item.hsn_code || "-"}</div>
               <div className={cn("text-right font-semibold", isPreview ? "w-12" : "w-24 print:w-20")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
               <div className={cn("text-center font-bold", isPreview ? "w-8" : "w-20 print:w-16")}>{item.quantity || 1} {unit}</div>
               <div className={cn("text-right font-medium", isPreview ? "w-14" : "w-28 print:w-24")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
               <div className={cn("text-right text-gray-700", isPreview ? "w-14" : "w-28 print:w-24")}>{formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)</div>
               <div className={cn("text-right font-bold", isPreview ? "w-14" : "w-28 print:w-24")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
             </div>
           );
         })}

         {/* Totals Section inside Table area */}
         <div className={cn("mt-auto flex justify-end break-inside-avoid print:break-inside-avoid", isPreview ? "px-1 py-1 text-[6px]" : "px-3 py-3 text-sm print:py-2")}>
           <div className={cn("text-right flex flex-col", isPreview ? "w-48 gap-[2px]" : "w-80 gap-1")}>
             <div className="flex justify-between"><span className="text-gray-500 font-semibold">Taxable Amount</span><span>{formatCurrency(invoice?.subtotal || 0)}</span></div>
             {isIgst ? (
               <div className="flex justify-between"><span className="text-gray-500 font-semibold">IGST {igstRate}%</span><span>{formatCurrency(invoice?.igst_amount || 0)}</span></div>
             ) : (
               <>
                 <div className="flex justify-between"><span className="text-gray-500 font-semibold">CGST {cgstRate}%</span><span>{formatCurrency(invoice?.cgst_amount || 0)}</span></div>
                 <div className="flex justify-between"><span className="text-gray-500 font-semibold">SGST {sgstRate}%</span><span>{formatCurrency(invoice?.sgst_amount || 0)}</span></div>
               </>
             )}
             {roundOff !== 0 && <div className="flex justify-between"><span className="text-gray-500 font-semibold">Round Off</span><span>{roundOff}</span></div>}
             <div className={cn("flex justify-between font-bold border-t border-gray-200", isPreview ? "text-[8px] mt-1 pt-1" : "text-lg mt-1 pt-1 print:text-base")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
           </div>
         </div>
         <div className={cn("flex justify-between text-gray-500", isPreview ? "px-1 text-[4px] mt-1" : "px-3 text-[10px] mt-2")}>
           <span>Total items / Qty : {totalItems} / {totalQty}</span>
           <span>Total amount (in words): INR {numberToWords(invoice?.grand_total || 0)}</span>
         </div>
         <div className={cn("flex justify-end", isPreview ? "px-1 mt-[2px]" : "px-3 mt-1")}>
           <div className={cn("flex", isPreview ? "gap-8" : "gap-16")}><span className={cn("text-gray-500", isPreview ? "text-[5px]" : "text-xs")}>Amount Payable:</span><span className={cn("font-bold", isPreview ? "text-[6px]" : "text-base")}>{formatCurrency(invoice?.grand_total || 0)}</span></div>
         </div>
      </div>

      {/* Footer Grid */}
      <div className={cn("flex break-inside-avoid print:break-inside-avoid", isPreview ? "mb-2 text-[5px]" : "mb-4 text-xs print:mb-2")}>
         <div className={cn("flex-[1.5]", isPreview ? "pr-2" : "pr-4")}>
           <span className={cn("font-bold block", isPreview ? "mb-1" : "mb-2")}>Pay using UPI:</span>
           <div className={cn("bg-black/10 flex items-center justify-center p-[2px] rounded-sm", isPreview ? "w-10 h-10" : "w-20 h-20 print:w-16 print:h-16")}><div className="w-full h-full bg-black/60" /></div>
         </div>
         <div className={cn("flex-[2] flex flex-col", isPreview ? "gap-[2px]" : "gap-0.5")}>
           <span className={cn("font-bold block", isPreview ? "mb-1" : "mb-2")}>Bank Details:</span>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-28")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-28")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-28")}>IFSC:</span><span className="font-semibold font-mono">{bankIfsc}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-28")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
         </div>
         <div className="flex-1 flex flex-col items-center justify-end">
            <span className={cn("text-gray-400", isPreview ? "text-[4px] mb-4" : "text-[10px] mb-6 print:mb-3")}>For {companyName}</span>
            <div className={cn("border border-blue-900 rounded-full flex items-center justify-center opacity-60", isPreview ? "w-8 h-8" : "w-20 h-20 print:w-14 print:h-14")}>
               <span className={cn("text-blue-900 font-bold tracking-widest -rotate-12", isPreview ? "text-[3px]" : "text-[8px]")}>SIGNATURE</span>
            </div>
         </div>
      </div>

      <div className={cn("flex flex-col text-gray-500 break-inside-avoid print:break-inside-avoid", isPreview ? "gap-[2px] text-[4px]" : "gap-0.5 text-[10px]")}>
         <span className="font-bold text-gray-800">Notes:</span>
         <span>{invoice?.notes || "Thank you for the Business"}</span>
         <span className={cn("font-bold text-gray-800", isPreview ? "mt-[2px]" : "mt-1")}>Terms and Conditions:</span>
         <span>1. Goods once sold cannot be taken back or exchanged.</span>
         <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
         <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
         <span>4. Subject to local jurisdiction.</span>
      </div>

      <div className={cn("text-center text-gray-400 border-t border-gray-100 flex items-center justify-center break-inside-avoid print:break-inside-avoid", isPreview ? "mt-1 text-[4px] pt-1 gap-1" : "mt-4 text-xs pt-2 gap-3 print:mt-2")}>
        Page 1/1 | <b>This is a digitally signed document</b> <span className="text-gray-300">| ORIGINAL FOR RECIPIENT</span>
      </div>

    </div>
  );
}
