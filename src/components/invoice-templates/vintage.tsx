import React from "react";
import { cn, formatCurrency, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";

export function VintageTemplate({ invoice, settings, isPreview = false }: { invoice: any; settings: any; isPreview?: boolean }) {
  const companyName = settings?.company_name || "INFI CLOTHING";
  const companyGst = settings?.gst_number || "27AAACT2727Q1ZW";
  const companyAddress = settings?.company_address || "Nigdi Bhosari Road, PIMPRI\nPune, MAHARASHTRA, 411018";
  const companyPhone = settings?.phone_number || "9999999999";
  const companyEmail = settings?.email || "swipe@getswipe.in";

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
      isPreview ? "h-full rounded-2xl shadow-2xl p-4 text-[5px]" : "min-h-[1056px] print:min-h-0 text-xs p-10 print:p-2"
    )}>
      
      {/* Outer Border with inner content */}
      <div className={cn("border-blue-900 flex flex-col h-full rounded-sm overflow-hidden", isPreview ? "border-[1.5px]" : "border-2")}>
        
        {/* Header */}
        <div className={cn("flex justify-between items-center border-blue-900", isPreview ? "border-b-[1.5px] px-2 py-1" : "border-b-2 px-4 py-3")}>
          <div className="flex-1" />
          <div className={cn("flex-[2] text-center font-bold tracking-widest text-blue-900", isPreview ? "text-[6px]" : "text-xl")}>TAX INVOICE</div>
          <div className={cn("flex-1 text-right text-gray-500 uppercase", isPreview ? "text-[4px]" : "text-[10px]")}>Original For Recipient</div>
        </div>

        {/* Top Details Grid */}
        <div className={cn("flex border-blue-900", isPreview ? "border-b-[1.5px]" : "border-b-2")}>
          <div className={cn("flex-[1.5] flex border-blue-900", isPreview ? "gap-2 p-1 border-r-[1.5px]" : "gap-4 p-3 border-r-2")}>
            <div className={cn("flex flex-col items-center justify-center font-bold text-blue-800 leading-none", isPreview ? "w-8 h-8 text-[8px]" : "w-16 h-16 text-lg")}>
              <div className={cn("rounded-full bg-blue-800 text-white flex items-center justify-center", isPreview ? "w-6 h-6 mb-[1px]" : "w-12 h-12 mb-1")}>I</div>
              INFI
            </div>
            <div className="flex flex-col">
              <span className={cn("font-bold uppercase", isPreview ? "text-[6px]" : "text-sm")}>{companyName}</span>
              <span className={cn("font-semibold", isPreview ? "mt-[1px]" : "mt-1")}>GSTIN {companyGst}</span>
              <span className="text-gray-600 whitespace-pre-wrap">{companyAddress}</span>
              {companyPhone && <span className="text-gray-600"><span className="font-semibold text-black">Mobile:</span> {companyPhone}</span>}
              {companyEmail && <span className="text-gray-600"><span className="font-semibold text-black">Email:</span> {companyEmail}</span>}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className={cn("flex-1 flex flex-col border-blue-900", isPreview ? "p-1 border-b-[1.5px]" : "p-3 border-b-2")}>
              <span className="font-semibold text-gray-600">Invoice #:</span><span className="font-bold">{invoice?.invoice_number || "PREVIEW"}</span>
            </div>
            <div className={cn("flex-1 flex flex-col", isPreview ? "p-1" : "p-3")}>
              <span className="font-semibold text-gray-600">Place of Supply:</span><span className="font-bold text-blue-900">{placeOfSupply}</span>
            </div>
          </div>
          <div className={cn("flex-1 flex flex-col border-blue-900", isPreview ? "border-l-[1.5px]" : "border-l-2")}>
            <div className={cn("flex-1 flex flex-col border-blue-900", isPreview ? "p-1 border-b-[1.5px]" : "p-3 border-b-2")}>
              <span className="font-semibold text-gray-600">Invoice Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
            </div>
            <div className={cn("flex-1 flex flex-col", isPreview ? "p-1" : "p-3")}>
              <span className="font-semibold text-gray-600">Due Date:</span><span className="font-bold">{formatDateTime(invoice?.invoice_date)}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className={cn("flex border-blue-900", isPreview ? "border-b-[1.5px]" : "border-b-2")}>
          <div className={cn("flex-1 flex flex-col border-blue-900", isPreview ? "p-1 border-r-[1.5px] gap-[1px]" : "p-3 border-r-2 gap-1")}>
            <span className={cn("font-bold text-blue-900", isPreview ? "text-[4px] mb-[1px]" : "text-[11px] mb-1")}>Customer Details:</span>
            <span className="font-semibold text-gray-900">{customerName}</span>
            {hasDistinctCompany && (
              <span className="font-bold text-gray-900 uppercase">{customerCompany}</span>
            )}
            {gstin && <span className="font-bold text-gray-900">GSTIN: {gstin}</span>}
            {panNumber && <span className="font-bold text-gray-900">PAN: {panNumber}</span>}
            {invoice?.customer_mobile && <span><span className="font-semibold">Ph:</span> {invoice.customer_mobile}</span>}
          </div>
          <div className={cn("flex-1 flex flex-col", isPreview ? "p-1 gap-[1px]" : "p-3 gap-1")}>
            <span className={cn("font-bold text-blue-900", isPreview ? "text-[4px] mb-[1px]" : "text-[11px] mb-1")}>Billing Address:</span>
            <span className="text-gray-600 whitespace-pre-wrap">{invoice?.customer_address || invoice?.shipping_address || "Billing Address"}</span>
          </div>
        </div>

        {/* Main Table */}
        <div className="flex flex-col flex-1">
          <div className={cn("flex font-bold bg-blue-50/50 text-blue-900 border-blue-900", isPreview ? "border-b-[1.5px] text-[4px]" : "border-b-2 text-[10px]")}>
            <div className={cn("border-blue-900", isPreview ? "w-3 border-r-[1.5px] px-1 py-[2px]" : "w-10 border-r-2 px-3 py-2")}>#</div>
            <div className={cn("flex-[2] border-blue-900", isPreview ? "border-r-[1.5px] px-1 py-[2px]" : "border-r-2 px-3 py-2")}>Item</div>
            <div className={cn("text-center border-blue-900", isPreview ? "w-10 border-r-[1.5px] py-[2px]" : "w-24 border-r-2 py-2")}>HSN/SAC</div>
            <div className={cn("text-right border-blue-900", isPreview ? "w-12 border-r-[1.5px] pr-1 py-[2px]" : "w-24 border-r-2 pr-3 py-2")}>Rate/Item</div>
            <div className={cn("text-center border-blue-900", isPreview ? "w-8 border-r-[1.5px] py-[2px]" : "w-20 border-r-2 py-2")}>Qty</div>
            <div className={cn("text-right border-blue-900", isPreview ? "w-12 border-r-[1.5px] pr-1 py-[2px]" : "w-28 border-r-2 pr-3 py-2")}>Taxable Value</div>
            <div className={cn("text-right border-blue-900", isPreview ? "w-14 border-r-[1.5px] pr-1 py-[2px]" : "w-32 border-r-2 pr-3 py-2")}>Tax Amount</div>
            <div className={cn("text-right", isPreview ? "w-12 pr-1 py-[2px]" : "w-28 pr-3 py-2")}>Amount</div>
          </div>
          {items.map((item: any, idx: number) => {
            const itemGstRate = item.tax_rate ?? gstRate;
            const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
            const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
            const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
            const unit = item.unit || "BDL";

            return (
              <div key={idx} className={cn("flex border-b border-blue-900/20", isPreview ? "text-[4px]" : "text-[10px]")}>
                <div className={cn("border-blue-900", isPreview ? "w-3 border-r-[1.5px] px-1 py-[2px]" : "w-10 border-r-2 px-3 py-2")}>{idx + 1}</div>
                <div className={cn("flex-[2] flex flex-col border-blue-900", isPreview ? "border-r-[1.5px] px-1 py-[2px] gap-[2px]" : "border-r-2 px-3 py-2 gap-1")}>
                  <span className="font-bold">{item.bundle_name || "Item"}</span>
                </div>
                <div className={cn("text-center border-blue-900", isPreview ? "w-10 border-r-[1.5px] py-[2px]" : "w-24 border-r-2 py-2")}>{item.hsn_code || "-"}</div>
                <div className={cn("text-right border-blue-900", isPreview ? "w-12 border-r-[1.5px] pr-1 py-[2px]" : "w-24 border-r-2 pr-3 py-2")}>{formatCurrency(item.rate || 0).replace('₹', '')}</div>
                <div className={cn("text-center border-blue-900 font-semibold", isPreview ? "w-8 border-r-[1.5px] py-[2px]" : "w-20 border-r-2 py-2")}>{item.quantity || 1} {unit}</div>
                <div className={cn("text-right border-blue-900", isPreview ? "w-12 border-r-[1.5px] pr-1 py-[2px]" : "w-28 border-r-2 pr-3 py-2")}>{formatCurrency(taxableVal).replace('₹', '')}</div>
                <div className={cn("text-right border-blue-900 text-gray-700", isPreview ? "w-14 border-r-[1.5px] pr-1 py-[2px]" : "w-32 border-r-2 pr-3 py-2")}>
                  {formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)
                </div>
                <div className={cn("text-right font-bold text-gray-900", isPreview ? "w-12 pr-1 py-[2px]" : "w-28 pr-3 py-2")}>{formatCurrency(rowTotal).replace('₹', '')}</div>
              </div>
            );
          })}
          
          <div className={cn("mt-auto flex border-blue-900 break-inside-avoid print:break-inside-avoid", isPreview ? "border-t-[1.5px] text-[4px]" : "border-t-2 text-[10px]")}>
             <div className={cn("flex-[2] border-blue-900 flex flex-col justify-between", isPreview ? "border-r-[1.5px] p-1" : "border-r-2 p-3")}>
               <span className="text-gray-600 font-medium">Total items / Qty : {totalItems} / {totalQty}</span>
               <div className="text-gray-700 mt-2">
                 <span className="font-semibold">Invoice Amount In Words:</span><br />
                 <span className="font-bold text-blue-950">{numberToWords(invoice?.grand_total || 0)}</span>
               </div>
             </div>
             <div className="flex-1 flex flex-col">
                <div className={cn("flex justify-between", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}><span className="font-semibold text-gray-600">Taxable Amount</span><span>{formatCurrency(invoice?.subtotal || 0)}</span></div>
                {isIgst ? (
                  <div className={cn("flex justify-between border-blue-900", isPreview ? "px-1 py-[1px] border-b-[1.5px]" : "px-3 py-1 border-b-2")}><span className="font-semibold text-gray-600">IGST {igstRate}%</span><span>{formatCurrency(invoice?.igst_amount || 0)}</span></div>
                ) : (
                  <>
                    <div className={cn("flex justify-between", isPreview ? "px-1 py-[1px]" : "px-3 py-1")}><span className="font-semibold text-gray-600">CGST {cgstRate}%</span><span>{formatCurrency(invoice?.cgst_amount || 0)}</span></div>
                    <div className={cn("flex justify-between border-blue-900", isPreview ? "px-1 py-[1px] border-b-[1.5px]" : "px-3 py-1 border-b-2")}><span className="font-semibold text-gray-600">SGST {sgstRate}%</span><span>{formatCurrency(invoice?.sgst_amount || 0)}</span></div>
                  </>
                )}
                <div className={cn("flex justify-between font-bold text-blue-950", isPreview ? "px-1 py-1 text-[6px]" : "px-3 py-2 text-base")}><span>Total</span><span>{formatCurrency(invoice?.grand_total || 0)}</span></div>
             </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className={cn("flex border-blue-900 break-inside-avoid print:break-inside-avoid", isPreview ? "border-t-[1.5px] text-[4px]" : "border-t-2 text-[10px]")}>
           <div className={cn("flex-1 flex flex-col border-blue-900", isPreview ? "border-r-[1.5px] p-1 gap-[1px]" : "border-r-2 p-3 gap-1")}>
             <span className={cn("font-bold text-blue-900", isPreview ? "mb-[1px]" : "mb-1")}>Bank Details:</span>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Bank:</span><span className="font-semibold">{bankName}</span></div>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Account #:</span><span className="font-semibold">{bankAccount}</span></div>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>IFSC:</span><span className="font-semibold">{bankIfsc}</span></div>
             <div className="flex"><span className={cn("text-gray-500", isPreview ? "w-12" : "w-24")}>Branch:</span><span className="font-semibold">{bankBranch}</span></div>
           </div>
           <div className={cn("flex flex-col items-center justify-center border-blue-900", isPreview ? "w-24 border-r-[1.5px] p-1" : "w-40 border-r-2 p-3")}>
             <span className={cn("font-bold text-blue-900", isPreview ? "mb-1" : "mb-2")}>Pay using UPI:</span>
             <div className={cn("border border-gray-300", isPreview ? "w-10 h-10 p-[1px]" : "w-16 h-16 p-1")}><div className="w-full h-full bg-black/60 pattern-dots" /></div>
           </div>
           <div className={cn("flex-[1.2] flex flex-col items-end justify-between relative", isPreview ? "p-1" : "p-3")}>
             <span className={cn("text-gray-500 w-full text-right", isPreview ? "text-[3px]" : "text-[8px]")}>For {companyName}</span>
             <div className={cn("border border-blue-800 rounded-full flex items-center justify-center opacity-60 absolute transform -rotate-12", isPreview ? "w-10 h-10 bottom-3 right-4" : "w-20 h-20 bottom-4 right-6")}>
               <span className={cn("text-blue-800 font-bold tracking-widest", isPreview ? "text-[3px]" : "text-[8px]")}>SIGNATURE</span>
             </div>
             <span className={cn("text-gray-400 mt-auto", isPreview ? "text-[3px]" : "text-[8px]")}>Authorized Signatory</span>
           </div>
        </div>

        <div className={cn("flex border-blue-900 text-gray-600 break-inside-avoid print:break-inside-avoid", isPreview ? "border-t-[1.5px] p-1 text-[3.5px] gap-2" : "border-t-2 p-3 text-[11px] gap-6")}>
           <div className="flex-1 flex flex-col">
             <span className="font-bold text-gray-800">Notes:</span>
             <span>{invoice?.notes || "Thank you for the Business"}</span>
           </div>
           <div className="flex-[2] flex flex-col">
             <span className="font-bold text-gray-800">Terms and Conditions:</span>
             <span>1. Goods once sold cannot be taken back or exchanged.</span>
             <span>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</span>
             <span>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</span>
             <span>4. Subject to local jurisdiction.</span>
           </div>
        </div>
      </div>

      <div className={cn("text-left text-gray-500 font-semibold flex items-center", isPreview ? "text-[4px] pt-1 mt-1 gap-1" : "text-xs pt-2 mt-2 gap-2")}>
        Page 1/1 <span className="font-normal text-gray-400">This is a digitally signed document.</span>
      </div>

    </div>
  );
}
