import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

export function ModernTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "26ADCDE3838R1ZQ";
  const companyAddress = settings?.company_address || "Q-city, 2nd Floor-Block A & Block B Survey Number-109,110,111/2, Nanakramguda Village Serlingampally Mandal, Ranga Reddy Dist. Hyderabad, TELANGANA, 500032";
  const companyPhone = settings?.phone_number || "9999999999";
  const companyEmail = settings?.email || "swipe@getswipe.in";

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
  const gstRate = invoice?.gst_rate ?? 5;
  
  const items = invoice?.items || [];
  const totalItems = items.length;
  const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
  const roundOff = invoice?.grand_total ? +(invoice.grand_total - Math.round(invoice.grand_total)).toFixed(2) : 0;
  
  return (
    <div className={cn(
      "w-full bg-white flex flex-col font-sans text-gray-900 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-3xl shadow-2xl p-5 text-[5px]" : "min-h-[1056px] rounded-3xl text-xs p-10 print:min-h-0 print:p-2 print:shadow-none print:ring-0 print:rounded-none print:text-[11px]"
    )}>
      
      {/* Header */}
      <div className={cn("flex justify-between items-start", isPreview ? "mb-3" : "mb-6 print:mb-3")}>
        <div className="flex flex-col">
           <span className={cn("font-bold tracking-widest block", isPreview ? "text-[7px] mb-1" : "text-xl mb-2 print:text-base print:mb-1")}>TAX INVOICE</span>
           <span className={cn("font-bold uppercase", isPreview ? "text-[8px]" : "text-2xl print:text-lg")}>{companyName}</span>
           <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN: {companyGst}</span>
           <span className={cn("text-gray-600 leading-tight", isPreview ? "mt-[1px] w-48" : "mt-1 w-96 print:w-80")}>{companyAddress}</span>
           <span className={cn("text-gray-600", isPreview ? "mt-1" : "mt-1.5")}><span className="font-semibold text-black">Mobile</span> {companyPhone} {companyEmail && <><span className="font-semibold text-black ml-1">Email</span> {companyEmail}</>}</span>
        </div>
        <div className="text-right flex flex-col items-end">
           <span className={cn("text-gray-500 uppercase font-semibold", isPreview ? "text-[4px] mb-1" : "text-[10px] mb-2 print:mb-1")}>Original For Recipient</span>
           <div className={cn("relative", isPreview ? "mt-1" : "mt-2")}>
             <span className={cn("font-bold tracking-tighter lowercase text-blue-950", isPreview ? "text-xl" : "text-4xl print:text-3xl")}>{companyName}</span>
           </div>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className={cn("grid grid-cols-3", isPreview ? "gap-2 mb-2 pb-1 text-[5px]" : "gap-4 mb-4 pb-2 text-sm print:mb-2 print:pb-1 print:gap-2")}>
         <div className="flex flex-col"><span className={cn("text-gray-500", isPreview ? "mb-[1px]" : "mb-0.5")}>Invoice #:</span> <span className="font-bold">{invoice?.invoice_number || "PREVIEW"}</span></div>
         <div className="flex flex-col"><span className={cn("text-gray-500", isPreview ? "mb-[1px]" : "mb-0.5")}>Invoice Date:</span> <span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span></div>
         <div className="flex flex-col"><span className={cn("text-gray-500", isPreview ? "mb-[1px]" : "mb-0.5")}>Due Date:</span> <span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span></div>
      </div>

      {/* Customer / Billing Details */}
      <div className={cn("grid grid-cols-2", isPreview ? "gap-2 mb-3 text-[4.5px]" : "gap-4 mb-4 text-xs print:mb-2 print:gap-2")}>
        <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-0.5")}>
          <span className={cn("text-gray-500 font-semibold", isPreview ? "mb-[2px]" : "mb-0.5")}>Customer Details:</span>
          <span className="font-semibold uppercase text-black">{customerName}</span>
          {hasDistinctCompany && (
            <span className="font-bold text-black uppercase">{customerCompany}</span>
          )}
          {gstin && (
            <span className="font-bold text-gray-900">
              GSTIN: <span className="font-mono font-bold">{gstin}</span>
            </span>
          )}
          {panNumber && (
            <span className="font-bold text-gray-900">
              PAN: <span className="font-mono font-bold">{panNumber}</span>
            </span>
          )}
          {invoice?.customer_mobile && <span className="text-gray-600"><span className="font-semibold text-gray-800">Ph:</span> {invoice.customer_mobile}</span>}
          <span className={cn("text-gray-700 font-semibold", isPreview ? "mt-1" : "mt-2")}>Place of Supply: <span className="font-bold text-black ml-1">{placeOfSupply}</span></span>
        </div>
        <div className={cn("flex flex-col", isPreview ? "gap-[1px]" : "gap-0.5")}>
          <span className={cn("text-gray-500 font-semibold", isPreview ? "mb-[2px]" : "mb-0.5")}>Billing Address:</span>
          <span className="text-gray-600 leading-[1.2] whitespace-pre-wrap">{invoice?.customer_address || invoice?.shipping_address || "Billing Address"}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className={cn("flex flex-col flex-1 border-black", isPreview ? "border-t-2 border-b-2 pb-1 mb-2" : "border-t-4 border-b-4 pb-3 mb-4 print:border-t-2 print:border-b-2 print:pb-2 print:mb-2")}>
         <div className={cn("flex font-bold border-gray-300 text-gray-600", isPreview ? "px-1 py-[3px] border-b text-[4px]" : "px-3 py-2 border-b-2 text-[10px] print:py-1.5 print:px-2")}>
           <div className={cn(isPreview ? "w-3" : "w-10 print:w-8")}>#</div>
           <div className="flex-[2]">Item</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-24 print:w-20")}>Rate/Item</div>
           <div className={cn("text-center", isPreview ? "w-8" : "w-20 print:w-16")}>Qty</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28 print:w-24")}>Taxable Value</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28 print:w-24")}>Tax Amount</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-28 print:w-24")}>Amount</div>
         </div>
         {items.map((item: any, idx: number) => {
            const itemGstRate = Number(item.gst_rate ?? gstRate ?? 5);
            const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
            const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
            const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
            const unit = item.unit || "BDL";

            return (
              <div key={idx} className={cn("flex border-b border-gray-100", isPreview ? "px-1 py-1 text-[4.5px]" : "px-3 py-2 text-xs print:py-1.5 print:px-2")}>
                <div className={cn(isPreview ? "w-3" : "w-10 print:w-8")}>{idx + 1}</div>
                <div className={cn("flex-[2] flex flex-col", isPreview ? "gap-[1px]" : "gap-0.5")}>
                  <span className="font-bold">{item.bundle_name || "Item"}</span>
                  {item.hsn_code && <span className={cn("text-gray-500", isPreview ? "text-[4px]" : "text-[10px]")}>HSN: {item.hsn_code}</span>}
                </div>
                <div className={cn("text-right font-medium", isPreview ? "w-12" : "w-24 print:w-20")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
                <div className={cn("text-center font-bold", isPreview ? "w-8" : "w-20 print:w-16")}>{item.quantity || 1} {unit}</div>
                <div className={cn("text-right font-medium", isPreview ? "w-14" : "w-28 print:w-24")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
                <div className={cn("text-right text-gray-600", isPreview ? "w-14 text-[4px]" : "w-28 text-[10px] print:w-24")}>{formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)</div>
                <div className={cn("text-right font-bold", isPreview ? "w-14" : "w-28 print:w-24")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
              </div>
            );
         })}

         {/* Totals Section */}
         <div className={cn("mt-auto flex border-gray-300 break-inside-avoid print:break-inside-avoid", isPreview ? "px-1 pt-1 border-t" : "px-3 pt-3 border-t-2 print:pt-2")}>
           <div className={cn("flex-1 text-gray-500 self-end border-gray-300", isPreview ? "text-[4px] mb-1 border-t pt-1" : "text-[10px] mb-1 border-t-2 pt-1")}>
             Total items / Qty : {totalItems} / {totalQty}
           </div>
           <div className={cn("text-right flex flex-col", isPreview ? "w-56 gap-[2px]" : "w-80 gap-0.5")}>
             <div className={cn("flex justify-between font-bold text-gray-800", isPreview ? "text-[4px]" : "text-[10px]")}><span>Taxable Amount</span><span>{formatCurrency(invoice?.subtotal || 0)}</span></div>
             {isIgst ? (
               <div className={cn("flex justify-between font-bold text-gray-800 border-gray-300", isPreview ? "text-[4px] border-b pb-0.5" : "text-[10px] border-b-2 pb-1")}><span>IGST {igstRate}%</span><span>{formatCurrency(invoice?.igst_amount || 0)}</span></div>
             ) : (
               <>
                 <div className={cn("flex justify-between font-bold text-gray-800", isPreview ? "text-[4px]" : "text-[10px]")}><span>CGST {cgstRate}%</span><span>{formatCurrency(invoice?.cgst_amount || 0)}</span></div>
                 <div className={cn("flex justify-between font-bold text-gray-800 border-gray-300", isPreview ? "text-[4px] border-b pb-0.5" : "text-[10px] border-b-2 pb-1")}><span>SGST {sgstRate}%</span><span>{formatCurrency(invoice?.sgst_amount || 0)}</span></div>
               </>
             )}
             {roundOff !== 0 && <div className={cn("flex justify-between font-bold text-gray-800 border-gray-300", isPreview ? "text-[4px] border-b pb-0.5" : "text-[10px] border-b-2 pb-1")}><span>Round Off</span><span>{roundOff}</span></div>}
             
             <div className={cn("flex justify-between font-bold border-gray-300", isPreview ? "text-[6px] py-0.5 border-b" : "text-xl py-1.5 border-b-2 print:text-base")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
             <div className={cn("text-gray-600 italic text-right", isPreview ? "text-[4px] mt-0.5" : "text-[10px] mt-1")}>
               Total amount (in words): INR {numberToWords(invoice?.grand_total || 0)}
             </div>
           </div>
         </div>
         
         <div className={cn("flex justify-end border-gray-300", isPreview ? "pt-1 gap-8 text-[5px] mt-1 border-t" : "pt-2 gap-16 text-sm mt-2 border-t-2")}>
           <div className={cn("flex justify-between", isPreview ? "w-48" : "w-80")}><span className="font-bold text-gray-600">Amount Payable:</span><span className={cn("font-bold", isPreview ? "" : "text-lg print:text-base")}>{formatCurrency(invoice?.grand_total || 0)}</span></div>
         </div>
      </div>

      {/* Footer Grid */}
      <div className={cn("flex break-inside-avoid print:break-inside-avoid", isPreview ? "mb-2 text-[4.5px]" : "mb-4 text-xs print:mb-2")}>
         <div className={cn("flex flex-col items-center", isPreview ? "w-16 pr-2" : "w-32 pr-4")}>
           <span className={cn("font-bold block w-full", isPreview ? "mb-1" : "mb-2")}>Pay using UPI:</span>
           <div className={cn("bg-black/5 flex items-center justify-center p-[2px] rounded-sm", isPreview ? "w-10 h-10" : "w-20 h-20 print:w-16 print:h-16")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
         </div>
         <div className={cn("flex-[2] flex flex-col", isPreview ? "gap-[2px]" : "gap-0.5")}>
           <span className={cn("font-bold block", isPreview ? "mb-1" : "mb-2")}>Bank Details:</span>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>IFSC:</span><span className="font-semibold font-mono">{bankIfsc}</span></div>
           <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
         </div>
         <div className="flex-1 flex flex-col items-center justify-end">
            <span className={cn("text-gray-400", isPreview ? "text-[4px] mb-4" : "text-[10px] mb-6 print:mb-2")}>For {companyName}</span>
            <div className={cn("border border-blue-900 rounded-full flex items-center justify-center opacity-60", isPreview ? "w-8 h-8" : "w-20 h-20 print:w-14 print:h-14")}>
               <span className={cn("text-blue-900 font-bold tracking-widest -rotate-12", isPreview ? "text-[3px]" : "text-[8px]")}>SIGNATURE</span>
            </div>
            <span className={cn("text-gray-400", isPreview ? "text-[3px] mt-0.5" : "text-[10px] mt-1")}>Authorized Signatory</span>
         </div>
      </div>

      <div className={cn("flex flex-col text-gray-600 break-inside-avoid print:break-inside-avoid", isPreview ? "gap-[2px] text-[4px]" : "gap-0.5 text-[10px]")}>
         <span className="font-bold text-gray-800">Notes:</span>
         <span>{invoice?.notes || "Thank you for the Business"}</span>
         <span className={cn("font-bold text-gray-800", isPreview ? "mt-[2px]" : "mt-1")}>Terms and Conditions:</span>
         <span>1. Goods once sold cannot be taken back or exchanged.</span>
         <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
         <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
         <span>4. Subject to local jurisdiction.</span>
      </div>

      <div className={cn("text-left text-gray-400 flex items-center font-semibold break-inside-avoid print:break-inside-avoid", isPreview ? "mt-1 text-[4px] pt-1 gap-1" : "mt-2 text-xs pt-2 gap-2")}>
        Page 1/1 <span className="font-normal text-gray-500">This is a digitally signed document.</span>
      </div>

    </div>
  );
}
