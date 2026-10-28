import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

export function BillToShipToTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI Clothing";
  const companyGst = settings?.gst_number || "33AABCC52194ZR1ZR";
  const companyAddress = settings?.company_address || "64, Whitefield Main Rd, Palm Meadows, Whitefield\nBengaluru, KARNATAKA, 560066";
  const companyPhone = settings?.phone_number || "9999999999";
  const companyEmail = settings?.email || "team@gmail.com";

  const bankName = settings?.bank_name || "ICICI";
  const bankAccount = settings?.bank_account_number || "66789999222445";
  const bankIfsc = settings?.bank_ifsc_code || "ICIC00015";
  const bankBranch = settings?.bank_branch || "Marathahalli";
  
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
  
  const isPaid = (invoice?.balance_amount || 0) === 0 && (invoice?.grand_total || 0) > 0;

  return (
    <div className={cn(
      "w-full bg-white flex flex-col font-sans text-gray-800 relative ring-1 ring-black/5 overflow-hidden leading-tight",
      isPreview ? "h-full rounded-2xl shadow-2xl p-4 text-[5px]" : "min-h-[1056px] text-xs p-10 print:min-h-0 print:p-2 print:shadow-none print:ring-0 print:text-[11px]"
    )}>
      
      {/* Header */}
      <div className={cn("flex justify-between items-start", isPreview ? "mb-2" : "mb-5 print:mb-3")}>
        <div className={cn("flex items-center", isPreview ? "gap-2" : "gap-6")}>
          <div className={cn("bg-yellow-400 flex items-center justify-center font-bold text-blue-600 italic rounded-sm relative overflow-hidden", isPreview ? "w-10 h-10 text-[10px]" : "w-24 h-24 text-2xl print:w-16 print:h-16 print:text-xl")}>
            <div className="absolute right-0 bottom-0 text-white transform rotate-12 scale-150 opacity-40">i</div>
            INFI
          </div>
          <div className="flex flex-col">
             <span className={cn("font-bold", isPreview ? "text-[7px]" : "text-xl print:text-base")}>{companyName}</span>
             <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-0.5")}>GSTIN: {companyGst}</span>
             {companyPhone && <span className={cn("text-gray-600", isPreview ? "mt-[1px]" : "mt-0.5")}><span className="font-semibold text-black">Mobile:</span> {companyPhone}</span>}
             {companyEmail && <span className="text-gray-600"><span className="font-semibold text-black">Email:</span> {companyEmail}</span>}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
           <span className={cn("font-bold tracking-widest", isPreview ? "text-[7px]" : "text-xl print:text-base")}>TAX INVOICE</span>
           <span className={cn("text-gray-500 uppercase font-semibold", isPreview ? "text-[4px] mb-1" : "text-[10px] mb-3 print:mb-1")}>Original For Recipient</span>
           <div className={cn("grid grid-cols-2 text-right mt-1", isPreview ? "gap-x-2" : "gap-x-6 gap-y-1 print:gap-x-3")}>
             <span className="text-gray-500">Invoice #:</span><span className="font-bold">{invoice?.invoice_number || "PREVIEW"}</span>
             <span className="text-gray-500">Invoice Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
             <span className="text-gray-500">Due Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
           </div>
        </div>
      </div>

      {/* Bill From / Ship To */}
      <div className={cn("grid grid-cols-2", isPreview ? "gap-2 mb-2" : "gap-6 mb-4 print:gap-4 print:mb-3")}>
         <div className={cn("flex flex-col", isPreview ? "gap-[2px]" : "gap-0.5")}>
           <span className={cn("font-bold", isPreview ? "text-[5px]" : "text-sm")}>Bill From:</span>
           <span className="font-bold">{companyName}</span>
           <span className="text-gray-600 whitespace-pre-wrap">{companyAddress}</span>
           <span className={cn("font-bold", isPreview ? "mt-1 text-[5px]" : "mt-2 text-sm")}>Ship From:</span>
           <span className="text-gray-600 whitespace-pre-wrap">{companyAddress}</span>
           <span className={cn("font-bold", isPreview ? "mt-1 text-[5px]" : "mt-2 text-xs")}>Place of Supply: <span className="font-bold text-black">{placeOfSupply}</span></span>
         </div>
         <div className={cn("flex flex-col", isPreview ? "gap-[2px]" : "gap-0.5")}>
           <span className={cn("font-bold", isPreview ? "text-[5px]" : "text-sm")}>Bill To:</span>
           <span className="font-semibold uppercase text-black">{customerName}</span>
           {hasDistinctCompany && (
             <span className="font-bold text-gray-900 uppercase">{customerCompany}</span>
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
           <span className={cn("font-bold", isPreview ? "mt-1 text-[5px]" : "mt-2 text-sm")}>Billing Address:</span>
           <span className="text-gray-600 whitespace-pre-wrap">{invoice?.customer_address || invoice?.shipping_address || "Billing Address"}</span>
           {invoice?.customer_mobile && <span className="text-gray-600"><span className="font-semibold text-black">Ph:</span> {invoice.customer_mobile}</span>}
         </div>
      </div>

      {/* Table */}
      <div className={cn("border border-gray-400 flex flex-col flex-1", isPreview ? "mb-2" : "mb-4 print:mb-2")}>
         <div className={cn("flex border-b border-gray-400 font-bold bg-gray-50/50", isPreview ? "px-1 py-[3px]" : "px-3 py-2 print:py-1.5 print:px-2")}>
           <div className={cn(isPreview ? "w-3" : "w-10 print:w-8")}>#</div>
           <div className="flex-1">Item</div>
           <div className={cn("text-center", isPreview ? "w-10" : "w-20 print:w-16")}>HSN/SAC</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-24 print:w-20")}>Rate</div>
           <div className={cn("text-center", isPreview ? "w-8" : "w-20 print:w-16")}>Qty</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-28 print:w-24")}>Taxable Value</div>
           <div className={cn("text-right", isPreview ? "w-14" : "w-32 print:w-28")}>Tax Amount</div>
           <div className={cn("text-right", isPreview ? "w-12" : "w-28 print:w-24")}>Amount</div>
         </div>
         
         {items.map((item: any, idx: number) => {
            const itemGstRate = Number(item.gst_rate ?? gstRate ?? 5);
            const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
            const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
            const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
            const unit = item.unit || "BDL";

            return (
              <div key={idx} className={cn("flex border-b border-gray-200", isPreview ? "px-1 py-1 text-[4px]" : "px-3 py-2 text-xs print:py-1.5 print:px-2")}>
                <div className={cn(isPreview ? "w-3" : "w-10 print:w-8")}>{idx + 1}</div>
                <div className={cn("flex-1 flex flex-col", isPreview ? "gap-[1px]" : "gap-0.5")}>
                  <span className="font-bold">{item.bundle_name || "Item"}</span>
                </div>
                <div className={cn("text-center", isPreview ? "w-10" : "w-20 print:w-16")}>{item.hsn_code || "-"}</div>
                <div className={cn("text-right font-semibold", isPreview ? "w-12" : "w-24 print:w-20")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
                <div className={cn("text-center font-bold", isPreview ? "w-8" : "w-20 print:w-16")}>{item.quantity || 1} {unit}</div>
                <div className={cn("text-right font-medium", isPreview ? "w-12" : "w-28 print:w-24")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
                <div className={cn("text-right text-gray-700", isPreview ? "w-14" : "w-32 print:w-28")}>{formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)</div>
                <div className={cn("text-right font-bold", isPreview ? "w-12" : "w-28 print:w-24")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
              </div>
            );
         })}
         
         <div className="mt-auto flex border-t border-gray-400 break-inside-avoid print:break-inside-avoid">
           <div className="flex-1 border-r border-gray-400 p-2 flex flex-col">
              <span className={cn("font-bold", isPreview ? "mb-[2px]" : "mb-1")}>Bank Details:</span>
              <div className={cn("grid", isPreview ? "grid-cols-[30px_1fr] gap-x-1 gap-y-[1px]" : "grid-cols-[70px_1fr] gap-x-2 gap-y-0.5")}>
                <span>Bank:</span><span className="font-semibold">{bankName}</span>
                <span>Account #:</span><span className="font-semibold">{bankAccount}</span>
                <span>IFSC:</span><span className="font-semibold font-mono">{bankIfsc}</span>
                <span>Branch:</span><span className="font-semibold">{bankBranch}</span>
              </div>
           </div>
           <div className={cn("border-r border-gray-400 flex flex-col items-center p-2", isPreview ? "w-20" : "w-40 print:w-32")}>
              <span className={cn("font-bold", isPreview ? "mb-1" : "mb-2")}>Pay using UPI:</span>
              <div className={cn("bg-black/10 flex items-center justify-center p-[2px]", isPreview ? "w-8 h-8" : "w-16 h-16")}><div className="w-full h-full bg-black/50" /></div>
           </div>
           <div className={cn("flex flex-col", isPreview ? "w-40 text-[5px]" : "w-80 text-sm print:w-72")}>
              <div className={cn("flex justify-between font-bold", isPreview ? "px-1 py-[2px]" : "px-3 py-1")}><span className="font-normal text-gray-600">Taxable Amount</span><span>{formatCurrency(invoice?.subtotal || 0)}</span></div>
              
              {isIgst ? (
                <div className={cn("flex justify-between font-bold border-b border-gray-400", isPreview ? "px-1 py-[2px]" : "px-3 py-1")}><span className="font-normal text-gray-600">IGST {igstRate}%</span><span>{formatCurrency(invoice?.igst_amount || 0)}</span></div>
              ) : (
                <>
                  <div className={cn("flex justify-between font-bold", isPreview ? "px-1 py-[2px]" : "px-3 py-0.5")}><span className="font-normal text-gray-600">CGST {cgstRate}%</span><span>{formatCurrency(invoice?.cgst_amount || 0)}</span></div>
                  <div className={cn("flex justify-between font-bold border-b border-gray-400", isPreview ? "px-1 py-[2px]" : "px-3 py-0.5")}><span className="font-normal text-gray-600">SGST {sgstRate}%</span><span>{formatCurrency(invoice?.sgst_amount || 0)}</span></div>
                </>
              )}
              
              <div className={cn("flex justify-between font-bold border-b border-gray-400", isPreview ? "px-1 py-1 text-[6px]" : "px-3 py-1.5 text-lg print:text-base")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
              
              {isPaid && (
                <div className={cn("flex justify-end text-green-600 font-bold items-center", isPreview ? "px-1 py-1 gap-1" : "px-3 py-1 gap-2")}>
                   <div className={cn("rounded-full bg-green-500/20 flex items-center justify-center", isPreview ? "w-2 h-2" : "w-4 h-4")}><div className={cn("bg-green-500 rounded-full", isPreview ? "w-1 h-1" : "w-2 h-2")}/></div>
                   Amount Paid
                </div>
              )}
           </div>
         </div>
      </div>

      <div className={cn("flex justify-between text-gray-600 break-inside-avoid print:break-inside-avoid", isPreview ? "text-[4px] mb-1" : "text-xs mb-3 print:mb-2")}>
         <span>Total items / Qty : {totalItems} / {totalQty}</span>
         <span>Total amount (in words): INR {numberToWords(invoice?.grand_total || 0)}</span>
      </div>

      <div className="flex justify-between items-end break-inside-avoid print:break-inside-avoid">
        <div className={cn("flex flex-col text-gray-600 w-2/3", isPreview ? "gap-[2px] text-[4px]" : "gap-0.5 text-[10px]")}>
           <span className="font-bold text-gray-800">Notes:</span>
           <span>{invoice?.notes || "Thank you for the Business"}</span>
           <span className={cn("font-bold text-gray-800", isPreview ? "mt-[2px]" : "mt-1")}>Terms and Conditions:</span>
           <span>1. Goods once sold cannot be taken back or exchanged.</span>
           <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
           <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
           <span>4. Subject to local jurisdiction.</span>
        </div>
        <div className="flex flex-col items-end w-1/3">
           <span className={cn("text-gray-400", isPreview ? "text-[4px] mb-1" : "text-[10px] mb-2")}>For {companyName}</span>
           <span className={cn("font-signature text-black/80 transform -rotate-2", isPreview ? "text-lg mb-1" : "text-3xl mb-2 print:text-2xl")}>{companyName}</span>
        </div>
      </div>

      <div className={cn("text-center text-gray-400 border-t border-gray-100 break-inside-avoid print:break-inside-avoid", isPreview ? "text-[4px] mt-1 pb-1 pt-1" : "text-xs mt-3 pb-1 pt-2")}>This is a digitally signed document.</div>

    </div>
  );
}
