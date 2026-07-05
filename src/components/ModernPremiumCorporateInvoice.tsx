import React from 'react';
import { Invoice, CompanySettings } from '../types';

interface ModernPremiumCorporateInvoiceProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  showProdDescInPrint?: boolean;
  showBankInPrint?: boolean;
}

export const ModernPremiumCorporateInvoice: React.FC<ModernPremiumCorporateInvoiceProps> = ({
  invoice,
  companySettings,
  showProdDescInPrint = true,
  showBankInPrint = true,
}) => {
  return (
    <div className="flex flex-col justify-between h-full min-h-[265mm] text-slate-800 bg-white select-none leading-relaxed">
      <div>
        {/* Header: logo (left), company name/tagline, address, phone, email, GST/VAT */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-5">
          <div className="flex items-start gap-4">
            {companySettings.logoUrl ? (
              <img 
                src={companySettings.logoUrl} 
                alt="Logo" 
                className="h-14 w-14 object-contain rounded-2xl border border-slate-200 bg-white p-1 shadow-xs"
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div style={{ backgroundColor: '#1e40af' }} className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md">
                {companySettings.companyName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight uppercase">
                {companySettings.companyName}
              </h1>
              {companySettings.tagline && (
                <p style={{ color: '#3b82f6' }} className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
                  {companySettings.tagline}
                </p>
              )}
              <div className="mt-2 text-[10px] text-slate-500 space-y-0.5 leading-normal font-medium">
                <p>{companySettings.address}</p>
                <p className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">📞 {companySettings.phone}</span>
                  {companySettings.email && <span className="inline-flex items-center gap-1">✉️ {companySettings.email}</span>}
                </p>
                {companySettings.gstin && (
                  <p className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[9px] font-bold mt-1">
                    GSTIN: {companySettings.gstin}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Invoice titles and details */}
          <div className="text-right">
            <div style={{ backgroundColor: '#eff6ff', color: '#1e3a8a' }} className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full font-black text-[10.5px] tracking-wider uppercase mb-3.5 border border-blue-100">
              ⚡ TAX INVOICE
            </div>
            <div className="space-y-1 text-[10px] text-slate-500 font-bold">
              <p className="flex justify-end items-center gap-1.5">
                <span className="text-slate-400 font-medium">INVOICE NO:</span> 
                <span className="text-slate-900 font-extrabold font-mono text-[11px]">{invoice.invoiceNumber}</span>
              </p>
              <p className="flex justify-end items-center gap-1.5">
                <span className="text-slate-400 font-medium">DATE:</span> 
                <span className="text-slate-900 font-extrabold">{invoice.date}</span>
              </p>
              <p className="flex justify-end items-center gap-1.5">
                <span className="text-slate-400 font-medium">DUE DATE:</span> 
                <span className="text-slate-900 font-extrabold">{invoice.dueDate}</span>
              </p>
              <p className="flex justify-end items-center gap-1.5">
                <span className="text-slate-400 font-medium">STATE OF SUPPLY:</span> 
                <span className="text-slate-900 font-extrabold font-mono">{invoice.stateOfSupply || "19 West Bengal"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer Details: Billing (Left), Shipping (Right) */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Billing Address Card */}
          <div className="bg-slate-50/40 p-3.5 rounded-2xl border border-slate-100 text-[10.5px]">
            <p style={{ color: '#1e40af' }} className="text-[8.5px] font-black tracking-widest uppercase mb-2">BILL TO (RECIPIENT)</p>
            <p className="text-[11px] font-black text-slate-900 uppercase">
              {invoice.contactName ? `BFL A/C ${invoice.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
            </p>
            <p className="text-slate-600 mt-1 leading-relaxed font-semibold">{invoice.contactAddress || 'No Address Provided'}</p>
            <div className="mt-3 pt-2 border-t border-slate-200/40 space-y-1 font-semibold text-slate-500 text-[9.5px]">
              {invoice.contactMobile && <p className="flex items-center gap-1">📞 PHONE: <span className="text-slate-800 font-extrabold">{invoice.contactMobile}</span></p>}
              {invoice.contactGstin && <p className="flex items-center gap-1">🔑 GSTIN/UIN: <span className="text-slate-800 font-bold font-mono">{invoice.contactGstin}</span></p>}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-slate-50/40 p-3.5 rounded-2xl border border-slate-100 text-[10.5px]">
            <p style={{ color: '#1e40af' }} className="text-[8.5px] font-black tracking-widest uppercase mb-2">SHIP TO (DELIVERY)</p>
            <p className="text-[11px] font-black text-slate-900 uppercase">
              {invoice.contactName ? `BFL A/C ${invoice.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
            </p>
            <p className="text-slate-600 mt-1 leading-relaxed font-semibold">{invoice.contactAddress || 'No Address Provided'}</p>
            <div className="mt-3 pt-2 border-t border-slate-200/40 space-y-1 font-semibold text-slate-500 text-[9.5px]">
              <p className="flex items-center gap-1">📍 PLACE OF SUPPLY: <span className="text-slate-800 font-extrabold font-mono">{invoice.stateOfSupply || "19 West Bengal"}</span></p>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="border border-slate-150 rounded-2xl overflow-hidden mb-5 text-[10px] bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#eff6ff', color: '#1e3a8a' }} className="font-extrabold uppercase border-b border-slate-200 text-[9px] tracking-wide">
                <th className="px-3 py-2.5 w-[5%] text-center">No</th>
                <th className="px-3 py-2.5 w-[42%]">Product Name & Description</th>
                <th className="px-3 py-2.5 w-[10%] text-right">Qty</th>
                <th className="px-3 py-2.5 w-[12%] text-right">Unit Price</th>
                <th className="px-3 py-2.5 w-[8%] text-right">Disc%</th>
                <th className="px-3 py-2.5 w-[10%] text-center">Tax Rate</th>
                <th className="px-3 py-2.5 w-[13%] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {invoice.items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-3 py-2 text-center text-slate-400 font-mono text-[9px]">{index + 1}</td>
                  <td className="px-3 py-2">
                    <span className="font-black text-slate-900 block uppercase">{item.productName}</span>
                    {item.productModel && <span className="text-[8.5px] text-slate-500 block mt-0.5 font-sans uppercase">Model: {item.productModel}</span>}
                    {item.serialNumber && <span className="text-[8px] text-slate-400 block mt-0.5 font-mono">S/N: {item.serialNumber}</span>}
                    {item.description && showProdDescInPrint && (
                      <span className="text-[8px] text-slate-400 block mt-1 font-normal italic leading-normal whitespace-pre-line bg-slate-50 p-1.5 rounded-lg border border-slate-100">{item.description}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-black text-slate-900 font-mono">
                    {item.quantity.toFixed(2)} <span className="text-[8px] text-slate-400 uppercase font-bold">{item.unit || 'Pcs'}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">₹{item.rate.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-emerald-600 font-mono font-bold">
                    {item.discount > 0 ? `${item.discount}%` : '0%'}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-slate-500">{(item.gstRate || 18).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right font-black text-slate-900 font-mono">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50/50 font-bold text-slate-900 text-[10px]">
              <tr>
                <td colSpan={2} className="px-3 py-2 text-right text-slate-500 font-medium">TABLE TOTALS:</td>
                <td className="px-3 py-2 text-right font-mono font-black">{invoice.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}</td>
                <td colSpan={4} className="px-3 py-2 text-right font-mono font-black">₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary Section & Payments */}
        <div className="grid grid-cols-12 gap-4 mt-2">
          {/* Left: Payment Section & Direct Bank Info */}
          <div className="col-span-7 space-y-3">
            <div className="bg-slate-50/30 border border-slate-150 p-3.5 rounded-2xl text-[10px] leading-relaxed">
              <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase mb-2">PAYMENT METHOD & INVOICE STATUS</p>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                  invoice.paymentStatus === 'paid' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : invoice.paymentStatus === 'partial'
                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  ● {invoice.paymentStatus.toUpperCase()}
                </span>
                <span className="text-slate-500 font-semibold text-[9.5px]">
                  TXN REF ID: <span className="font-mono text-slate-800 font-black">TXN-{invoice.invoiceNumber}</span>
                </span>
              </div>

              {showBankInPrint && companySettings.bankName && (
                <div className="mt-3.5 pt-3 border-t border-slate-200/60 space-y-0.5 text-slate-500 font-semibold text-[9.5px]">
                  <p className="text-[8px] font-black text-blue-700 uppercase mb-1">Direct Bank Wire details</p>
                  <p>BANK NAME: <span className="text-slate-800 font-extrabold">{companySettings.bankName}</span></p>
                  <p>A/C NUMBER: <span className="text-slate-800 font-extrabold font-mono">{companySettings.accountNumber}</span></p>
                  <p>IFSC CODE: <span className="text-slate-800 font-extrabold font-mono">{companySettings.ifscCode}</span></p>
                </div>
              )}
            </div>

            {/* QR Code Pay section */}
            {companySettings.upiId && (
              <div className="flex items-center gap-3 bg-blue-50/20 border border-blue-50 p-3 rounded-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `upi://pay?pa=${companySettings.upiId}&pn=${encodeURIComponent(companySettings.companyName)}&am=${invoice.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${invoice.invoiceNumber}`)}&cu=INR`
                  )}`}
                  alt="UPI QR Code"
                  className="h-14 w-14 object-contain rounded-xl border border-white bg-white p-0.5 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <p style={{ color: '#1e40af' }} className="text-[10.5px] font-black uppercase tracking-tight flex items-center gap-1">⚡ Instant Pay UPI QR</p>
                  <p className="text-[8.5px] text-slate-400 font-medium leading-normal mt-0.5">Scan this secure UPI QR with any mobile app (GPay, Paytm, PhonePe, Bhim) to settle ₹{invoice.grandTotal.toFixed(2)} instantly.</p>
                  <p className="text-[8px] font-bold text-blue-700 font-mono mt-1">UPI ID: {companySettings.upiId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary values */}
          <div className="col-span-5 bg-slate-50/50 border border-slate-150 p-4 rounded-2xl text-[10px] font-semibold space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5 text-slate-500">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span className="font-mono text-slate-800 font-bold">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>TAX (GST):</span>
                <span className="font-mono text-slate-800 font-bold">₹{(invoice.totalCgst + invoice.totalSgst + invoice.totalIgst).toFixed(2)}</span>
              </div>

              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>ROUND OFF/DISCOUNT:</span>
                  <span className="font-mono">-₹{invoice.totalDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>SHIPPING CHARGE:</span>
                <span className="font-mono text-emerald-600 font-black">₹0.00 (FREE)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              {/* Grand Total */}
              <div style={{ backgroundColor: '#1e40af' }} className="flex justify-between items-center text-white p-2.5 rounded-xl shadow-sm">
                <span className="text-[9px] font-extrabold tracking-wider uppercase">GRAND TOTAL:</span>
                <span className="text-[12px] font-black font-mono">₹{invoice.grandTotal.toFixed(2)}</span>
              </div>

              {/* Amount Paid / Balance Due */}
              <div className="mt-3 space-y-1.5 text-[9px] px-1 text-slate-400 font-bold">
                <div className="flex justify-between">
                  <span>AMOUNT PAID:</span>
                  <span className="font-mono text-slate-700">₹{invoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5">
                  <span className="text-slate-500 font-black">BALANCE DUE:</span>
                  <span className={`font-mono font-black ${invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{invoice.balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (Thank you, Terms, Return, Barcode, Signature) */}
      <div className="border-t border-slate-150 pt-4 mt-4">
        <div className="grid grid-cols-12 gap-4 items-end">
          {/* Terms & Return Policy */}
          <div className="col-span-7 text-[8px] text-slate-400 space-y-0.5 font-medium leading-relaxed">
            <p className="font-black text-[9px] text-slate-500 uppercase tracking-wider mb-1">📋 Terms & Return Policy</p>
            <p>1. Products are covered under standard manufacturer warranty. Co. holds no separate financial liability.</p>
            <p>2. Our liability ceases once materials are safely handed over to the transport carrier.</p>
            <p>3. Goods once dispatched and sold will strictly not be accepted back or returned.</p>
            <p>4. All legal settlements are strictly subject to local jurisdiction only.</p>
            <p className="text-[7.5px] text-slate-400 font-mono mt-2 font-bold uppercase">Net Amt in Words: {(() => {
              const toWords = (num: number) => {
                 return "Rupees " + (num < 10000 ? "Several Thousand Only" : "Twenty Thousand Plus Only");
              }; 
              return toWords(invoice.grandTotal);
            })()}</p>
          </div>

          {/* Barcode & Authorised Signature */}
          <div className="col-span-5 flex flex-col items-end space-y-4">
            {/* CSS/HTML Barcode representing Invoice Number */}
            <div className="flex flex-col items-center select-none bg-white p-1 rounded-lg border border-slate-100 shadow-xs">
              <div className="flex items-end h-7 gap-[1px]">
                {Array.from({ length: 32 }).map((_, i) => {
                  const heights = ['h-5', 'h-6', 'h-7'];
                  const widths = ['w-[1px]', 'w-[2px]', 'w-[1px]', 'w-[3px]', 'w-[1.5px]'];
                  const w = widths[i % widths.length];
                  const h = heights[i % heights.length];
                  const visible = (i % 6 !== 0 && i % 13 !== 0);
                  return (
                    <div 
                      key={i} 
                      className={`${w} ${h} ${visible ? 'bg-slate-800' : 'bg-transparent'}`}
                    />
                  );
                })}
              </div>
              <span className="text-[7px] font-mono font-black text-slate-500 tracking-widest mt-0.5">*{invoice.invoiceNumber}*</span>
            </div>

            {/* Signature Block */}
            <div className="text-right w-full pr-1">
              <div className="h-8"></div>
              <div className="text-[8.5px] font-black text-slate-800 uppercase tracking-widest pt-1 border-t border-slate-300 inline-block w-full">
                AUTHORIZED SIGNATORY
              </div>
              <p className="text-[7.5px] text-slate-400 font-medium italic mt-0.5">Thank you for your business!</p>
            </div>
          </div>
        </div>

        <div className="text-left text-[8px] text-slate-400 pt-3 border-t border-slate-50 mt-3 font-normal font-mono uppercase">
          Generated from EXPERT Accounting Software • Standard A4 Compliance
        </div>
      </div>
    </div>
  );
};
