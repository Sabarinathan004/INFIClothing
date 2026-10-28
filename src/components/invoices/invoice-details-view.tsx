"use client"

import { formatCurrency, formatDate, formatDateTime, numberToWords } from "@/lib/utils";
import { getPlaceOfSupply } from "@/lib/constants";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { TEMPLATES } from "./template-selector";

/* ─────────────────── Helper: UPI QR Code ─────────────────── */
function UpiQrCode({ upiId, amount, name }: { upiId: string; amount?: number; name?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!upiId || !canvasRef.current) return;
    let upiUrl = `upi://pay?pa=${upiId}`;
    if (name) upiUrl += `&pn=${encodeURIComponent(name)}`;
    if (amount && amount > 0) upiUrl += `&am=${amount}`;
    upiUrl += `&cu=INR`;
    QRCode.toCanvas(canvasRef.current, upiUrl, { width: 90, margin: 1 });
  }, [upiId, amount, name]);

  if (!upiId) return null;
  return <canvas ref={canvasRef} className="mx-auto" />;
}

/* ─────────────────── Helper: GST summary rows ─────────────────── */
function GstSummaryRows({ invoice }: { invoice: any }) {
  const location = invoice.customer_location;
  const isIgst = location !== "Inside Tamil Nadu";
  const hasSplitData = invoice.cgst_rate != null || invoice.igst_rate != null;

  if (hasSplitData) {
    if (!isIgst) {
      return (
        <>
          <tr>
            <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              CGST @ {invoice.cgst_rate ?? 2.5}%
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs font-semibold">
              {formatCurrency(invoice.cgst_amount ?? 0)}
            </td>
          </tr>
          <tr>
            <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              SGST @ {invoice.sgst_rate ?? 2.5}%
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs font-semibold">
              {formatCurrency(invoice.sgst_amount ?? 0)}
            </td>
          </tr>
        </>
      );
    } else {
      return (
        <tr>
          <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold">
            IGST @ {invoice.igst_rate ?? 5}%
          </td>
          <td className="border border-black px-2 py-1 text-right text-xs font-semibold">
            {formatCurrency(invoice.igst_amount ?? 0)}
          </td>
        </tr>
      );
    }
  }

  // Legacy fallback
  return (
    <tr>
      <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold">
        GST @ {invoice.gst_rate}%
      </td>
      <td className="border border-black px-2 py-1 text-right text-xs font-semibold">
        {formatCurrency(invoice.gst_amount)}
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Traditional Indian Tax Invoice Layout
   ═══════════════════════════════════════════════════════════════════ */
export function LegacyInvoiceTemplate({ invoice, settings }: { invoice: any; settings: any }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) setLogoUrl(savedLogo);
  }, []);

  /* ── Company settings ── */
  const companyName = settings?.company_name || "INFI Clothing";
  const companyAddress = settings?.company_address || settings?.address || "";
  const companyPhone = settings?.phone_number || settings?.phone || "";
  const companyEmail = settings?.email || "";
  const companyGst = settings?.gst_number || "";

  // Payment settings
  const upiId = settings?.upi_id || "";
  const bankName = settings?.bank_name || "";
  const bankAccountNumber = settings?.bank_account_number || settings?.bank_account || "";
  const bankIfscCode = settings?.bank_ifsc_code || settings?.bank_ifsc || "";
  const bankAccountHolder = settings?.bank_account_holder || companyName;
  const bankBranch = settings?.bank_branch || "";

  /* ── Customer / Bill To details ── */
  const customerName = (invoice.legal_name || invoice.customer_name || "Customer Name").toUpperCase();
  const customerCompany = (invoice.trade_name || "").toUpperCase();
  const hasDistinctCompany = customerCompany && customerCompany !== customerName;

  const gstin = (
    invoice.verification_type === "GST"
      ? invoice.verification_number
      : (invoice.verification_number?.length === 15 ? invoice.verification_number : invoice.customer_gst)
  )?.trim().toUpperCase() || (invoice.customer_gst || "");

  const panNumber = (
    invoice.pan_number ||
    (gstin && gstin.length === 15 ? gstin.substring(2, 12) : null) ||
    (invoice.verification_type === "PAN" ? invoice.verification_number : null)
  )?.trim().toUpperCase();

  const placeOfSupply =
    invoice.place_of_supply ||
    getPlaceOfSupply(gstin) ||
    (invoice.customer_location === "Inside Tamil Nadu" ? "33-TAMIL NADU" : (invoice.customer_location || "33-TAMIL NADU"));

  /* Compute round-off */
  const roundOff = +(invoice.grand_total - Math.round(invoice.grand_total)).toFixed(2);

  return (
    <div className="bg-white text-black print:text-black max-w-4xl mx-auto print:max-w-none print:p-0 print:shadow-none print:border-0 shadow-sm border border-slate-200 rounded-xl overflow-hidden leading-tight text-xs">
      {/* ═══════ Outermost table container ═══════ */}
      <table className="w-full border-collapse border border-black text-[11px] leading-snug" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
        <tbody>
          {/* ─── Row 1: Header (Logo + Company + QR) ─── */}
          <tr>
            <td colSpan={8} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Logo */}
                    <td className="w-[80px] border-r border-black p-2 align-middle text-center">
                      <img
                        src={logoUrl || "/logo.png"}
                        alt="Logo"
                        className="w-16 h-16 object-contain mx-auto print:border print:border-gray-300"
                      />
                    </td>
                    {/* Company Info */}
                    <td className="p-3 align-top">
                      <div className="text-lg font-extrabold uppercase tracking-wide">{companyName}</div>
                      {companyAddress && (
                        <div className="text-[10px] text-gray-700 whitespace-pre-wrap mt-0.5">{companyAddress}</div>
                      )}
                      {companyGst && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">GSTIN:</span>{" "}
                          <span className="uppercase font-mono">{companyGst}</span>
                        </div>
                      )}
                      {(companyPhone || companyEmail) && (
                        <div className="text-[10px] text-gray-600 mt-0.5">
                          {companyPhone && <span>Ph: {companyPhone}</span>}
                          {companyPhone && companyEmail && " | "}
                          {companyEmail && <span>{companyEmail}</span>}
                        </div>
                      )}
                    </td>
                    {/* QR Code (scan & pay) */}
                    {upiId && (
                      <td className="w-[120px] border-l border-black p-2 align-middle text-center">
                        <div className="text-[9px] font-bold mb-1 uppercase">Scan & Pay</div>
                        <UpiQrCode
                          upiId={upiId}
                          amount={invoice.balance_amount > 0 ? invoice.balance_amount : undefined}
                          name={companyName}
                        />
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row 2: TAX INVOICE title bar ─── */}
          <tr>
            <td colSpan={8} className="border border-black text-center py-1 bg-gray-100">
              <span className="text-sm font-extrabold tracking-[0.3em] uppercase">
                {invoice.doc_type === 'quotation' 
                  ? 'Quotation' 
                  : invoice.doc_type === 'challan' 
                  ? 'Delivery Challan' 
                  : invoice.doc_type === 'proforma' 
                  ? 'Proforma Invoice' 
                  : 'Tax Invoice'}
              </span>
              <span className="float-right pr-3 text-[10px] italic text-gray-500">Original Copy</span>
            </td>
          </tr>

          {/* ─── Row 3: Invoice metadata (No, Date, Location) ─── */}
          <tr>
            <td colSpan={8} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-black px-3 py-1.5 text-xs w-1/2">
                      <span className="font-semibold">{invoice.doc_type === 'quotation' ? 'Quotation No:' : invoice.doc_type === 'challan' ? 'Challan No:' : 'Invoice No:'}</span>{" "}
                      <span className="font-bold text-black">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-3 py-1.5 text-xs w-1/2 text-right">
                      <span className="font-semibold">Date & Time:</span>{" "}
                      <span className="font-bold">{formatDateTime(invoice.invoice_date, invoice.created_at)}</span>
                      {placeOfSupply && (
                        <span className="ml-3 font-semibold text-black">
                          Place of Supply: <span className="font-bold">{placeOfSupply}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row 4: Bill To + Shipped To ─── */}
          <tr>
            <td colSpan={8} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Bill To */}
                    <td className="border-r border-black p-3 align-top w-1/2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Bill To</div>
                      <div className="font-semibold text-sm uppercase text-black">{customerName}</div>
                      {hasDistinctCompany && (
                        <div className="text-xs font-bold text-black uppercase">{customerCompany}</div>
                      )}
                      {gstin && (
                        <div className="text-xs font-bold mt-0.5">
                          <span className="font-bold">GSTIN:</span> <span className="font-mono font-bold">{gstin}</span>
                        </div>
                      )}
                      {panNumber && (
                        <div className="text-xs font-bold mt-0.5">
                          <span className="font-bold">PAN:</span> <span className="font-mono font-bold">{panNumber}</span>
                        </div>
                      )}
                      {invoice.customer_address && (
                        <div className="text-[10px] text-gray-700 whitespace-pre-wrap mt-0.5">{invoice.customer_address}</div>
                      )}
                      {invoice.customer_mobile && (
                        <div className="text-[10px] text-gray-600 mt-0.5">Mob: {invoice.customer_mobile}</div>
                      )}
                      <div className="text-[10px] font-semibold text-gray-800 mt-0.5">
                        Place of Supply: <span className="font-bold">{placeOfSupply}</span>
                      </div>
                    </td>
                    {/* Shipped To / Transport */}
                    <td className="p-3 align-top w-1/2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                        {invoice.shipping_address ? "Shipped To" : "Transport Details"}
                      </div>
                      {invoice.shipping_address && (
                        <div className="text-[10px] text-gray-700 whitespace-pre-wrap">{invoice.shipping_address}</div>
                      )}
                      {invoice.transport_mode && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">Mode:</span> {invoice.transport_mode}
                        </div>
                      )}
                      {invoice.no_of_bundles && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">Bundles:</span> {invoice.no_of_bundles}
                        </div>
                      )}
                      {invoice.vehicle_number && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">Vehicle No:</span> {invoice.vehicle_number}
                        </div>
                      )}
                      {invoice.eway_bill_number && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">E-Way Bill:</span> {invoice.eway_bill_number}
                        </div>
                      )}
                      {!invoice.shipping_address && !invoice.transport_mode && !invoice.no_of_bundles && !invoice.vehicle_number && !invoice.eway_bill_number && (
                        <div className="text-[10px] text-gray-400 italic">—</div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row 5: Items table header ─── */}
          <tr className="bg-gray-100">
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[35px]">#</td>
            <td className="border border-black px-2 py-1.5 font-bold text-xs">Particulars</td>
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[70px]">HSN/SAC</td>
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[65px]">Qty</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[75px]">Rate</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[85px]">Taxable Value</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[85px]">Tax Amount</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[90px]">Amount</td>
          </tr>

          {/* ─── Item rows ─── */}
          {invoice.items.map((item: any, index: number) => {
            const itemGstRate = Number(item.gst_rate ?? invoice.gst_rate ?? 5);
            const taxableVal = Number(item.taxable_amount ?? item.amount ?? (Number(item.quantity || 1) * Number(item.rate || 0)));
            const taxAmt = Math.round(((taxableVal * itemGstRate) / 100) * 100) / 100;
            const rowTotal = Math.round((taxableVal + taxAmt) * 100) / 100;
            const unit = item.unit || "BDL";

            return (
              <tr key={item.id || index}>
                <td className="border border-black px-2 py-1.5 text-center text-xs">{index + 1}</td>
                <td className="border border-black px-2 py-1.5 text-xs font-semibold">{item.bundle_name}</td>
                <td className="border border-black px-2 py-1.5 text-center text-xs">{item.hsn_code || "—"}</td>
                <td className="border border-black px-2 py-1.5 text-center text-xs font-bold">{item.quantity} {unit}</td>
                <td className="border border-black px-2 py-1.5 text-right text-xs">{formatCurrency(item.rate).replace('₹', '')}</td>
                <td className="border border-black px-2 py-1.5 text-right text-xs font-medium">{formatCurrency(taxableVal).replace('₹', '')}</td>
                <td className="border border-black px-2 py-1.5 text-right text-xs text-gray-700">{formatCurrency(taxAmt).replace('₹', '')} ({itemGstRate}%)</td>
                <td className="border border-black px-2 py-1.5 text-right text-xs font-bold">{formatCurrency(rowTotal).replace('₹', '')}</td>
              </tr>
            );
          })}

          {/* ─── Empty rows to fill space (minimum 3 visible rows) ─── */}
          {Array.from({ length: Math.max(0, 3 - invoice.items.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1 text-xs">&nbsp;</td>
            </tr>
          ))}

          {/* ─── Subtotal (Taxable Amount) ─── */}
          <tr className="bg-gray-50">
            <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              Taxable Amount
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs font-semibold">
              {formatCurrency(invoice.subtotal + (Number(invoice.extra_discount) || 0))}
            </td>
          </tr>

          {/* ─── Extra Discount Row ─── */}
          {Number(invoice.extra_discount) > 0 && (
            <tr>
              <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold text-emerald-700">
                Discount
              </td>
              <td className="border border-black px-2 py-1 text-right text-xs text-emerald-700 font-semibold">
                - {formatCurrency(invoice.extra_discount)}
              </td>
            </tr>
          )}

          {/* ─── GST rows (CGST+SGST or IGST) ─── */}
          <GstSummaryRows invoice={invoice} />

          {/* ─── Round Off ─── */}
          {roundOff !== 0 && (
            <tr>
              <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold">
                Round Off
              </td>
              <td className="border border-black px-2 py-1 text-right text-xs">
                {roundOff > 0 ? `- ${formatCurrency(roundOff)}` : `+ ${formatCurrency(Math.abs(roundOff))}`}
              </td>
            </tr>
          )}

          {/* ─── Net Total ─── */}
          <tr className="bg-gray-100">
            <td colSpan={7} className="border border-black px-2 py-1.5 text-right text-sm font-extrabold">
              Total Amount
            </td>
            <td className="border border-black px-2 py-1.5 text-right text-sm font-extrabold">
              {formatCurrency(invoice.grand_total)}
            </td>
          </tr>

          {/* ─── Amount in Words ─── */}
          <tr>
            <td colSpan={8} className="border border-black px-3 py-1.5">
              <span className="text-[10px] font-semibold">Amount in Words: </span>
              <span className="text-[10px] italic font-medium">{numberToWords(invoice.grand_total)}</span>
            </td>
          </tr>

          {/* ─── Payment / Notes / Balance ─── */}
          <tr className="break-inside-avoid print:break-inside-avoid">
            <td colSpan={8} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Left: Payment Details & Notes */}
                    <td className="border-r border-black p-3 align-top w-1/2">
                      {(bankAccountNumber || bankName || bankIfscCode || upiId) && (
                        <div className="mb-2">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                            Bank Details
                          </div>
                          
                          {(bankAccountNumber || bankName || bankIfscCode) && (
                            <div className="text-[10px] space-y-0.5 mb-1.5">
                              {bankAccountHolder && <div><span className="font-semibold">A/C Name:</span> {bankAccountHolder}</div>}
                              {bankName && <div><span className="font-semibold">Bank:</span> {bankName}</div>}
                              {bankAccountNumber && <div><span className="font-semibold">A/C No:</span> {bankAccountNumber}</div>}
                              {bankIfscCode && <div><span className="font-semibold">IFSC:</span> <span className="uppercase font-mono">{bankIfscCode}</span></div>}
                              {bankBranch && <div><span className="font-semibold">Branch:</span> {bankBranch}</div>}
                            </div>
                          )}

                          {upiId && (
                            <div className="text-[10px] mt-1 pt-1 border-t border-gray-200">
                              <span className="font-semibold">UPI ID:</span> {upiId}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {invoice.notes && (
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Remarks / Terms</div>
                          <div className="text-[10px] text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
                        </div>
                      )}
                    </td>

                    {/* Right: Paid / Balance */}
                    <td className="p-3 align-top w-1/2">
                      <table className="w-full text-xs">
                        <tbody>
                          <tr>
                            <td className="py-1 font-semibold text-emerald-700 print:text-black">Paid Amount</td>
                            <td className="py-1 text-right font-semibold text-emerald-700 print:text-black">
                              {formatCurrency(invoice.paid_amount)}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-300">
                            <td className="py-1.5 font-extrabold text-sm text-red-700 print:text-black">Balance Due</td>
                            <td className="py-1.5 text-right font-extrabold text-sm text-red-700 print:text-black">
                              {formatCurrency(invoice.balance_amount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Footer: Signature + Thank you ─── */}
          <tr className="break-inside-avoid print:break-inside-avoid">
            <td colSpan={8} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-black p-2 align-bottom w-1/2 h-16">
                      <div className="text-[10px] text-gray-500 text-center">Customer Signature</div>
                    </td>
                    <td className="p-2 align-bottom w-1/2 h-16 text-right">
                      <div className="text-[10px] font-bold">For {companyName}</div>
                      <div className="text-[10px] text-gray-500 mt-4">Authorised Signatory</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row: Thank you bar ─── */}
          <tr className="break-inside-avoid print:break-inside-avoid">
            <td colSpan={8} className="border border-black text-center py-1 bg-gray-50 text-[10px] text-gray-500">
              Thank you for your business! This is a computer generated invoice.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function InvoiceDetailsView({ invoice, settings }: { invoice: any; settings: any }) {
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("selected_invoice_template");
    if (saved) {
      setTemplateId(saved);
    }
  }, []);

  const selectedTemplate = TEMPLATES.find(t => t.id === templateId);

  let content;
  if (selectedTemplate) {
    const TemplateComponent = selectedTemplate.component;
    // @ts-ignore
    content = <TemplateComponent invoice={invoice} settings={settings} />;
  } else {
    content = <LegacyInvoiceTemplate invoice={invoice} settings={settings} />;
  }

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar print:overflow-visible print:pb-0">
       <div className="min-w-[800px] w-full max-w-4xl mx-auto print:min-w-0 print:max-w-none print:w-full">
         {content}
       </div>
    </div>
  );
}
