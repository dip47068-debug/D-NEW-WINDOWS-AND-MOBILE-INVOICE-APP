const fs = require('fs');
const content = fs.readFileSync('src/components/InvoicesView.tsx', 'utf8');

const startMarker = "export function A4InvoicePrintLayout({";
const endMarker = "interface InvoicesViewProps {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const newLayout = `export function A4InvoicePrintLayout({
  invoice,
  companySettings,
  invoiceStyle,
  showBankInPrint,
  showProdDescInPrint,
  customProductDesc,
  isPreviewDarkMode = false,
  contacts,
}: A4InvoicePrintLayoutProps) {
  // Find customer email from contacts list if not present
  const customerContact = contacts.find(c => c.id === invoice.contactId || c.name === invoice.contactName);
  const customerEmail = customerContact?.email || "";
  const customerMobile = invoice.contactMobile || customerContact?.mobile || "";

  // Helper for UPI payment string
  const upiUrl = companySettings.upiId 
    ? \`upi://pay?pa=\${companySettings.upiId}&pn=\${encodeURIComponent(companySettings.companyName)}&am=\${invoice.grandTotal.toFixed(2)}&tn=\${encodeURIComponent(\`Inv \${invoice.invoiceNumber}\`)}&cu=INR\`
    : "";

  const items = invoice.items || [];

  return (
    <div 
      className={\`w-[210mm] min-h-[297mm] p-8 sm:p-10 flex flex-col justify-between transition-colors duration-200 bg-white text-[#111827] font-sans box-border relative overflow-hidden\`}
      style={{
        fontFamily: \`"\${invoiceStyle.fontFamily || 'Inter'}", system-ui, sans-serif\`,
        fontSize: invoiceStyle.fontSizeMultiplier === '90%' ? '0.92em' : invoiceStyle.fontSizeMultiplier === '110%' ? '1.08em' : '1em'
      }}
    >
      <div>
        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-start gap-4">
            {companySettings.logoUrl ? (
              <img 
                src={companySettings.logoUrl} 
                alt="Company Logo" 
                className="w-16 h-16 object-contain rounded-2xl border border-gray-100 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[#6D3DF5] to-[#8B5CF6] text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md shadow-[#6D3DF5]/20">
                {companySettings.companyName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 uppercase">{companySettings.companyName}</h1>
              {companySettings.tagline && <p className="text-xs font-semibold text-gray-500 italic mt-0.5">{companySettings.tagline}</p>}
              <div className="mt-2 space-y-0.5 text-[10px] text-gray-500 font-medium leading-relaxed">
                <p>{companySettings.address}</p>
                <p>Phone: <span className="font-bold text-gray-700">{companySettings.phone}</span> {companySettings.email && \`| Email: \${companySettings.email}\`}</p>
                {companySettings.gstin && <p>GSTIN: <span className="font-bold font-mono text-gray-700">{companySettings.gstin}</span></p>}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <h2 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#6D3DF5] to-[#8B5CF6]">
              Invoice
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-right">
              <span className="text-gray-500 font-medium">Invoice No:</span>
              <span className="font-bold text-gray-900">#{invoice.invoiceNumber}</span>
              <span className="text-gray-500 font-medium">Date:</span>
              <span className="font-bold text-gray-900">{invoice.date}</span>
              <span className="text-gray-500 font-medium">Due Date:</span>
              <span className="font-bold text-gray-900">{invoice.dueDate || invoice.date}</span>
            </div>
          </div>
        </div>

        {/* --- CUSTOMER INFO CARDS --- */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6D3DF5]"></span> Bill To
            </h3>
            <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">{invoice.contactName}</p>
            {customerEmail && <p className="text-xs text-gray-600 mt-1 font-medium">{customerEmail}</p>}
            {customerMobile && <p className="text-xs text-gray-600 font-medium">{customerMobile}</p>}
          </div>
          <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span> Payment Info
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className={\`font-bold uppercase px-2 py-0.5 rounded-md text-[10px] tracking-wider \${
                  invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }\`}>
                  {invoice.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Currency:</span>
                <span className="font-bold text-gray-900">INR (₹)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- ITEMS TABLE --- */}
        <div className="mb-8 rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wider w-12 text-center">#</th>
                <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wider">Item Description</th>
                <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wider text-center w-20">Qty</th>
                <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wider text-right w-24">Rate</th>
                {(invoice.totalCgst + invoice.totalSgst > 0) && (
                  <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wider text-right w-20">Tax</th>
                )}
                <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wider text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="py-3.5 px-4 font-medium text-gray-400 text-center">{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-900">{item.productName}</p>
                    {item.hsnCode && <p className="text-[10px] text-gray-500 mt-0.5 font-mono">HSN: {item.hsnCode}</p>}
                    {showProdDescInPrint && item.description && <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">{item.description}</p>}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-gray-700">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-gray-700">₹{item.rate.toFixed(2)}</td>
                  {(invoice.totalCgst + invoice.totalSgst > 0) && (
                    <td className="py-3.5 px-4 text-right font-medium text-gray-500">{item.taxRate}%</td>
                  )}
                  <td className="py-3.5 px-4 text-right font-bold text-gray-900">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- SUMMARY & BANK INFO --- */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7 flex flex-col justify-between">
            {showBankInPrint && companySettings.bankName ? (
              <div className="mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bank Details</h3>
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-1.5 text-[11px] shadow-sm">
                  <p><span className="text-gray-500 font-medium inline-block w-16">Bank:</span> <span className="font-bold text-gray-900">{companySettings.bankName}</span></p>
                  <p><span className="text-gray-500 font-medium inline-block w-16">Account:</span> <span className="font-mono font-bold text-gray-900">{companySettings.accountNumber}</span></p>
                  <p><span className="text-gray-500 font-medium inline-block w-16">IFSC:</span> <span className="font-mono font-bold text-gray-900">{companySettings.ifscCode}</span></p>
                  {companySettings.upiId && <p><span className="text-gray-500 font-medium inline-block w-16">UPI:</span> <span className="font-mono font-bold text-gray-900">{companySettings.upiId}</span></p>}
                </div>
              </div>
            ) : (
              <div></div>
            )}
            
            <div className="text-[10px] text-gray-500 space-y-1 mt-auto">
              <p className="font-bold text-gray-700 mb-1 uppercase tracking-wider text-[9px]">Terms & Conditions:</p>
              <p>1. Please pay within the due date to avoid late fees.</p>
              <p>2. Goods once sold will not be taken back or exchanged.</p>
              <p>3. Subject to local jurisdiction only.</p>
            </div>
          </div>
          
          <div className="col-span-5 bg-gray-50/80 rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 items-center">
                <span className="font-medium text-xs">Subtotal:</span>
                <span className="font-bold text-gray-900">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600 items-center">
                  <span className="font-medium text-xs">Discount:</span>
                  <span className="font-bold">-₹{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              {invoice.totalCgst > 0 && (
                <div className="flex justify-between text-gray-600 items-center">
                  <span className="font-medium text-xs">CGST:</span>
                  <span className="font-bold text-gray-900">₹{invoice.totalCgst.toFixed(2)}</span>
                </div>
              )}
              {invoice.totalSgst > 0 && (
                <div className="flex justify-between text-gray-600 items-center">
                  <span className="font-medium text-xs">SGST:</span>
                  <span className="font-bold text-gray-900">₹{invoice.totalSgst.toFixed(2)}</span>
                </div>
              )}
              {invoice.totalIgst > 0 && (
                <div className="flex justify-between text-gray-600 items-center">
                  <span className="font-medium text-xs">IGST:</span>
                  <span className="font-bold text-gray-900">₹{invoice.totalIgst.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="flex justify-between items-center p-3.5 rounded-2xl bg-gradient-to-r from-[#6D3DF5] to-[#8B5CF6] text-white shadow-lg shadow-[#6D3DF5]/30">
                <span className="font-bold uppercase tracking-wider text-[10px]">Grand Total</span>
                <span className="text-xl font-black tracking-tight">₹{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="pt-6 border-t border-gray-100 flex justify-between items-end mt-10">
        <div className="flex items-center gap-4">
          {upiUrl && (
            <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <img
                src={\`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=\${encodeURIComponent(upiUrl)}\`}
                alt="UPI QR Code"
                className="h-12 w-12 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-[7px] font-bold text-gray-400 tracking-widest mt-1 uppercase">Scan to Pay</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black text-gray-800 tracking-tight">Thank you for your business.</p>
            <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
              Powered by <span className="font-bold text-gray-600">{companySettings.companyName}</span>
            </p>
          </div>
        </div>
        <div className="text-center pb-2">
          <div className="w-40 h-12 border-2 border-dashed border-gray-200 rounded-xl mx-auto mb-2 flex items-center justify-center bg-gray-50/50">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Authorized Signatory</span>
          </div>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">For {companySettings.companyName}</p>
        </div>
      </div>
    </div>
  );
}

`;

const newContent = content.substring(0, startIndex) + newLayout + content.substring(endIndex);
fs.writeFileSync('src/components/InvoicesView.tsx', newContent);
console.log('Layout replaced');
