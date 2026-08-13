"use client"

import { formatCurrency, formatDate, formatDateTime, numberToWords } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";

/* ─────────────────── Helper: UPI QR Code ─────────────────── */
function UpiQrCode({ upiId, amount, name }: { upiId: string; amount?: number; name?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!upiId || !canvasRef.current) return;
    let upiUrl = `upi://pay?pa=${upiId}`;
    if (name) upiUrl += `&pn=${encodeURIComponent(name)}`;
    if (amount && amount > 0) upiUrl += `&am=${amount}`;
    upiUrl += `&cu=INR`;
    QRCode.toCanvas(canvasRef.current, upiUrl, { width: 100, margin: 1 });
  }, [upiId, amount, name]);

  if (!upiId) return null;
  return <canvas ref={canvasRef} className="mx-auto" />;
}

/* ─────────────────── Helper: GST summary rows ─────────────────── */
function GstSummaryRows({ invoice }: { invoice: any }) {
  const location = invoice.customer_location;
  const hasSplitData = invoice.cgst_rate != null || invoice.igst_rate != null;

  if (hasSplitData) {
    if (location === "Inside Tamil Nadu") {
      return (
        <>
          <tr>
            <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              CGST @ {invoice.cgst_rate ?? 2.5}%
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs">
              {formatCurrency(invoice.cgst_amount ?? 0)}
            </td>
          </tr>
          <tr>
            <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              SGST @ {invoice.sgst_rate ?? 2.5}%
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs">
              {formatCurrency(invoice.sgst_amount ?? 0)}
            </td>
          </tr>
        </>
      );
    } else {
      return (
        <tr>
          <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
            IGST @ {invoice.igst_rate ?? 5}%
          </td>
          <td className="border border-black px-2 py-1 text-right text-xs">
            {formatCurrency(invoice.igst_amount ?? 0)}
          </td>
        </tr>
      );
    }
  }

  // Legacy fallback
  return (
    <tr>
      <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
        GST @ {invoice.gst_rate}%
      </td>
      <td className="border border-black px-2 py-1 text-right text-xs">
        {formatCurrency(invoice.gst_amount)}
      </td>
    </tr>
  );
}

/* ─────────────────── Helper: Verification display ─────────────────── */
function getVerificationDisplay(invoice: any): string | null {
  const type = invoice.verification_type;
  const num = invoice.verification_number;
  const legacyGst = invoice.customer_gst;

  if (!type && !num) {
    if (legacyGst) return `GSTIN: ${legacyGst}`;
    return null;
  }

  const displayNum =
    type === "Aadhar" && num && num.length === 12
      ? `●●●● ●●●● ${num.slice(-4)}`
      : num;

  return `${type}: ${displayNum}`;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Traditional Indian Tax Invoice Layout
   ═══════════════════════════════════════════════════════════════════ */
export function InvoiceDetailsView({ invoice, settings }: { invoice: any; settings: any }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) setLogoUrl(savedLogo);
  }, []);

  /* ── Company settings ── */
  const companyName = settings?.company_name || "Your Company";
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
  const cashInstructions = settings?.cash_instructions || "";

  const verificationDisplay = getVerificationDisplay(invoice);

  /* Compute round-off */
  const roundOff = +(invoice.grand_total - Math.round(invoice.grand_total)).toFixed(2);
  const netTotal = Math.round(invoice.grand_total);

  return (
    <div className="bg-white text-black print:text-black max-w-4xl mx-auto print:max-w-none print:p-0 print:shadow-none print:border-0 shadow-sm border border-slate-200 rounded-xl overflow-hidden">
      {/* ═══════ Outermost table container ═══════ */}
      <table className="w-full border-collapse border border-black text-[11px] leading-snug" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
        <tbody>
          {/* ─── Row 1: Header (Logo + Company + QR) ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
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
                          <span className="uppercase">{companyGst}</span>
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
            <td colSpan={6} className="border border-black text-center py-1.5 bg-gray-100">
              <span className="text-sm font-extrabold tracking-[0.3em] uppercase">Tax Invoice</span>
              <span className="float-right pr-3 text-[10px] italic text-gray-500">Original Copy</span>
            </td>
          </tr>

          {/* ─── Row 3: Invoice metadata (No, Date, Location) ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-black px-3 py-1.5 text-xs w-1/2">
                      <span className="font-semibold">Invoice No:</span>{" "}
                      <span className="font-bold text-black">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-3 py-1.5 text-xs w-1/2 text-right">
                      <span className="font-semibold">Date & Time:</span>{" "}
                      <span className="font-bold">{formatDateTime(invoice.invoice_date, invoice.created_at)}</span>
                      {invoice.customer_location && (
                        <span className="ml-4 text-[10px] text-gray-500">
                          ({invoice.customer_location})
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
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Bill To */}
                    <td className="border-r border-black p-3 align-top w-1/2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Bill To</div>
                      <div className="font-bold text-sm">{invoice.customer_name}</div>
                      {invoice.customer_address && (
                        <div className="text-[10px] text-gray-700 whitespace-pre-wrap mt-0.5">{invoice.customer_address}</div>
                      )}
                      {verificationDisplay && (
                        <div className="text-[10px] mt-0.5">
                          <span className="uppercase font-medium">{verificationDisplay}</span>
                        </div>
                      )}
                      {invoice.customer_mobile && (
                        <div className="text-[10px] text-gray-600 mt-0.5">Mob: {invoice.customer_mobile}</div>
                      )}
                    </td>
                    {/* Shipped To / Transport */}
                    <td className="p-3 align-top w-1/2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
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
                      {!invoice.shipping_address && !invoice.transport_mode && !invoice.no_of_bundles && (
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
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[40px]">S.No</td>
            <td className="border border-black px-2 py-1.5 font-bold text-xs">Particulars</td>
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[80px]">HSN/SAC</td>
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[50px]">Qty</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[90px]">Rate</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[100px]">Amount</td>
          </tr>

          {/* ─── Item rows ─── */}
          {invoice.items.map((item: any, index: number) => (
            <tr key={item.id || index}>
              <td className="border border-black px-2 py-1.5 text-center text-xs">{index + 1}</td>
              <td className="border border-black px-2 py-1.5 text-xs font-medium">{item.bundle_name}</td>
              <td className="border border-black px-2 py-1.5 text-center text-xs">{item.hsn_code || "—"}</td>
              <td className="border border-black px-2 py-1.5 text-center text-xs">{item.quantity}</td>
              <td className="border border-black px-2 py-1.5 text-right text-xs">{formatCurrency(item.rate)}</td>
              <td className="border border-black px-2 py-1.5 text-right text-xs">{formatCurrency(item.amount)}</td>
            </tr>
          ))}

          {/* ─── Empty rows to fill space (minimum 5 visible rows) ─── */}
          {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
            </tr>
          ))}

          {/* ─── Subtotal ─── */}
          <tr className="bg-gray-50">
            <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              Sub Total
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs font-semibold">
              {formatCurrency(invoice.subtotal)}
            </td>
          </tr>

          {/* ─── GST rows (CGST+SGST or IGST) ─── */}
          <GstSummaryRows invoice={invoice} />

          {/* ─── Round Off ─── */}
          {roundOff !== 0 && (
            <tr>
              <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
                Round Off
              </td>
              <td className="border border-black px-2 py-1 text-right text-xs">
                {roundOff > 0 ? `- ${formatCurrency(roundOff)}` : `+ ${formatCurrency(Math.abs(roundOff))}`}
              </td>
            </tr>
          )}

          {/* ─── Net Total ─── */}
          <tr className="bg-gray-100">
            <td colSpan={5} className="border border-black px-2 py-1.5 text-right text-sm font-extrabold">
              Net Total
            </td>
            <td className="border border-black px-2 py-1.5 text-right text-sm font-extrabold">
              {formatCurrency(invoice.grand_total)}
            </td>
          </tr>

          {/* ─── Amount in Words ─── */}
          <tr>
            <td colSpan={6} className="border border-black px-3 py-2">
              <span className="text-[10px] font-semibold">Amount in Words: </span>
              <span className="text-[10px] italic">{numberToWords(invoice.grand_total)}</span>
            </td>
          </tr>

          {/* ─── Payment / Notes / Balance ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Left: Payment Details & Notes */}
                    <td className="border-r border-black p-3 align-top w-1/2">
                      {/* Payment & Bank Details */}
                      {(bankAccountNumber || bankName || bankIfscCode || upiId) && (
                        <div className="mb-2">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                            Payment Details
                          </div>
                          
                          {/* Bank Details */}
                          {(bankAccountNumber || bankName || bankIfscCode) && (
                            <div className="text-[10px] space-y-0.5 mb-1.5">
                              {bankAccountHolder && <div><span className="font-semibold">A/C Name:</span> {bankAccountHolder}</div>}
                              {bankName && <div><span className="font-semibold">Bank:</span> {bankName}</div>}
                              {bankAccountNumber && <div><span className="font-semibold">A/C No:</span> {bankAccountNumber}</div>}
                              {bankIfscCode && <div><span className="font-semibold">IFSC:</span> <span className="uppercase">{bankIfscCode}</span></div>}
                              {bankBranch && <div><span className="font-semibold">Branch:</span> {bankBranch}</div>}
                            </div>
                          )}

                          {/* UPI Details */}
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
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-black p-3 align-bottom w-1/2 h-20">
                      <div className="text-[10px] text-gray-500 text-center">Customer Signature</div>
                    </td>
                    <td className="p-3 align-bottom w-1/2 h-20 text-right">
                      <div className="text-[10px] font-bold">For {companyName}</div>
                      <div className="text-[10px] text-gray-500 mt-6">Authorised Signatory</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row: Thank you bar ─── */}
          <tr>
            <td colSpan={6} className="border border-black text-center py-1.5 bg-gray-50 text-[10px] text-gray-500">
              Thank you for your business! This is a computer generated invoice.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
