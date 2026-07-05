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
  
  // Number to Words function
  const numToWords = (num: number) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\\d{2})(\\d{2})(\\d{2})(\\d{1})(\\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str ? str + 'Rupees Only' : '';
  };

  return (
    <div 
      className={\`w-[210mm] min-h-[297mm] flex flex-col bg-white text-black font-sans box-border relative p-[10mm]\`}
      style={{
        fontFamily: \`"\${invoiceStyle.fontFamily || 'Inter'}", system-ui, sans-serif\`,
        fontSize: invoiceStyle.fontSizeMultiplier === '90%' ? '0.92em' : invoiceStyle.fontSizeMultiplier === '110%' ? '1.08em' : '1em'
      }}
    >
      <div className="flex-grow border border-black flex flex-col h-full">
        {/* --- TOP COPY STRIP --- */}
        <div className="flex justify-center items-center border-b border-black text-[10px] font-bold uppercase py-1">
          <span className="px-4">Original</span>
          <span className="border-l border-black px-4">Duplicate</span>
          <span className="border-l border-black px-4">Triplicate</span>
        </div>

        <div className="text-center font-bold text-lg uppercase py-1 border-b border-black tracking-widest bg-gray-50">
          TAX INVOICE
        </div>

        {/* --- COMPANY HEADER --- */}
        <div className="flex border-b border-black">
          <div className="flex-1 p-3 border-r border-black">
            <h1 className="text-2xl font-black uppercase text-black mb-1">{companySettings.companyName}</h1>
            <div className="text-xs space-y-0.5">
              <p>{companySettings.address}</p>
              <p>Mob: {companySettings.phone} {companySettings.email && \`| Email: \${companySettings.email}\`}</p>
              {companySettings.gstin && <p className="mt-1">GSTIN: <span className="font-bold">{companySettings.gstin}</span></p>}
            </div>
          </div>
          <div className="flex-1 p-3 text-xs flex flex-col justify-center space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-bold">Invoice No:</span> {invoice.invoiceNumber}</div>
              <div><span className="font-bold">Date:</span> {invoice.date}</div>
              {companySettings.state && <div><span className="font-bold">State:</span> {companySettings.state}</div>}
              <div><span className="font-bold">Place of Supply:</span> {invoice.stateOfSupply || '-'}</div>
            </div>
          </div>
        </div>

        {/* --- CUSTOMER INFO SECTION --- */}
        <div className="flex border-b border-black">
          <div className="flex-1 p-3 border-r border-black text-xs">
            <div className="font-bold mb-1 underline">Billed To:</div>
            <p className="font-bold text-sm uppercase">{invoice.contactName}</p>
            <p className="whitespace-pre-line">{invoice.contactAddress || 'Address not provided'}</p>
            <p>Mob: {customerMobile}</p>
            {invoice.contactGstin && <p className="mt-1">GSTIN: <span className="font-bold">{invoice.contactGstin}</span></p>}
          </div>
          <div className="flex-1 p-3 text-xs">
             {/* Optional Shipping Address */}
             <div className="font-bold mb-1 underline">Shipped To:</div>
             <p className="font-bold text-sm uppercase">{invoice.contactName}</p>
             <p className="whitespace-pre-line">{invoice.contactAddress || 'Same as billing address'}</p>
          </div>
        </div>

        {/* --- ITEMS TABLE --- */}
        <div className="flex-grow flex flex-col">
          <table className="w-full text-left text-xs border-collapse flex-grow">
            <thead>
              <tr className="border-b border-black bg-gray-50">
                <th className="p-2 border-r border-black font-bold text-center w-10">Sr.</th>
                <th className="p-2 border-r border-black font-bold">Item Description</th>
                <th className="p-2 border-r border-black font-bold text-center w-16">HSN/SAC</th>
                <th className="p-2 border-r border-black font-bold text-center w-12">Qty</th>
                <th className="p-2 border-r border-black font-bold text-right w-20">List Price</th>
                <th className="p-2 border-r border-black font-bold text-right w-16">Disc</th>
                <th className="p-2 border-r border-black font-bold text-center w-12">Tax %</th>
                <th className="p-2 font-bold text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                  <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-black">
                    <p className="font-bold">{item.productName}</p>
                    {showProdDescInPrint && item.description && <p className="text-[10px] mt-0.5 whitespace-pre-line">{item.description}</p>}
                  </td>
                  <td className="p-2 border-r border-black text-center">{item.hsnCode || '-'}</td>
                  <td className="p-2 border-r border-black text-center">{item.quantity} {item.unit || 'PCS'}</td>
                  <td className="p-2 border-r border-black text-right">{(item.rate).toFixed(2)}</td>
                  <td className="p-2 border-r border-black text-right">{item.discount || '0'}</td>
                  <td className="p-2 border-r border-black text-center">{item.taxRate}%</td>
                  <td className="p-2 text-right">{(item.total).toFixed(2)}</td>
                </tr>
              ))}
              {/* Filler row to push footer down if items are few */}
              <tr className="h-full">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- TOTALS SECTION --- */}
        <div className="border-t border-black flex flex-col md:flex-row">
           <div className="flex-1 p-3 border-r border-black text-xs flex flex-col justify-between">
             <div>
                <p className="mb-2"><span className="font-bold underline">Amount in Words:</span></p>
                <p className="font-bold uppercase">{numToWords(Math.round(invoice.grandTotal))} Only</p>
             </div>
             
             <div className="mt-4 border-t border-gray-300 pt-2">
                <p><span className="font-bold">Settled By:</span> {invoice.paymentStatus === 'paid' ? 'Cash / UPI / Bank' : 'Unpaid'}</p>
             </div>
           </div>
           <div className="w-[250px]">
             <div className="flex text-xs border-b border-gray-300">
               <div className="flex-1 p-1.5 border-r border-gray-300 font-medium">Sub Total</div>
               <div className="flex-1 p-1.5 text-right">{invoice.subtotal.toFixed(2)}</div>
             </div>
             {invoice.discount > 0 && (
               <div className="flex text-xs border-b border-gray-300">
                 <div className="flex-1 p-1.5 border-r border-gray-300 font-medium">Discount</div>
                 <div className="flex-1 p-1.5 text-right">- {invoice.discount.toFixed(2)}</div>
               </div>
             )}
             <div className="flex text-xs border-b border-gray-300">
               <div className="flex-1 p-1.5 border-r border-gray-300 font-medium">Taxable Amount</div>
               <div className="flex-1 p-1.5 text-right">{(invoice.subtotal - invoice.discount).toFixed(2)}</div>
             </div>
             {invoice.totalCgst > 0 && (
               <div className="flex text-xs border-b border-gray-300">
                 <div className="flex-1 p-1.5 border-r border-gray-300 font-medium">CGST</div>
                 <div className="flex-1 p-1.5 text-right">{invoice.totalCgst.toFixed(2)}</div>
               </div>
             )}
             {invoice.totalSgst > 0 && (
               <div className="flex text-xs border-b border-gray-300">
                 <div className="flex-1 p-1.5 border-r border-gray-300 font-medium">SGST</div>
                 <div className="flex-1 p-1.5 text-right">{invoice.totalSgst.toFixed(2)}</div>
               </div>
             )}
             {invoice.totalIgst > 0 && (
               <div className="flex text-xs border-b border-gray-300">
                 <div className="flex-1 p-1.5 border-r border-gray-300 font-medium">IGST</div>
                 <div className="flex-1 p-1.5 text-right">{invoice.totalIgst.toFixed(2)}</div>
               </div>
             )}
             <div className="flex text-xs border-b border-gray-300">
               <div className="flex-1 p-1.5 border-r border-gray-300 font-medium">Round Off</div>
               <div className="flex-1 p-1.5 text-right">{(invoice.grandTotal - (invoice.subtotal - invoice.discount + invoice.totalCgst + invoice.totalSgst + invoice.totalIgst)).toFixed(2)}</div>
             </div>
             <div className="flex text-sm bg-gray-100">
               <div className="flex-1 p-2 border-r border-gray-300 font-black">Grand Total</div>
               <div className="flex-1 p-2 text-right font-black">₹{Math.round(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             </div>
           </div>
        </div>

        {/* --- FOOTER (3 COLUMNS) --- */}
        <div className="flex border-t border-black text-[10px] min-h-[100px]">
          <div className="flex-1 p-3 border-r border-black">
            <div className="font-bold underline mb-1">Terms & Conditions</div>
            <ul className="list-decimal pl-3 space-y-0.5">
              <li>Goods once sold will not be taken back.</li>
              <li>Subject to local jurisdiction.</li>
              <li>E.&O.E.</li>
            </ul>
            <p className="mt-4 font-bold text-center">Thank you for your business!</p>
          </div>
          
          <div className="flex-1 p-3 border-r border-black flex flex-col justify-center">
            {showBankInPrint && companySettings.bankName && (
              <>
                <div className="font-bold underline mb-1">Payment Details</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                  <span className="font-bold">Bank:</span> <span>{companySettings.bankName}</span>
                  <span className="font-bold">A/c No:</span> <span>{companySettings.accountNumber}</span>
                  <span className="font-bold">IFSC:</span> <span>{companySettings.ifscCode}</span>
                  {companySettings.upiId && <><span className="font-bold">UPI:</span> <span>{companySettings.upiId}</span></>}
                </div>
              </>
            )}
          </div>
          
          <div className="flex-1 p-3 flex flex-col items-center justify-end relative">
             <div className="absolute top-2 left-2 text-xs font-bold">For {companySettings.companyName}</div>
             {/* Seal/Stamp space */}
             <div className="w-full flex justify-center mb-2 mt-8 opacity-20">
               {/* Optional visual placeholder for a seal */}
             </div>
             <div className="border-t border-black w-3/4 text-center pt-1 mt-auto font-bold">
               Authorized Signatory
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

const newContent = content.substring(0, startIndex) + newLayout + content.substring(endIndex);
fs.writeFileSync('src/components/InvoicesView.tsx', newContent);
console.log('Layout replaced 3');
