import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

export function MrpDiscountTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "27BDLEP3838R2UT";
  const companyAddress = settings?.company_address || "35/4, Datta Nagar Road Katraj Bypass Road\nOpposite Trimurti Garden Ambegaon Budruk\nPune, MAHARASHTRA, 411046";
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
  const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
  const roundOff = invoice?.grand_total ? +(invoice.grand_total - Math.round(invoice.grand_total)).toFixed(2) : 0;
  
  const isPaid = (invoice?.balance_amount || 0) === 0 && (invoice?.grand_total || 0) > 0;

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
      isPreview ? "h-full rounded-2xl shadow-2xl p-5 text-[5px]" : "min-h-[1056px] print:min-h-0 text-xs p-10 print:p-2"
    )}>
      
      {/* Header */}
      <div className={cn("flex justify-between items-start", isPreview ? "mb-3" : "mb-6")}>
        <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
           <span className={cn("font-bold tracking-widest block text-gray-900", isPreview ? "text-[7px] mb-1" : "text-xl mb-2")}>TAX INVOICE</span>
           <span className={cn("font-bold text-gray-900 uppercase", isPreview ? "text-[8px]" : "text-2xl")}>{companyName}</span>
           <span className={cn("font-bold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN {companyGst}</span>
           <span className="text-gray-600 whitespace-pre-wrap">{companyAddress}</span>
           {companyPhone && <span className="font-bold">Mobile {companyPhone}</span>}
        </div>
        <div className="flex flex-col items-end">
           <span className={cn("text-gray-500 uppercase font-semibold tracking-wider", isPreview ? "text-[4px] mb-3" : "text-[10px] mb-6")}>Original For Recipient</span>
           <div className={cn("font-serif text-[#008953] font-bold tracking-tighter flex items-center", isPreview ? "text-[16px]" : "text-4xl")}>
             INFI<div className={cn("bg-[#008953]", isPreview ? "w-3 h-3 mx-[2px]" : "w-8 h-8 mx-1")} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>Clothing
           </div>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className={cn("grid grid-cols-4 border-b border-gray-200 text-gray-600", isPreview ? "gap-2 mb-3 pb-2" : "gap-4 mb-4 pb-3")}>
         <div><span className="font-bold text-gray-800">Invoice #:</span> {invoice?.invoice_number || "PREVIEW"}</div>
         <div><span className="font-bold text-gray-800">Invoice Date:</span> <span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span></div>
         <div><span className="font-bold text-gray-800">Due Date:</span> <span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span></div>
         <div><span className="font-bold text-gray-800">Place of Supply:</span> <span className="font-bold text-gray-900">{placeOfSupply}</span></div>
      </div>

      {/* Customer / Billing Details */}
      <div className={cn("grid grid-cols-2", isPreview ? "gap-2 mb-3 text-[4.5px]" : "gap-6 mb-6 text-xs")}>
        <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
          <span className={cn("text-gray-500 font-semibold", isPreview ? "mb-[2px]" : "mb-1")}>Customer Details:</span>
          <span className="font-semibold text-gray-900 uppercase">{customerName}</span>
          {hasDistinctCompany && (
            <span className="font-bold text-gray-900 uppercase">{customerCompany}</span>
          )}
          {gstin && <span className="font-bold text-gray-900">GSTIN: {gstin}</span>}
          {panNumber && <span className="font-bold text-gray-900">PAN: {panNumber}</span>}
          {invoice?.customer_mobile && <span className="text-gray-600"><span className="font-semibold text-gray-800">Ph:</span> {invoice.customer_mobile}</span>}
        </div>
        <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
          <span className={cn("text-gray-500 font-semibold", isPreview ? "mb-[2px]" : "mb-1")}>Billing Address:</span>
          <span className="text-gray-600 leading-[1.2] whitespace-pre-wrap">{invoice?.customer_address || invoice?.shipping_address || "Billing Address"}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className={cn("flex flex-col flex-1 border-gray-800", isPreview ? "border-t-2 border-b-2 pb-1 mb-2" : "border-t-4 border-b-4 pb-3 mb-4")}>
         <div className={cn("flex font-bold border-gray-800", isPreview ? "px-1 py-[3px] border-b-2 text-[4px]" : "px-3 py-3 border-b-4 text-xs")}>
           <div className={cn(isPreview ? "w-3" : "w-10")}>#</div>
           <div className="flex-[2]">Item</div>
           <div className={cn("text-center", isPreview ? "w-10" : "w-20")}>HSN/SAC</div>
           <div className={cn("text-right", isPreview ? "w-10" : "w-20")}>Rate/Item</div>
           <div className={cn("text-center", isPreview ? "w-8" : "w-20")}>Qty</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>Taxable Value</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28")}>Tax Amount</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-28")}>Amount</div>
         </div>
         {items.map((item: any, idx: number) => {
           const itemGstRate = item.tax_rate ?? gstRate;
           const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
           const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
           const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
           const unit = item.unit || "BDL";

           return (
             <div key={idx} className={cn("flex border-b border-gray-100", isPreview ? "px-1 py-1 text-[4px]" : "px-3 py-2 text-xs")}>
               <div className={cn("text-gray-500", isPreview ? "w-3" : "w-10")}>{idx + 1}</div>
               <div className={cn("flex-[2] flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
                 <span className="font-bold">{item.bundle_name || "Item"}</span>
               </div>
               <div className={cn("text-center text-gray-600", isPreview ? "w-10" : "w-20")}>{item.hsn_code || "-"}</div>
               <div className={cn("text-right font-medium", isPreview ? "w-10" : "w-20")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
               <div className={cn("text-center font-semibold", isPreview ? "w-8" : "w-20")}>{item.quantity || 1} {unit}</div>
               <div className={cn("text-right font-medium", isPreview ? "w-12" : "w-28")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
               <div className={cn("text-right text-gray-700", isPreview ? "w-14" : "w-28")}>
                 {formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)
               </div>
               <div className={cn("text-right font-bold text-gray-900", isPreview ? "w-12" : "w-28")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
             </div>
           );
         })}

         {/* Totals Section */}
         <div className={cn("mt-auto flex border-t border-gray-200 break-inside-avoid print:break-inside-avoid", isPreview ? "px-1 pt-1" : "px-3 pt-3")}>
           <div className={cn("flex-1 text-gray-600 self-end", isPreview ? "text-[4px] mb-1" : "text-[11px] mb-2")}>
             Total items / Qty : {totalItems} / {totalQty}
           </div>
           <div className={cn("text-right flex flex-col", isPreview ? "w-56 gap-[2px]" : "w-80 gap-1")}>
             <div className={cn("flex justify-between font-bold border-b border-gray-200", isPreview ? "text-[6px] mb-1 pb-1" : "text-base mb-2 pb-1")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
             <div className={cn("flex justify-between text-gray-600", isPreview ? "text-[4px]" : "text-[11px]")}><span>Taxable Amount</span><span>{formatCurrency(invoice?.subtotal || 0)}</span></div>
             {isIgst ? (
               <div className={cn("flex justify-between text-gray-600", isPreview ? "text-[4px]" : "text-[11px]")}><span>IGST {igstRate}%</span><span>{formatCurrency(invoice?.igst_amount || 0)}</span></div>
             ) : (
               <>
                 <div className={cn("flex justify-between text-gray-600", isPreview ? "text-[4px]" : "text-[11px]")}><span>CGST {cgstRate}%</span><span>{formatCurrency(invoice?.cgst_amount || 0)}</span></div>
                 <div className={cn("flex justify-between text-gray-600", isPreview ? "text-[4px]" : "text-[11px]")}><span>SGST {sgstRate}%</span><span>{formatCurrency(invoice?.sgst_amount || 0)}</span></div>
               </>
             )}
             {roundOff !== 0 && <div className={cn("flex justify-between text-gray-600", isPreview ? "text-[4px]" : "text-[11px]")}><span>Round Off</span><span>{roundOff}</span></div>}
           </div>
         </div>
         
         <div className={cn("flex justify-between border-t border-gray-200 text-gray-600 break-inside-avoid print:break-inside-avoid", isPreview ? "pt-1 mt-1 text-[4px]" : "pt-2 mt-2 text-[11px]")}>
           <span>Invoice Amount (in words):</span>
           <span>INR <span className="font-bold text-gray-900">{numberToWords(invoice?.grand_total || 0)}</span></span>
         </div>
         
         <div className={cn("flex justify-end break-inside-avoid print:break-inside-avoid", isPreview ? "pt-1 gap-8 text-[5px] mb-1" : "pt-2 gap-16 text-sm mb-2")}>
           <div className={cn("flex flex-col text-right", isPreview ? "gap-1" : "gap-1")}>
             <div className={cn("flex justify-between", isPreview ? "gap-4" : "gap-8")}><span className="font-bold">Amount Payable:</span><span className={cn("font-bold text-gray-900", isPreview ? "text-[6px]" : "text-base")}>{formatCurrency(invoice?.grand_total || 0)}</span></div>
             {isPaid && (
               <div className={cn("flex justify-between text-green-600", isPreview ? "gap-4" : "gap-8")}><span className="font-bold">Amount Paid:</span><span className={cn("font-bold", isPreview ? "text-[6px]" : "text-base")}>{formatCurrency(invoice?.grand_total || 0)}</span></div>
             )}
           </div>
         </div>
      </div>

      {/* Footer Grid */}
      <div className={cn("flex break-inside-avoid print:break-inside-avoid", isPreview ? "mb-2 text-[4.5px]" : "mb-4 text-xs")}>
         <div className={cn("flex-1", isPreview ? "pr-2" : "pr-6")}>
           <span className={cn("font-bold block", isPreview ? "mb-1" : "mb-2")}>Pay using UPI:</span>
           <div className={cn("bg-black/5 flex items-center justify-center p-[2px] rounded-sm", isPreview ? "w-10 h-10" : "w-20 h-20")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
         </div>
         <div className={cn("flex-[2] flex flex-col", isPreview ? "gap-[2px]" : "gap-1")}>
           <span className={cn("font-bold block", isPreview ? "mb-1" : "mb-2")}>Bank Details:</span>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>IFSC:</span><span className="font-semibold">{bankIfsc}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
         </div>
         <div className="flex-1 flex flex-col items-center justify-end">
            <span className={cn("text-gray-400", isPreview ? "text-[4px] mb-4" : "text-[10px] mb-8")}>For {companyName}</span>
            <div className={cn("border border-blue-900 rounded-full flex items-center justify-center opacity-60", isPreview ? "w-10 h-10" : "w-20 h-20")}>
               <span className={cn("text-blue-900 font-bold tracking-widest -rotate-12", isPreview ? "text-[3px]" : "text-[8px]")}>SIGNATURE</span>
            </div>
            <span className={cn("text-gray-400", isPreview ? "text-[3px] mt-1" : "text-[10px] mt-1")}>Authorized Signatory</span>
         </div>
      </div>

      <div className={cn("flex flex-col text-gray-600 break-inside-avoid print:break-inside-avoid", isPreview ? "gap-[2px] text-[4px]" : "gap-1 text-[10px]")}>
         <span className="font-bold text-gray-800">Notes:</span>
         <span>{invoice?.notes || "Thank you for the Business"}</span>
         <span className={cn("font-bold text-gray-800", isPreview ? "mt-[2px]" : "mt-1")}>Terms and Conditions:</span>
         <span>1. Goods once sold cannot be taken back or exchanged.</span>
         <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
         <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
         <span>4. Subject to local jurisdiction.</span>
      </div>

      <div className={cn("text-left text-gray-400 flex items-center font-semibold", isPreview ? "mt-2 text-[4px] pt-1 gap-1" : "mt-3 text-xs pt-2 gap-2")}>
        Page 1/1 <span className="font-normal text-gray-500">This is a digitally signed document.</span>
      </div>

    </div>
  );
}
