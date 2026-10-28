import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

export function CompactTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI CLOTHING";
  const companyGst = settings?.gst_number || "27AABCT2727Q1ZW";
  const companyAddress = settings?.company_address || "54, Whitefield Main Rd, Palm Meadows\nKARNATAKA, 560066";
  const companyPhone = settings?.phone_number || "+91 9999999999";

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
      isPreview ? "h-full rounded-2xl shadow-2xl p-4 text-[4.5px]" : "min-h-[1056px] print:min-h-0 text-xs p-10 print:p-2"
    )}>
      
      {/* Top Details */}
      <div className={cn("flex justify-between items-end border-b border-gray-400", isPreview ? "pb-1 mb-1" : "pb-4 mb-4")}>
        <div className={cn("text-gray-500 font-bold uppercase tracking-widest", isPreview ? "text-[3px]" : "text-[10px]")}>Page 1/1</div>
        <div className={cn("font-bold tracking-widest text-gray-900", isPreview ? "text-[6px]" : "text-xl")}>TAX INVOICE</div>
        <div className={cn("text-gray-500 uppercase", isPreview ? "text-[3.5px]" : "text-[10px]")}>Original For Recipient</div>
      </div>

      <div className={cn("flex flex-col items-center justify-center border-b border-gray-400", isPreview ? "mb-2 pb-1" : "mb-5 pb-3")}>
        <div className={cn("bg-[#F26522] flex items-center justify-center font-bold text-white tracking-widest rounded-sm", isPreview ? "w-16 h-4 text-[5px] mb-1" : "w-40 h-8 text-sm mb-2")}>
          {companyName.toUpperCase()}
        </div>
        <span className={cn("font-bold uppercase", isPreview ? "text-[6px]" : "text-xl")}>{companyName}</span>
        <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN: {companyGst}</span>
        <span className={cn("text-gray-500 whitespace-pre-wrap text-center", isPreview ? "text-[4px]" : "text-[11px]")}>{companyAddress}</span>
        <span className={cn("font-semibold", isPreview ? "text-[4px]" : "text-[11px]")}>Mobile: {companyPhone}</span>
      </div>

      <div className={cn("flex border border-gray-400", isPreview ? "mb-1" : "mb-4")}>
        <div className={cn("flex-1 border-r border-gray-400 flex flex-col", isPreview ? "p-1 gap-[1px]" : "p-3 gap-1")}>
          <span className={cn("font-bold text-gray-900", isPreview ? "mb-[1px] text-[5px]" : "mb-1 text-sm")}>Customer Details:</span>
          <span className="font-semibold text-gray-900">{customerName}</span>
          {hasDistinctCompany && (
            <span className="font-bold text-gray-900 uppercase">{customerCompany}</span>
          )}
          {gstin && <span className="font-bold text-gray-900">GSTIN: {gstin}</span>}
          {panNumber && <span className="font-bold text-gray-900">PAN: {panNumber}</span>}
          <span className={cn("text-gray-500 font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>Billing Address:</span>
          <span className="text-gray-600 whitespace-pre-wrap">{invoice?.customer_address || "Customer Address"}</span>
          {invoice?.customer_mobile && <span className="font-semibold text-gray-800">Ph: {invoice.customer_mobile}</span>}
        </div>
        <div className={cn("flex-1 flex flex-col", isPreview ? "p-1 gap-[1px]" : "p-3 gap-1")}>
          <div className="flex"><span className={cn("font-bold text-gray-700", isPreview ? "w-14" : "w-32")}>Invoice #:</span><span className="font-bold">{invoice?.invoice_number || "PREVIEW"}</span></div>
          <div className="flex"><span className={cn("font-bold text-gray-700", isPreview ? "w-14" : "w-32")}>Invoice Date:</span><span>{formatDateTime(invoice?.invoice_date)}</span></div>
          <div className="flex"><span className={cn("font-bold text-gray-700", isPreview ? "w-14" : "w-32")}>Due Date:</span><span>{formatDateTime(invoice?.invoice_date)}</span></div>
          <div className="flex"><span className={cn("font-bold text-gray-700", isPreview ? "w-14" : "w-32")}>Place of Supply:</span><span className="font-bold text-gray-900">{placeOfSupply}</span></div>
          <div className="flex"><span className={cn("font-bold text-gray-700", isPreview ? "w-14" : "w-32")}>Dispatch From:</span><span>{companyName}</span></div>
          <span className={cn("text-gray-500 whitespace-pre-wrap", isPreview ? "mt-[1px] ml-14" : "mt-1 ml-32")}>{companyAddress}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className={cn("border border-gray-400 flex flex-col flex-1", isPreview ? "mb-1" : "mb-4")}>
         <div className={cn("flex border-b border-gray-400 font-bold bg-gray-100", isPreview ? "text-[4px]" : "text-[11px]")}>
           <div className={cn("border-r border-gray-400", isPreview ? "w-3 px-1 py-[2px]" : "w-10 px-2 py-2")}>#</div>
           <div className={cn("flex-[2] border-r border-gray-400", isPreview ? "px-1 py-[2px]" : "px-2 py-2")}>Item</div>
           <div className={cn("border-r border-gray-400 text-center", isPreview ? "w-10 py-[2px]" : "w-24 py-2")}>HSN/SAC</div>
           <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-10 pr-1 py-[2px]" : "w-24 pr-2 py-2")}>Rate/Item</div>
           <div className={cn("border-r border-gray-400 text-center", isPreview ? "w-8 py-[2px]" : "w-20 py-2")}>Qty</div>
           <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-10 pr-1 py-[2px]" : "w-28 pr-2 py-2")}>Taxable Value</div>
           <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-12 pr-1 py-[2px]" : "w-28 pr-2 py-2")}>Tax Amount</div>
           <div className={cn("text-right", isPreview ? "w-12 pr-1 py-[2px]" : "w-28 pr-2 py-2")}>Amount</div>
         </div>
         {items.map((item: any, idx: number) => {
           const itemGstRate = item.tax_rate ?? gstRate;
           const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
           const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
           const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
           const unit = item.unit || "BDL";

           return (
             <div key={idx} className={cn("flex border-b border-gray-200", isPreview ? "text-[3.5px]" : "text-[11px]")}>
               <div className={cn("border-r border-gray-400", isPreview ? "w-3 px-1 py-[1px]" : "w-10 px-2 py-2")}>{idx + 1}</div>
               <div className={cn("flex-[2] border-r border-gray-400 font-bold", isPreview ? "px-1 py-[1px]" : "px-2 py-2")}>{item.bundle_name || "Item"}</div>
               <div className={cn("border-r border-gray-400 text-center", isPreview ? "w-10 py-[1px]" : "w-24 py-2")}>{item.hsn_code || "-"}</div>
               <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-10 pr-1 py-[1px]" : "w-24 pr-2 py-2")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
               <div className={cn("border-r border-gray-400 text-center font-semibold", isPreview ? "w-8 py-[1px]" : "w-20 py-2")}>{item.quantity || 1} {unit}</div>
               <div className={cn("border-r border-gray-400 text-right", isPreview ? "w-10 pr-1 py-[1px]" : "w-28 pr-2 py-2")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
               <div className={cn("border-r border-gray-400 text-right text-gray-700", isPreview ? "w-12 pr-1 py-[1px]" : "w-28 pr-2 py-2")}>
                 {formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)
               </div>
               <div className={cn("text-right font-bold text-gray-900", isPreview ? "w-12 pr-1 py-[1px]" : "w-28 pr-2 py-2")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
             </div>
           );
         })}
         
         <div className={cn("mt-auto border-t border-gray-400 flex flex-col items-end bg-gray-50/50 break-inside-avoid print:break-inside-avoid", isPreview ? "pr-1 text-[3.5px] pt-1" : "pr-3 text-[11px] pt-3 pb-2 gap-1")}>
            <div className={cn("flex justify-between", isPreview ? "w-32 mt-[2px]" : "w-72 mt-1")}><span className="font-bold">Taxable Amount</span><span>{formatCurrency(invoice?.subtotal || 0).replace('₹', '')}</span></div>
            {isIgst ? (
              <div className={cn("flex justify-between", isPreview ? "w-32" : "w-72")}><span className="font-semibold text-gray-600">IGST {igstRate}%</span><span>{formatCurrency(invoice?.igst_amount || 0).replace('₹', '')}</span></div>
            ) : (
              <>
                <div className={cn("flex justify-between", isPreview ? "w-32" : "w-72")}><span className="font-semibold text-gray-600">CGST {cgstRate}%</span><span>{formatCurrency(invoice?.cgst_amount || 0).replace('₹', '')}</span></div>
                <div className={cn("flex justify-between", isPreview ? "w-32" : "w-72")}><span className="font-semibold text-gray-600">SGST {sgstRate}%</span><span>{formatCurrency(invoice?.sgst_amount || 0).replace('₹', '')}</span></div>
              </>
            )}
            {roundOff !== 0 && <div className={cn("flex justify-between", isPreview ? "w-32 mt-[2px]" : "w-72 mt-1")}><span className="text-gray-500">Round Off</span><span>{roundOff}</span></div>}
         </div>
         <div className={cn("flex border-t border-gray-400 font-bold bg-gray-100 break-inside-avoid print:break-inside-avoid", isPreview ? "text-[5px]" : "text-sm")}>
            <div className={cn("flex-1 text-center", isPreview ? "py-[2px]" : "py-2")}>Total</div>
            <div className={cn("text-right", isPreview ? "w-16 pr-1 py-[2px]" : "w-40 pr-3 py-2")}>{formatCurrency(invoice?.grand_total || 0)}</div>
         </div>
      </div>

      <div className={cn("flex justify-between text-gray-700 font-medium border border-gray-400 break-inside-avoid print:break-inside-avoid", isPreview ? "p-1 mb-1 text-[3.5px]" : "p-3 mb-4 text-xs")}>
        <span>Total items / Qty : {totalItems} / {totalQty}</span>
        <span>Total amount (in words): INR <span className="font-bold text-gray-900">{numberToWords(invoice?.grand_total || 0)}</span></span>
      </div>

      <div className={cn("flex border border-gray-400 break-inside-avoid print:break-inside-avoid", isPreview ? "mb-1 text-[4px]" : "mb-4 text-xs")}>
         <div className={cn("flex-1 border-r border-gray-400 flex flex-col", isPreview ? "p-1 gap-[1px]" : "p-3 gap-1")}>
            <span className={cn("font-bold", isPreview ? "mb-[1px]" : "mb-1")}>Bank Details:</span>
            <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
            <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
            <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>IFSC:</span><span className="font-semibold">{bankIfsc}</span></div>
            <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
            <span className={cn("font-bold", isPreview ? "mt-1" : "mt-2")}>Notes:</span>
            <span className={cn("text-gray-500 whitespace-pre-wrap", isPreview ? "text-[3.5px]" : "text-[11px]")}>{invoice?.notes || "Thank you for shopping with us! We appreciate your business."}</span>
         </div>
         <div className={cn("border-r border-gray-400 flex flex-col items-center", isPreview ? "w-20 p-1" : "w-40 p-3")}>
            <span className={cn("font-bold", isPreview ? "mb-1" : "mb-3")}>Pay using UPI:</span>
            <div className={cn("border border-gray-300", isPreview ? "w-10 h-10 p-[1px]" : "w-20 h-20 p-1")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
         </div>
         <div className={cn("flex-1 flex flex-col justify-end items-center relative", isPreview ? "p-1 pb-2" : "p-3 pb-4")}>
            <span className={cn("text-gray-400 absolute", isPreview ? "text-[3px] top-1 right-2" : "text-[10px] top-3 right-4")}>For {companyName}</span>
            <div className={cn("border-b-2 border-blue-800 rounded-full flex items-center justify-center opacity-60 rotate-3", isPreview ? "w-12 h-6 mt-4" : "w-28 h-12 mt-6")}>
               <span className={cn("text-blue-800 font-signature", isPreview ? "text-lg" : "text-3xl")}>Signature</span>
            </div>
            <span className={cn("text-gray-400", isPreview ? "text-[3px] mt-1" : "text-[10px] mt-2")}>Authorized Signatory</span>
         </div>
      </div>

      <div className={cn("flex flex-col text-gray-600 break-inside-avoid print:break-inside-avoid", isPreview ? "gap-[1px] text-[3.5px]" : "gap-1 text-[11px]")}>
         <span className="font-bold text-gray-800">Terms and Conditions:</span>
         <span>1. All disputes must be reported within 15 days of invoice receipt.</span>
         <span>2. Accepted payment methods include bank transfer, credit card, and PayPal.</span>
         <span>3. In case of exchange, we only accept original receipt.</span>
         <span>4. Subject to local jurisdiction.</span>
      </div>

      <div className={cn("text-left font-semibold text-gray-800", isPreview ? "text-[4px] mt-1" : "text-xs mt-3")}>Page 1/1 <span className="font-normal text-gray-400 ml-1">This is a digitally signed document.</span></div>

    </div>
  );
}
