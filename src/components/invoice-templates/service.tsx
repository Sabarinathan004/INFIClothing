import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

export function ServiceTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "36ABCCS2942R1ZR";
  const companyAddress = settings?.company_address || "Block 3, Indira Nagar, Gachibowli\nHyderabad, TELANGANA, 500032";
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
      "w-full bg-white flex flex-col font-sans text-gray-900 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-3xl shadow-2xl p-5 text-[5px]" : "min-h-[1056px] print:min-h-0 rounded-3xl text-xs p-10 print:p-2"
    )}>
      
      {/* Header */}
      <div className={cn("flex justify-between items-start", isPreview ? "mb-2" : "mb-3")}>
        <div className={cn("flex flex-col", isPreview ? "gap-[2px]" : "gap-1")}>
           <div className={cn("flex items-center font-serif font-medium tracking-tight italic text-[#E1306C]", isPreview ? "gap-1 text-[14px] mb-1" : "gap-2 text-2xl mb-2")}>
             <div className={cn("rounded-md border-2 border-[#E1306C] flex items-center justify-center relative", isPreview ? "w-5 h-5" : "w-8 h-8 border-2")}>
                <div className={cn("border-[#E1306C] rounded-full", isPreview ? "w-2.5 h-2.5 border-2" : "w-4 h-4 border-2")} />
                <div className={cn("absolute bg-[#E1306C] rounded-full", isPreview ? "top-[2px] right-[2px] w-[2px] h-[2px]" : "top-[3px] right-[3px] w-1 h-1")} />
             </div>
             {companyName}
           </div>
           <span className={cn("font-black tracking-widest text-gray-900", isPreview ? "text-[7px]" : "text-xl")}>TAX INVOICE</span>
        </div>
        <div className={cn("text-right flex flex-col items-end", isPreview ? "gap-[1px]" : "gap-1")}>
           <span className={cn("font-bold uppercase", isPreview ? "text-[7px]" : "text-base")}>{companyName}</span>
           <span className="font-bold">GSTIN {companyGst}</span>
           <span className="text-gray-600 whitespace-pre-wrap">{companyAddress}</span>
           {companyPhone && <span className={cn("font-bold", isPreview ? "mt-[1px]" : "mt-1")}>Mobile {companyPhone}</span>}
        </div>
      </div>

      <div className={cn("w-full bg-[#E1306C]", isPreview ? "h-[2px] mb-2" : "h-1 mb-4")} />

      {/* Details Grid */}
      <div className={cn("flex justify-between", isPreview ? "mb-3" : "mb-5")}>
        <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
          <span className={cn("font-bold text-gray-900", isPreview ? "mb-[2px]" : "mb-1")}>Bill To:</span>
          <span className={cn("font-semibold text-gray-900 uppercase", isPreview ? "text-[6px]" : "text-sm")}>{customerName}</span>
          {hasDistinctCompany && (
            <span className="font-bold text-gray-900 uppercase">{customerCompany}</span>
          )}
          {gstin && <span className="font-bold text-gray-900">GSTIN: {gstin}</span>}
          {panNumber && <span className="font-bold text-gray-900">PAN: {panNumber}</span>}
          {invoice?.customer_mobile && <span className="font-semibold">Ph: {invoice.customer_mobile}</span>}
          
          <span className={cn("font-bold text-gray-900", isPreview ? "mt-2 mb-[2px]" : "mt-3 mb-1")}>Billing Address:</span>
          <span className={cn("text-gray-600 whitespace-pre-wrap", isPreview ? "mt-[1px]" : "mt-1")}>{invoice?.customer_address || invoice?.shipping_address || "Billing Address"}</span>
        </div>
        <div className={cn("grid grid-cols-[auto_auto] text-right h-fit", isPreview ? "gap-x-3 gap-y-[2px] text-[4.5px]" : "gap-x-6 gap-y-1 text-xs")}>
           <span className="text-gray-500">Invoice #:</span><span className="font-bold text-gray-800">{invoice?.invoice_number || "PREVIEW"}</span>
           <span className="text-gray-500">Invoice Date:</span><span className="font-bold text-gray-800">{formatDateTime(invoice?.invoice_date)}</span>
           <span className="text-gray-500">Due Date:</span><span className="font-bold text-gray-800">{formatDateTime(invoice?.invoice_date)}</span>
           <span className={cn("text-gray-500", isPreview ? "mt-1" : "mt-2")}>Place of Supply:</span><span className={cn("font-bold text-gray-900", isPreview ? "mt-1" : "mt-2")}>{placeOfSupply}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className={cn("flex flex-col flex-1 border-gray-300", isPreview ? "border-b pb-1 mb-2" : "border-b-2 pb-3 mb-4")}>
         <div className={cn("flex bg-[#E1306C] text-white font-bold", isPreview ? "px-2 py-[4px] text-[5px]" : "px-3 py-2.5 text-xs")}>
           <div className={cn(isPreview ? "w-4" : "w-10")}>#</div>
           <div className="flex-1">Description</div>
           <div className={cn("text-center", isPreview ? "w-12" : "w-24")}>HSN/SAC</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-24")}>Rate</div>
           <div className={cn("text-center", isPreview ? "w-10" : "w-20")}>Qty</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28")}>Taxable Value</div>
           <div className={cn("text-right", isPreview ? "w-16" : "w-32")}>Tax Amount</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28")}>Amount</div>
         </div>
         {items.map((item: any, idx: number) => {
           const itemGstRate = item.tax_rate ?? gstRate;
           const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
           const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
           const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
           const unit = item.unit || "BDL";

           return (
             <div key={idx} className={cn("flex border-b border-gray-100", isPreview ? "px-2 py-1 text-[4px]" : "px-3 py-2 text-xs")}>
               <div className={cn("font-bold text-gray-500", isPreview ? "w-4" : "w-10")}>{idx + 1}</div>
               <div className={cn("flex-1 flex flex-col", isPreview ? "gap-[1px]" : "gap-1")}>
                 <span className="font-bold">{item.bundle_name || "Item"}</span>
               </div>
               <div className={cn("text-center text-gray-700", isPreview ? "w-12" : "w-24")}>{item.hsn_code || "-"}</div>
               <div className={cn("text-right font-medium", isPreview ? "w-12" : "w-24")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
               <div className={cn("text-center font-semibold", isPreview ? "w-10" : "w-20")}>{item.quantity || 1} {unit}</div>
               <div className={cn("text-right font-medium", isPreview ? "w-14" : "w-28")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
               <div className={cn("text-right text-gray-700", isPreview ? "w-16" : "w-32")}>
                 {formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)
               </div>
               <div className={cn("text-right font-bold text-gray-900", isPreview ? "w-14" : "w-28")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
             </div>
           );
         })}

         {/* Totals Section */}
         <div className={cn("mt-auto flex break-inside-avoid print:break-inside-avoid", isPreview ? "px-2 pt-1" : "px-3 pt-3")}>
           <div className={cn("flex-1 text-gray-600 self-end border-[#E1306C]/30", isPreview ? "text-[4px] mb-1 border-t pt-1" : "text-[11px] mb-2 border-t-2 pt-2")}>
             Total items / Qty : {totalItems} / {totalQty}
           </div>
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
             <div className={cn("flex justify-between font-bold border-black", isPreview ? "text-[7px] mt-1 pt-1 border-t-2" : "text-base mt-2 pt-1 border-t-2")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
           </div>
         </div>
         
         <div className={cn("flex justify-end text-gray-600 break-inside-avoid print:break-inside-avoid", isPreview ? "mt-1 text-[4px]" : "mt-3 text-[11px]")}>
           <span>Total amount (in words): INR <span className="font-bold text-gray-900">{numberToWords(invoice?.grand_total || 0)}</span></span>
         </div>
         
         <div className={cn("flex justify-end flex-col items-end break-inside-avoid print:break-inside-avoid", isPreview ? "pt-1 gap-[2px] mt-1 text-[5px]" : "pt-2 gap-1 mt-2 text-sm")}>
           <div className={cn("flex", isPreview ? "gap-4" : "gap-12")}><span className="text-gray-500">Amount Payable:</span><span className={cn("font-bold text-gray-900", isPreview ? "" : "text-base")}>{formatCurrency(invoice?.grand_total || 0)}</span></div>
           {isPaid && (
             <div className={cn("flex", isPreview ? "gap-4" : "gap-12")}><span className="text-gray-500">Amount Paid:</span><span className={cn("font-bold text-green-600", isPreview ? "" : "text-base")}>{formatCurrency(invoice?.grand_total || 0)}</span></div>
           )}
         </div>
      </div>

      {/* Footer Info */}
      <div className={cn("flex justify-between break-inside-avoid print:break-inside-avoid", isPreview ? "mb-2 mt-1" : "mb-4 mt-2")}>
         <div className={cn("flex", isPreview ? "gap-4" : "gap-8")}>
           <div className="flex flex-col">
             <span className={cn("font-bold", isPreview ? "mb-1" : "mb-2")}>Pay using UPI:</span>
             <div className={cn("bg-black/5 flex items-center justify-center p-[2px] rounded", isPreview ? "w-12 h-12" : "w-20 h-20")}><div className="w-full h-full bg-black/70 pattern-dots" /></div>
           </div>
           <div className={cn("flex flex-col", isPreview ? "gap-[2px]" : "gap-1")}>
             <span className={cn("font-bold", isPreview ? "mb-1" : "mb-2")}>Bank Details:</span>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>IFSC:</span><span className="font-semibold">{bankIfsc}</span></div>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
           </div>
         </div>
         <div className={cn("flex flex-col items-center justify-end", isPreview ? "pb-2 pr-2" : "pb-3 pr-4")}>
            <span className={cn("text-gray-400", isPreview ? "text-[4px] mb-4" : "text-[10px] mb-8")}>For {companyName}</span>
            <div className={cn("border border-blue-800 rounded-full flex items-center justify-center opacity-60 transform -rotate-12", isPreview ? "w-10 h-10" : "w-20 h-20")}>
               <span className={cn("text-blue-800 font-bold tracking-widest", isPreview ? "text-[3px]" : "text-[8px]")}>SIGNATURE</span>
            </div>
         </div>
      </div>

      <div className={cn("flex flex-col text-gray-500 mt-auto break-inside-avoid print:break-inside-avoid", isPreview ? "gap-[2px] text-[4px]" : "gap-1 text-[10px]")}>
         <span className="font-bold text-gray-800">Notes:</span>
         <span>{invoice?.notes || "Thank you for the Business"}</span>
         <span className={cn("font-bold text-gray-800", isPreview ? "mt-[2px]" : "mt-1")}>Terms and Conditions:</span>
         <span>1. Goods once sold cannot be taken back or exchanged.</span>
         <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
         <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
         <span>4. Subject to local jurisdiction.</span>
      </div>

      <div className={cn("text-left text-gray-500 flex gap-1 font-semibold", isPreview ? "text-[4px] pt-1 mt-1" : "text-xs pt-2 mt-2")}>
        Page 1/1  <span className="font-normal text-gray-800">This is a digitally signed document</span>
      </div>

    </div>
  );
}
