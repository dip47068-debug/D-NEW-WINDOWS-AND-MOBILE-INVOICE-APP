/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModernPremiumCorporateInvoice } from './ModernPremiumCorporateInvoice';
import { CommercialGreenCorporateInvoice } from './CommercialGreenCorporateInvoice';
import { QRCodeGenerator } from './QRCodeGenerator';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Printer, 
  Download, 
  Share2, 
  X, 
  CheckCircle, 
  ArrowLeft, 
  Send,
  Building,
  MapPin,
  FileSpreadsheet,
  Palette,
  UploadCloud,
  Check,
  RotateCcw,
  Leaf,
  Cpu,
  Sparkles,
  Sun,
  Moon,
  QrCode,
  Smartphone,
  History,
  Loader2
} from 'lucide-react';
import { Invoice, Contact, Product, InvoiceItem, CompanySettings, InvoiceChangeLogEntry } from '../types';
import { useAuth } from '../lib/AuthContext';

interface A4InvoicePrintLayoutProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  invoiceStyle: any;
  showBankInPrint: boolean;
  showProdDescInPrint: boolean;
  customProductDesc: string;
  isPreviewDarkMode?: boolean;
  contacts: Contact[];
}

export function A4InvoicePrintLayout({
  invoice,
  companySettings,
  invoiceStyle,
  showBankInPrint,
  showProdDescInPrint,
  customProductDesc,
  isPreviewDarkMode = false,
  contacts,
}: A4InvoicePrintLayoutProps) {
  // Find customer details from contacts list if not present
  const customerContact = contacts.find(c => c.id === invoice.contactId || c.name === invoice.contactName);
  const customerMobile = invoice.contactMobile || customerContact?.mobile || "";
  const customerAddress = invoice.contactAddress || customerContact?.address || "Address not provided";
  const customerEmail = customerContact?.email || "";

  // Helper for UPI payment string
  const upiUrl = companySettings.upiId 
    ? `upi://pay?pa=${companySettings.upiId}&pn=${encodeURIComponent(companySettings.companyName)}&am=${invoice.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${invoice.invoiceNumber}`)}&cu=INR`
    : "";

  const items = invoice.items || [];
  
  // Number to Words function
  const numToWords = (num: number) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    const numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str ? str + 'Rupees Only' : '';
  };

  // Group tax by rates for bottom-left Tax Summary
  const taxGroups: { [rate: number]: { taxable: number; cgst: number; sgst: number; igst: number; totalTax: number } } = {};
  items.forEach(item => {
    const rate = item.gstRate || 0;
    const cgst = item.cgst || 0;
    const sgst = item.sgst || 0;
    const igst = item.igst || 0;
    const taxable = item.total - (cgst + sgst + igst);
    
    if (!taxGroups[rate]) {
      taxGroups[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    }
    taxGroups[rate].taxable += taxable;
    taxGroups[rate].cgst += cgst;
    taxGroups[rate].sgst += sgst;
    taxGroups[rate].igst += igst;
    taxGroups[rate].totalTax += (cgst + sgst + igst);
  });

  return (
    <div 
      className="w-[210mm] min-h-[297mm] flex flex-col bg-white text-black font-sans box-border relative p-[10mm]"
      style={{
        fontFamily: `"${invoiceStyle.fontFamily || 'Inter'}", system-ui, sans-serif`,
        fontSize: invoiceStyle.fontSizeMultiplier === '90%' ? '0.90em' : invoiceStyle.fontSizeMultiplier === '110%' ? '1.08em' : '1.0em'
      }}
    >
      {/* Outer Border */}
      <div className="flex-grow border border-black flex flex-col h-full w-full justify-between">
        
        {/* --- TOP COPY STRIP --- */}
        <div className="flex justify-center items-center border-b border-black text-[10px] font-bold uppercase py-1 text-center w-full">
          <span className="px-4">Original</span>
        </div>

        {/* --- TAX INVOICE TITLE BAR --- */}
        <div className="relative flex justify-center items-center border-b border-black py-1.5 min-h-[32px] bg-white">
          <div className="font-black text-sm uppercase tracking-widest text-center">
            TAX INVOICE
          </div>
          <div className="absolute right-0 top-0 bottom-0 border-l border-black px-4 flex items-center text-[10px] font-bold uppercase tracking-wider bg-white">
            Original Copy for Recipient
          </div>
        </div>

        {/* --- COMPANY HEADER (Centered Corporate Style) --- */}
        <div className="p-4 border-b border-black text-center flex flex-col items-center justify-center">
          <h1 className="text-2xl font-black uppercase tracking-wider text-black mb-1">{companySettings.companyName}</h1>
          {companySettings.tagline && <p className="text-[10px] italic font-medium mb-1.5 text-gray-700">{companySettings.tagline}</p>}
          <div className="text-[11px] font-medium leading-relaxed max-w-[500px]">
            <p>{companySettings.address}</p>
            <p className="mt-1">
              <span>Mob: {companySettings.phone}</span>
              {companySettings.email && <span> | Email: {companySettings.email}</span>}
              {companySettings.gstin && <span className="font-bold"> | GSTIN: {companySettings.gstin}</span>}
              {(companySettings as any).state && <span> | State: {(companySettings as any).state}</span>}
            </p>
          </div>
        </div>

        {/* --- CUSTOMER & INVOICE DETAILS BLOCK --- */}
        <div className="flex border-b border-black text-xs divide-x divide-black">
          {/* Left: Customer Details */}
          <div className="flex-1 p-3 flex flex-col space-y-1">
            <div className="font-bold underline mb-1 uppercase tracking-wider text-[10px] text-gray-800">Billed To:</div>
            <p className="font-extrabold text-[13px] uppercase">{invoice.contactName}</p>
            <p className="whitespace-pre-line leading-relaxed">{customerAddress}</p>
            {customerMobile && <p><span className="font-bold">Mobile:</span> {customerMobile}</p>}
            {customerEmail && <p><span className="font-bold">Email:</span> {customerEmail}</p>}
            {invoice.contactGstin && <p><span className="font-bold">GSTIN/UIN:</span> <span className="font-extrabold">{invoice.contactGstin}</span></p>}
            {customerContact?.gstin && <p><span className="font-bold">PAN:</span> {customerContact.gstin.substring(2, 12)}</p>}
            <p><span className="font-bold">State:</span> {invoice.stateOfSupply || 'Not Specified'}</p>
            <p><span className="font-bold">Reverse Charge:</span> No</p>
          </div>

          {/* Right: Invoice Details */}
          <div className="flex-1 p-3 flex flex-col space-y-1.5 justify-start">
            <div className="font-bold underline mb-1 uppercase tracking-wider text-[10px] text-gray-800">Invoice Details:</div>
            <div className="grid grid-cols-[130px_1fr] gap-y-1 text-xs">
              <span className="font-bold">Invoice Number:</span>
              <span className="font-extrabold text-[13px]">{invoice.invoiceNumber}</span>

              <span className="font-bold">Invoice Date:</span>
              <span>{invoice.date}</span>

              <span className="font-bold">Due Date:</span>
              <span>{invoice.dueDate || '-'}</span>

              <span className="font-bold">State of Supply:</span>
              <span>{invoice.stateOfSupply || '-'}</span>

              <span className="font-bold">Payment Status:</span>
              <span className="uppercase font-bold">{invoice.paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* --- PRODUCT TABLE --- */}
        <div className="flex-grow flex flex-col bg-white">
          <table className="w-full text-left text-xs border-collapse flex-grow">
            <thead>
              <tr className="border-b border-black text-[11px] uppercase bg-white">
                <th className="p-2 border-r border-black font-bold text-center w-8">Sr.</th>
                <th className="p-2 border-r border-black font-bold text-center w-24">HSN/SAC</th>
                <th className="p-2 border-r border-black font-bold">Product Description</th>
                <th className="p-2 border-r border-black font-bold text-center w-12">Qty</th>
                <th className="p-2 border-r border-black font-bold text-center w-12">Unit</th>
                <th className="p-2 border-r border-black font-bold text-right w-20">Rate</th>
                <th className="p-2 border-r border-black font-bold text-center w-14">SGST %</th>
                <th className="p-2 border-r border-black font-bold text-center w-14">CGST %</th>
                <th className="p-2 font-bold text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="align-top font-medium divide-y divide-black/10 bg-white text-black">
              {items.map((item, idx) => {
                const cgstPercent = invoice.totalIgst > 0 ? 0 : (item.gstRate / 2);
                const sgstPercent = invoice.totalIgst > 0 ? 0 : (item.gstRate / 2);
                return (
                  <tr key={idx} className="border-b border-black">
                    <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                    <td className="p-2 border-r border-black text-center">{item.hsnCode || '-'}</td>
                    <td className="p-2 border-r border-black">
                      <p className="font-extrabold">{item.productName}</p>
                      {item.productModel && <p className="text-[10px] text-gray-600 font-normal">Model: {item.productModel}</p>}
                      {item.serialNumber && <p className="text-[10px] text-gray-600 font-normal">S/N: {item.serialNumber}</p>}
                      {showProdDescInPrint && item.description && <p className="text-[10px] text-gray-500 mt-0.5 font-normal whitespace-pre-line leading-snug">{item.description}</p>}
                    </td>
                    <td className="p-2 border-r border-black text-center">{item.quantity}</td>
                    <td className="p-2 border-r border-black text-center">{item.unit || 'PCS'}</td>
                    <td className="p-2 border-r border-black text-right">{(item.rate).toFixed(2)}</td>
                    <td className="p-2 border-r border-black text-center">{cgstPercent > 0 ? `${cgstPercent}%` : '-'}</td>
                    <td className="p-2 border-r border-black text-center">{sgstPercent > 0 ? `${sgstPercent}%` : '-'}</td>
                    <td className="p-2 text-right">{(item.total).toFixed(2)}</td>
                  </tr>
                );
              })}
              {/* Filler row to fill page height cleanly */}
              <tr className="h-full bg-white">
                <td className="border-r border-black"></td>
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

        {/* --- AMOUNT IN WORDS (Spans full page width cleanly) --- */}
        <div className="border-t border-b border-black p-2 bg-white text-xs">
          <p className="font-medium"><span className="font-extrabold">Amount Chargeable (in words):</span> <span className="font-extrabold uppercase">{numToWords(Math.round(invoice.grandTotal))} Only</span></p>
        </div>

        {/* --- TOTALS, TAX BREAKDOWN & INFO SECTION --- */}
        <div className="flex border-b border-black divide-x divide-black">
          
          {/* Left Side: Tax Summary Table, Bank Details, Terms */}
          <div className="flex-1 flex flex-col justify-between divide-y divide-black bg-white text-black">
            
            {/* GST Tax Summary Table */}
            <div className="p-3">
              <div className="font-bold text-[10px] uppercase tracking-wider mb-1.5 underline">GST Tax Summary Breakdown:</div>
              <table className="w-full text-left text-[10px] border border-black border-collapse">
                <thead>
                  <tr className="border-b border-black bg-white font-bold text-center">
                    <th className="p-1 border-r border-black">GST %</th>
                    <th className="p-1 border-r border-black">Taxable Amount</th>
                    <th className="p-1 border-r border-black">CGST Amount</th>
                    <th className="p-1 border-r border-black">SGST Amount</th>
                    <th className="p-1">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-black">
                  {Object.keys(taxGroups).map(rateStr => {
                    const rate = parseFloat(rateStr);
                    const group = taxGroups[rate];
                    return (
                      <tr key={rateStr} className="border-b border-black last:border-b-0 text-center">
                        <td className="p-1 border-r border-black font-bold">{rate}%</td>
                        <td className="p-1 border-r border-black">{(group.taxable).toFixed(2)}</td>
                        <td className="p-1 border-r border-black">{(group.cgst).toFixed(2)}</td>
                        <td className="p-1 border-r border-black">{(group.sgst).toFixed(2)}</td>
                        <td className="p-1 font-bold">{(group.totalTax).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {Object.keys(taxGroups).length === 0 && (
                    <tr className="text-center bg-white">
                      <td colSpan={5} className="p-2 text-gray-500 font-medium">No tax groups found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bank Details Block */}
            <div className="p-3 flex flex-col space-y-1 text-[11px] bg-white text-black">
              {showBankInPrint && companySettings.bankName ? (
                <>
                  <div className="font-bold uppercase tracking-wider text-[10px] text-gray-800 underline">Bank Details for Payment:</div>
                  <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-0.5">
                    <span className="font-bold">Bank Name:</span> <span>{companySettings.bankName}</span>
                    <span className="font-bold">Account Name:</span> <span>{companySettings.companyName}</span>
                    <span className="font-bold">Account No:</span> <span>{companySettings.accountNumber}</span>
                    <span className="font-bold">IFSC Code:</span> <span className="font-mono font-bold">{companySettings.ifscCode}</span>
                    {companySettings.upiId && <><span className="font-bold">UPI ID:</span> <span className="font-bold text-gray-900">{companySettings.upiId}</span></>}
                  </div>
                </>
              ) : (
                <div className="text-gray-400 italic text-[10px]">Payment Settlement Method: Cash / UPI / Card / NetBanking</div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="p-3 text-[10px] leading-relaxed bg-white text-black">
              <div className="font-bold uppercase tracking-wider text-[10px] text-gray-800 mb-1 underline">Terms & Conditions:</div>
              <ol className="list-decimal pl-4 space-y-0.5 font-medium">
                <li>Goods once sold will not be taken back.</li>
                <li>Carrier assumes all liability for transit damages.</li>
                <li>Manufacturer warranty card covers all technical defects.</li>
                <li>Subject to local jurisdiction only.</li>
                <li>E.&O.E. (Errors and Omissions Excepted).</li>
              </ol>
            </div>
          </div>

          {/* Right Side: Grand Totals & Signature Block */}
          <div className="w-[260px] flex flex-col justify-between divide-y divide-black bg-white text-black">
            
            {/* Grand Totals */}
            <div className="flex flex-col text-xs bg-white text-black">
              <div className="flex border-b border-black">
                <div className="flex-1 p-1.5 border-r border-black font-medium pl-3">Sub Total</div>
                <div className="w-[100px] p-1.5 text-right pr-3">{(invoice.subtotal).toFixed(2)}</div>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex border-b border-black text-red-600">
                  <div className="flex-1 p-1.5 border-r border-black font-medium pl-3">Discount</div>
                  <div className="w-[100px] p-1.5 text-right pr-3">- {(invoice.totalDiscount).toFixed(2)}</div>
                </div>
              )}
              <div className="flex border-b border-black">
                <div className="flex-1 p-1.5 border-r border-black font-medium pl-3">Taxable Amount</div>
                <div className="w-[100px] p-1.5 text-right pr-3">{(invoice.subtotal - invoice.totalDiscount).toFixed(2)}</div>
              </div>
              {invoice.totalCgst > 0 && (
                <div className="flex border-b border-black">
                  <div className="flex-1 p-1.5 border-r border-black font-medium pl-3">CGST Amount</div>
                  <div className="w-[100px] p-1.5 text-right pr-3">{(invoice.totalCgst).toFixed(2)}</div>
                </div>
              )}
              {invoice.totalSgst > 0 && (
                <div className="flex border-b border-black">
                  <div className="flex-1 p-1.5 border-r border-black font-medium pl-3">SGST Amount</div>
                  <div className="w-[100px] p-1.5 text-right pr-3">{(invoice.totalSgst).toFixed(2)}</div>
                </div>
              )}
              {invoice.totalIgst > 0 && (
                <div className="flex border-b border-black">
                  <div className="flex-1 p-1.5 border-r border-black font-medium pl-3">IGST Amount</div>
                  <div className="w-[100px] p-1.5 text-right pr-3">{(invoice.totalIgst).toFixed(2)}</div>
                </div>
              )}
              <div className="flex border-b border-black">
                <div className="flex-1 p-1.5 border-r border-black font-medium pl-3">Round Off</div>
                <div className="w-[100px] p-1.5 text-right pr-3">{(invoice.grandTotal - (invoice.subtotal - invoice.totalDiscount + invoice.totalCgst + invoice.totalSgst + invoice.totalIgst)).toFixed(2)}</div>
              </div>
              <div className="flex bg-white font-black text-sm border-b border-black">
                <div className="flex-1 p-2 border-r border-black font-black pl-3 uppercase">Net Amount</div>
                <div className="w-[100px] p-2 text-right font-black pr-3">₹{Math.round(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex-grow p-4 flex flex-col justify-between items-center text-[10px] relative min-h-[160px] bg-white text-black">
              <div className="font-bold text-center uppercase tracking-wide">For {companySettings.companyName}</div>
              
              {/* Seal Visual Outline */}
              <div className="w-24 h-12 border border-dashed border-gray-400 rounded flex items-center justify-center text-center opacity-60 my-2 select-none">
                <span className="text-[8px] tracking-widest text-gray-500 uppercase font-bold font-mono">COMPANY SEAL</span>
              </div>

              <div className="w-full flex flex-col items-center">
                <div className="border-t border-black w-4/5 text-center pt-1 font-bold uppercase tracking-wider">
                  Authorized Signatory
                </div>
                <div className="text-[8px] text-gray-500 mt-0.5 font-bold">E.&O.E.</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
interface InvoicesViewProps {
  invoices: Invoice[];
  contacts: Contact[];
  products: Product[];
  companySettings: CompanySettings;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  activeTab: 'sale' | 'purchase';
}

interface CalculatedInclusiveItem {
  cgst: number;
  sgst: number;
  igst: number;
  taxableValue: number;
  grossTaxable: number;
  discountAmt: number;
  itemTotal: number;
}

export const calculateInclusiveGST = (
  rate: number,
  quantity: number,
  discountPercent: number,
  gstRate: number
): CalculatedInclusiveItem => {
  const grossInclusive = rate * quantity;
  const discountAmtInclusive = grossInclusive * (discountPercent / 100);
  const itemTotal = parseFloat((grossInclusive - discountAmtInclusive).toFixed(2));

  const taxableValue = parseFloat((itemTotal / (1 + gstRate / 100)).toFixed(2));
  const cgst = parseFloat((taxableValue * (gstRate / 2 / 100)).toFixed(2));
  const sgst = parseFloat((taxableValue * (gstRate / 2 / 100)).toFixed(2));
  const igst = 0;

  const finalTaxableValue = parseFloat((itemTotal - (cgst + sgst + igst)).toFixed(2));
  const grossTaxable = parseFloat((grossInclusive / (1 + gstRate / 100)).toFixed(2));
  const discountAmt = parseFloat((grossTaxable - finalTaxableValue).toFixed(2));

  return {
    cgst,
    sgst,
    igst,
    taxableValue: finalTaxableValue,
    grossTaxable,
    discountAmt,
    itemTotal
  };
};

export default function InvoicesView({ 
  invoices, 
  contacts, 
  products, 
  companySettings, 
  onSaveInvoice, 
  onDeleteInvoice,
  activeTab
}: InvoicesViewProps) {
  
  const { user } = useAuth();
  const [editorTab, setEditorTab] = useState<'details' | 'changelog'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [preFinalizeInvoice, setPreFinalizeInvoice] = useState<Invoice | null>(null);
  const [isPreviewDarkMode, setIsPreviewDarkMode] = useState(false);

  // --- INVOICE CUSTOM DESIGN & FORMAT STYLE STATES & PRESET THEMES ---
  const [invoiceStyle, setInvoiceStyle] = useState(() => {
    const defaultVal = {
      themeName: 'Commercial Green Corporate',
      fontFamily: 'Inter',
      primaryColor: '#356854',       // Dark Forest Green
      secondaryColor: '#A4C45A',     // Light Olive Green
      tableHeaderBg: '#356854',      // Table Header Green
      tableHeaderTextColor: '#ffffff', // White
      logoPosition: 'left',
      lineColor: 'green',
      lineStyle: 'solid',
      lineThickness: 'thin',
      textCase: 'normal',
      fontSizeMultiplier: '100%'
    };
    try {
      const saved = localStorage.getItem('vyapar_invoice_style_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const allowedThemes = [
          'Modern Premium Corporate',
          'Commercial Green Corporate',
          'Classic Theme Format Style',
          'AI-Generated Theme Format Style',
          'Mint Landscape Creations',
          'Gujarat Freight Tools Layout',
          'Classic Clear Minimalist'
        ];
        if (!allowedThemes.includes(parsed.themeName)) {
          return defaultVal;
        }
        return { ...defaultVal, ...parsed };
      }
    } catch (e) {
      console.warn("Could not load invoice style", e);
    }
    return defaultVal;
  });

  const [showStyleCustomizer, setShowStyleCustomizer] = useState(true);
  const [showQRGenerator, setShowQRGenerator] = useState(true);

  const updateStyleProp = (prop: string, value: string) => {
    const updated = { ...invoiceStyle, [prop]: value };
    setInvoiceStyle(updated);
    localStorage.setItem('vyapar_invoice_style_config', JSON.stringify(updated));
  };

  const getLineColor = () => {
    const lineColorMap: Record<string, string> = {
      theme: invoiceStyle.primaryColor || '#0f5146',
      slate: '#64748b',
      charcoal: '#334155',
      black: '#000000',
      silver: '#cbd5e1',
    };
    return lineColorMap[invoiceStyle.lineColor || 'theme'] || invoiceStyle.primaryColor || '#0f5146';
  };

  const getLineStyle = () => {
    const style = invoiceStyle.lineStyle || 'solid';
    return style === 'double' ? 'solid' : style;
  };

  const getLineThickness = () => {
    const thicknessMap: Record<string, string> = {
      thin: '1px',
      medium: '2px',
      bold: '3px',
    };
    return thicknessMap[invoiceStyle.lineThickness || 'thin'] || '1px';
  };

  const [showBankInPrint, setShowBankInPrint] = useState(() => {
    return localStorage.getItem('vyapar_show_bank_in_print') === 'true';
  });
  const [showProdDescInPrint, setShowProdDescInPrint] = useState(() => {
    return localStorage.getItem('vyapar_show_prod_desc_in_print') !== 'false';
  });
  const [customProductDesc, setCustomProductDesc] = useState(() => {
    return localStorage.getItem('vyapar_custom_prod_desc') || "Product Description & Details:\n• Primary Grade Industry Standard Supply items.\n• Certified GST Compliant components with reliable finish & warranty.";
  });

  const [showStylist, setShowStylist] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // States for WhatsApp Sharing & AI Autocomplete Billing Assist
  const [sharingOnWhatsApp, setSharingOnWhatsApp] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExpandingDesc, setIsExpandingDesc] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const presetThemes = [
    {
      themeName: "Commercial Green Corporate",
      fontFamily: "Inter",
      primaryColor: "#356854",       // Dark Forest Green
      secondaryColor: "#A4C45A",     // Light Olive Green
      tableHeaderBg: "#356854",      // Table Header Green
      tableHeaderTextColor: "#ffffff", // White text
      logoPosition: "left",
      lineColor: "theme",
      lineStyle: "solid",
      lineThickness: "thin",
      textCase: "normal",
      fontSizeMultiplier: "100%"
    },
    {
      themeName: "Modern Premium Corporate",
      fontFamily: "Inter",
      primaryColor: "#1e40af",       // Blue-800 / Corporate Blue
      secondaryColor: "#3b82f6",     // Blue-500
      tableHeaderBg: "#eff6ff",      // Light Blue / Blue-50
      tableHeaderTextColor: "#1e3a8a", // Dark Blue / Blue-900
      logoPosition: "left",
      lineColor: "blue",
      lineStyle: "solid",
      lineThickness: "thin",
      textCase: "normal",
      fontSizeMultiplier: "100%"
    },
    {
      themeName: "Classic Theme Format Style",
      fontFamily: "Inter",
      primaryColor: "#1e293b",       // Deep Slate-800 / Elegant Charcoal
      secondaryColor: "#475569",     // Slate-600
      tableHeaderBg: "#f1f5f9",      // Sleek Gray / Slate-100
      tableHeaderTextColor: "#0f172a", // Slate-900 (ultra readable)
      logoPosition: "left",
      lineColor: "slate",
      lineStyle: "solid",
      lineThickness: "thin",
      textCase: "uppercase",
      fontSizeMultiplier: "100%"
    },
    {
      themeName: "AI-Generated Theme Format Style",
      fontFamily: "Plus Jakarta Sans",
      primaryColor: "#6366f1",       // Modern AI Indigo
      secondaryColor: "#4f46e5",     // Deep Indigo
      tableHeaderBg: "#f5f3ff",      // Light Lavender
      tableHeaderTextColor: "#4338ca", // Rich Indigo
      logoPosition: "right",
      lineColor: "theme",
      lineStyle: "solid",
      lineThickness: "thin",
      textCase: "normal",
      fontSizeMultiplier: "100%"
    },
    {
      themeName: "Mint Landscape Creations",
      fontFamily: "Inter",
      primaryColor: "#0f766e",       // Teal 700 / Deep Mint
      secondaryColor: "#134e4a",     // Teal 900
      tableHeaderBg: "#f0fdf4",      // Light Mint Green
      tableHeaderTextColor: "#14532d", // Dark Green
      logoPosition: "left",
      lineColor: "emerald",
      lineStyle: "dashed",
      lineThickness: "thin",
      textCase: "normal",
      fontSizeMultiplier: "100%"
    },
    {
      themeName: "Gujarat Freight Tools Layout",
      fontFamily: "Inter",
      primaryColor: "#d97706",       // Amber 600 / Gold
      secondaryColor: "#78350f",     // Amber 900
      tableHeaderBg: "#fffbeb",      // Light Amber
      tableHeaderTextColor: "#92400e", // Amber 800
      logoPosition: "right",
      lineColor: "amber",
      lineStyle: "solid",
      lineThickness: "thick",
      textCase: "uppercase",
      fontSizeMultiplier: "100%"
    },
    {
      themeName: "Classic Clear Minimalist",
      fontFamily: "Inter",
      primaryColor: "#000000",
      secondaryColor: "#333333",
      tableHeaderBg: "#fafafa",
      tableHeaderTextColor: "#000000",
      logoPosition: "left",
      lineColor: "slate",
      lineStyle: "solid",
      lineThickness: "thin",
      textCase: "uppercase",
      fontSizeMultiplier: "100%"
    }
  ];

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setInvoiceStyle(preset);
    localStorage.setItem('vyapar_invoice_style_config', JSON.stringify(preset));
    setUploadSuccess(`Success! Swapped template design to "${preset.themeName}" format!`);
    setUploadError(null);
  };

  const downloadPresetJson = (preset: typeof presetThemes[0]) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(preset, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${preset.themeName.toLowerCase().replace(/\s+/g, '_')}_design.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processStyleFile = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(file.name);
    const isJson = file.type === "application/json" || file.name.endsWith('.json');

    if (!isJson && !isImage) {
      setUploadError("Invalid format! Please upload a layout config .json file or a brand theme image (.jpg, .png).");
      setUploadSuccess(null);
      return;
    }

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = 40;
              canvas.height = 40;
              ctx.drawImage(img, 0, 0, 40, 40);
              const imgData = ctx.getImageData(0, 0, 40, 40).data;
              
              let rSum = 0, gSum = 0, bSum = 0, count = 0;
              let colors: {r: number, g: number, b: number, score: number}[] = [];
              for (let i = 0; i < imgData.length; i += 16) {
                const r = imgData[i];
                const g = imgData[i+1];
                const b = imgData[i+2];
                const a = imgData[i+3];
                if (a > 200) {
                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  const diff = max - min;
                  if (diff > 12 && max < 240 && min > 15) {
                    rSum += r;
                    gSum += g;
                    bSum += b;
                    count++;
                    colors.push({ r, g, b, score: diff });
                  }
                }
              }

              let finalR = 249, finalG = 115, finalB = 22; // default orange
              let finalSR = 234, finalSG = 88, finalSB = 12; // default deep orange

              if (colors.length > 0) {
                colors.sort((a, b) => b.score - a.score);
                finalR = colors[0].r;
                finalG = colors[0].g;
                finalB = colors[0].b;
                if (colors.length > 5) {
                  finalSR = colors[Math.min(4, colors.length - 1)].r;
                  finalSG = colors[Math.min(4, colors.length - 1)].g;
                  finalSB = colors[Math.min(4, colors.length - 1)].b;
                } else {
                  finalSR = Math.max(0, finalR - 35);
                  finalSG = Math.max(0, finalG - 35);
                  finalSB = Math.max(0, finalB - 35);
                }
              } else if (count > 0) {
                finalR = Math.round(rSum / count);
                finalG = Math.round(gSum / count);
                finalB = Math.round(bSum / count);
                finalSR = Math.max(0, finalR - 30);
                finalSG = Math.max(0, finalG - 30);
                finalSB = Math.max(0, finalB - 30);
              }

              const toHex = (num: number) => {
                const hex = num.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
              };
              const primaryColor = `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;
              const secondaryColor = `#${toHex(finalSR)}${toHex(finalSG)}${toHex(finalSB)}`;
              
              const tableHeaderBg = `#${toHex(Math.min(255, finalR + 240))}${toHex(Math.min(255, finalG + 240))}${toHex(Math.min(255, finalB + 240))}`;
              const tableHeaderTextColor = secondaryColor;

              const cleanName = file.name.replace(/\.[^/.]+$/, "").substring(0, 15);
              const newStyle = {
                themeName: `${cleanName} Accent Theme`,
                fontFamily: 'Inter',
                primaryColor,
                secondaryColor,
                tableHeaderBg,
                tableHeaderTextColor,
                logoPosition: 'left'
              };

              setInvoiceStyle(newStyle);
              localStorage.setItem('vyapar_invoice_style_config', JSON.stringify(newStyle));
              setUploadSuccess(`Wow! Extracted colors from image "${file.name}" to generate a custom matching invoice theme!`);
              setUploadError(null);
            } else {
              setUploadError("Could not initialize color extractor on canvas context.");
              setUploadSuccess(null);
            }
          };
          img.onerror = () => {
            setUploadError("Error parsing uploaded image file for color extraction.");
            setUploadSuccess(null);
          };
          img.src = event.target?.result as string;
        } catch (e) {
          setUploadError("Could not parse image context correctly.");
          setUploadSuccess(null);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const config = JSON.parse(text);
        
        if (!config.primaryColor) {
          setUploadError("Invalid schema! Ensure file contains 'primaryColor', 'themeName', and 'fontFamily'.");
          setUploadSuccess(null);
          return;
        }

        const newStyle = {
          themeName: config.themeName || 'Custom Uploaded Design',
          fontFamily: config.fontFamily || 'Plus Jakarta Sans',
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor || config.primaryColor,
          tableHeaderBg: config.tableHeaderBg || '#f1f5f9',
          tableHeaderTextColor: config.tableHeaderTextColor || '#1e293b',
          logoPosition: config.logoPosition || 'left'
        };

        setInvoiceStyle(newStyle);
        localStorage.setItem('vyapar_invoice_style_config', JSON.stringify(newStyle));
        setUploadSuccess(`Excellent! Changed invoice template, style & format to "${newStyle.themeName}"!`);
        setUploadError(null);
      } catch (err) {
        setUploadError("Invalid JSON structure! Could not compile file configurations.");
        setUploadSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processStyleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processStyleFile(e.target.files[0]);
    }
  };
  
  // Invoice form state
  const [formInvoiceId, setFormInvoiceId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'sale' | 'purchase'>(activeTab);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('2026-06-11');
  const [dueDate, setDueDate] = useState('2026-06-25');
  const [stateOfSupply, setStateOfSupply] = useState('Haryana');
  const [gstMode, setGstMode] = useState<'local' | 'interstate'>('local');
  const [contactId, setContactId] = useState('');
  
  // Custom contact input (if not referencing a pre-saved list item)
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactGstin, setContactGstin] = useState('');
  
  // Line items state
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [notes, setNotes] = useState('');

  // Customizable sales line details
  const [lineItemName, setLineItemName] = useState('');
  const [lineItemModel, setLineItemModel] = useState('');
  const [lineItemSerial, setLineItemSerial] = useState('');
  const [lineItemDesc, setLineItemDesc] = useState('');
  const [lineItemQty, setLineItemQty] = useState<number>(1);
  const [lineItemPcs, setLineItemPcs] = useState<number>(1);
  const [lineItemUnit, setLineItemUnit] = useState('PCS');
  const [lineItemUnitPrice, setLineItemUnitPrice] = useState<number>(0);
  const [lineItemGstRate, setLineItemGstRate] = useState<number>(18);
  const [lineItemDiscount, setLineItemDiscount] = useState<number>(0);

  // Handle product dropdown change to pre-fill row entry fields
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    if (!productId) {
      setLineItemName('');
      setLineItemModel('');
      setLineItemSerial('');
      setLineItemDesc('');
      setLineItemQty(1);
      setLineItemPcs(1);
      setLineItemUnit('PCS');
      setLineItemUnitPrice(0);
      setLineItemGstRate(18);
      setLineItemDiscount(0);
      return;
    }
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setLineItemName(prod.name);
      setLineItemModel(prod.category || ''); 
      setLineItemSerial('');
      setLineItemDesc('');
      setLineItemQty(1);
      setLineItemPcs(1);
      setLineItemUnit(prod.unit || 'PCS');
      setLineItemUnitPrice(formType === 'sale' ? prod.salesRate : prod.purchaseRate);
      setLineItemGstRate(prod.gstRate);
      setLineItemDiscount(0);
    }
  };

  // Update form type when external tab selection changes
  useEffect(() => {
    setFormType(activeTab);
  }, [activeTab]);

  // Handle contact drop-down change to auto-fill details
  const handleContactChange = (id: string) => {
    setContactId(id);
    if (id === 'custom') {
      setContactName('');
      setContactMobile('');
      setContactAddress('');
      setContactGstin('');
    } else {
      const match = contacts.find(c => c.id === id);
      if (match) {
        setContactName(match.name);
        setContactMobile(match.mobile);
        setContactAddress(match.address);
        setContactGstin(match.gstin || '');
        
        // Auto-detect StateOfSupply based on address string
        if (match.address.toLowerCase().includes('delhi')) {
          setStateOfSupply('Delhi');
        } else if (match.address.toLowerCase().includes('haryana')) {
          setStateOfSupply('Haryana');
        } else if (match.gstin) {
          // first two digit state codes
          if (match.gstin.startsWith('06')) setStateOfSupply('Haryana');
          else if (match.gstin.startsWith('07')) setStateOfSupply('Delhi');
        }
      }
    }
  };

  // Generate automated invoice numbers
  const generateInvoiceNumber = () => {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = formType === 'sale' ? 'INV-2026-' : 'BILL-2026-';
    setInvoiceNumber(prefix + suffix);
  };

  // Clear form
  const initNewInvoice = () => {
    setEditorTab('details');
    setFormInvoiceId(null);
    setFormType(activeTab);
    setDate('2026-06-11');
    setDueDate('2026-06-26');
    setContactId('');
    setContactName('');
    setContactMobile('');
    setContactAddress('');
    setContactGstin('');
    setLineItems([]);
    setNotes('');
    setStateOfSupply('Haryana');
    setGstMode('local');
    setSelectedProductId('');
    setLineItemName('');
    setLineItemModel('');
    setLineItemSerial('');
    setLineItemDesc('');
    setLineItemQty(1);
    setLineItemPcs(1);
    setLineItemUnit('PCS');
    setLineItemUnitPrice(0);
    setLineItemGstRate(18);
    setLineItemDiscount(0);
    
    // Auto invoice number
    const suffix = Math.floor(100 + Math.random() * 900);
    const prefix = activeTab === 'sale' ? 'INV-2026-' : 'BILL-2026-';
    setInvoiceNumber(prefix + suffix);
    setIsEditing(true);
  };

  // Edit action
  const handleEditInit = (inv: Invoice) => {
    setEditorTab('details');
    setFormInvoiceId(inv.id);
    setFormType(inv.type);
    setInvoiceNumber(inv.invoiceNumber);
    setDate(inv.date);
    setDueDate(inv.dueDate);
    
    // Check if matching contact ID
    const contactMatch = contacts.find(c => c.name === inv.contactName);
    setContactId(contactMatch ? contactMatch.id : 'custom');
    
    setContactName(inv.contactName);
    setContactMobile(inv.contactMobile);
    setContactAddress(inv.contactAddress);
    setContactGstin(inv.contactGstin || '');
    setLineItems(inv.items);
    setNotes(inv.notes || '');
    setStateOfSupply(inv.stateOfSupply);
    
    const hasCgst = inv.totalCgst > 0 || (inv.items && inv.items.some(item => item.cgst > 0));
    setGstMode(hasCgst ? 'local' : 'interstate');
    setIsEditing(true);
  };

  // Adjust existing items tax to always be local (CGST+SGST)
  const handleTaxModeChange = (mode: 'local' | 'interstate') => {
    setGstMode('local');
    const updated = lineItems.map((item) => {
      const { cgst, sgst, igst, itemTotal } = calculateInclusiveGST(
        item.rate,
        item.quantity,
        item.discount,
        item.gstRate
      );
      return {
        ...item,
        cgst,
        sgst,
        igst,
        total: itemTotal
      };
    });
    setLineItems(updated);
  };

  // Add Item to active Invoice Form
  const addLineItem = () => {
    if (!lineItemName.trim()) {
      alert('Please select a product or enter a valid Product Name.');
      return;
    }
    if (lineItemQty <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    // Check if item already exists with matching name & serial to edit-in-place
    const existingIndex = lineItems.findIndex(
      i => i.productName.toLowerCase() === lineItemName.toLowerCase() && i.serialNumber === lineItemSerial
    );

    // Calculate using including GST calculation
    const { cgst, sgst, igst, itemTotal } = calculateInclusiveGST(
      lineItemUnitPrice,
      lineItemQty,
      lineItemDiscount,
      lineItemGstRate
    );

    const newItem: InvoiceItem = {
      productId: selectedProductId || `custom-prod-${Date.now()}`,
      productName: lineItemName,
      productModel: lineItemModel || undefined,
      serialNumber: lineItemSerial || undefined,
      description: lineItemDesc || undefined,
      hsnCode: selectedProductId ? (products.find(p => p.id === selectedProductId)?.hsnCode || '8539') : '8539',
      quantity: lineItemQty,
      rate: lineItemUnitPrice,
      discount: lineItemDiscount,
      gstRate: lineItemGstRate,
      cgst,
      sgst,
      igst,
      total: itemTotal,
      pcs: lineItemPcs,
      unit: lineItemUnit
    };

    if (existingIndex > -1) {
      const copy = [...lineItems];
      copy[existingIndex] = newItem;
      setLineItems(copy);
    } else {
      setLineItems([...lineItems, newItem]);
    }

    // Reset temporary states
    setSelectedProductId('');
    setLineItemName('');
    setLineItemModel('');
    setLineItemSerial('');
    setLineItemDesc('');
    setLineItemQty(1);
    setLineItemPcs(1);
    setLineItemUnit('PCS');
    setLineItemUnitPrice(0);
    setLineItemGstRate(18);
    setLineItemDiscount(0);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    const copy = [...lineItems];
    copy.splice(index, 1);
    setLineItems(copy);
  };

  // Calculate overall totals using including GST calculation
  const itemCalcs = lineItems.map(item => calculateInclusiveGST(item.rate, item.quantity, item.discount, item.gstRate));
  const subtotalSum = itemCalcs.reduce((sum, c) => sum + c.grossTaxable, 0);
  const discountSum = itemCalcs.reduce((sum, c) => sum + c.discountAmt, 0);
  const cgstSum = itemCalcs.reduce((sum, c) => sum + c.cgst, 0);
  const sgstSum = itemCalcs.reduce((sum, c) => sum + c.sgst, 0);
  const igstSum = itemCalcs.reduce((sum, c) => sum + c.igst, 0);
  const grandTotalResult = itemCalcs.reduce((sum, c) => sum + c.itemTotal, 0);

  // Save the full invoice
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      alert('Please fill in Customer/Supplier name.');
      return;
    }

    let finalItems = [...lineItems];

    // Auto-commit active input line if filled but not added
    if (lineItemName.trim()) {
      const { cgst, sgst, igst, itemTotal } = calculateInclusiveGST(
        lineItemUnitPrice,
        lineItemQty,
        lineItemDiscount,
        lineItemGstRate
      );

      const newItem: InvoiceItem = {
        productId: selectedProductId || `custom-prod-${Date.now()}`,
        productName: lineItemName,
        productModel: lineItemModel || undefined,
        serialNumber: lineItemSerial || undefined,
        description: lineItemDesc || undefined,
        hsnCode: selectedProductId ? (products.find(p => p.id === selectedProductId)?.hsnCode || '8539') : '8539',
        quantity: lineItemQty,
        rate: lineItemUnitPrice,
        discount: lineItemDiscount,
        gstRate: lineItemGstRate,
        cgst,
        sgst,
        igst,
        total: itemTotal,
        pcs: lineItemPcs,
        unit: lineItemUnit
      };

      const existingIndex = finalItems.findIndex(
        i => i.productName.toLowerCase() === lineItemName.toLowerCase() && i.serialNumber === lineItemSerial
      );

      if (existingIndex > -1) {
        finalItems[existingIndex] = newItem;
      } else {
        finalItems.push(newItem);
      }
    }

    if (finalItems.length === 0) {
      alert('Please add at least one item to generated list.');
      return;
    }

    // Recalculate and update each item's tax values using including GST calculation
    finalItems = finalItems.map(item => {
      const { cgst, sgst, igst, itemTotal } = calculateInclusiveGST(
        item.rate,
        item.quantity,
        item.discount,
        item.gstRate
      );
      return {
        ...item,
        cgst,
        sgst,
        igst,
        total: itemTotal
      };
    });

    const finalCalcs = finalItems.map(item => calculateInclusiveGST(item.rate, item.quantity, item.discount, item.gstRate));
    const finalSubtotalSum = finalCalcs.reduce((sum, c) => sum + c.grossTaxable, 0);
    const finalDiscountSum = finalCalcs.reduce((sum, c) => sum + c.discountAmt, 0);
    const finalCgstSum = finalCalcs.reduce((sum, c) => sum + c.cgst, 0);
    const finalSgstSum = finalCalcs.reduce((sum, c) => sum + c.sgst, 0);
    const finalIgstSum = finalCalcs.reduce((sum, c) => sum + c.igst, 0);
    const finalGrandTotal = finalCalcs.reduce((sum, c) => sum + c.itemTotal, 0);

    const savedInvoice: Invoice = {
      id: formInvoiceId || `inv-sys-${Math.floor(1000 + Math.random()*9000)}`,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      date,
      dueDate,
      contactId: (!contactId || contactId === 'custom') ? `custom-${Date.now()}` : contactId,
      contactName,
      contactMobile,
      contactAddress,
      contactGstin: contactGstin || undefined,
      type: formType,
      items: finalItems,
      subtotal: parseFloat(finalSubtotalSum.toFixed(2)),
      totalDiscount: parseFloat(finalDiscountSum.toFixed(2)),
      totalCgst: parseFloat(finalCgstSum.toFixed(2)),
      totalSgst: parseFloat(finalSgstSum.toFixed(2)),
      totalIgst: parseFloat(finalIgstSum.toFixed(2)),
      grandTotal: finalGrandTotal,
      paidAmount: finalGrandTotal, // default fully paid for easy simulation, editable or settled
      balanceDue: 0,
      paymentStatus: 'paid',
      notes,
      stateOfSupply
    };

    // Calculate/append change log
    const userEmail = user?.email || 'offline-operator@vyapar.in';
    const userName = user?.displayName || 'Offline Operator';
    const existingInvoice = invoices.find(inv => inv.id === savedInvoice.id);
    const existingChangeLog = existingInvoice?.changeLog || [];

    let action: 'created' | 'modified' = 'created';
    let details = `Created invoice ${savedInvoice.invoiceNumber} with Grand Total ₹${savedInvoice.grandTotal.toLocaleString('en-IN')}`;

    if (formInvoiceId && existingInvoice) {
      action = 'modified';
      const changeDetailsList: string[] = [];
      if (existingInvoice.grandTotal !== savedInvoice.grandTotal) {
        changeDetailsList.push(`Grand Total changed from ₹${existingInvoice.grandTotal.toLocaleString('en-IN')} to ₹${savedInvoice.grandTotal.toLocaleString('en-IN')}`);
      }
      if (existingInvoice.contactName !== savedInvoice.contactName) {
        changeDetailsList.push(`Party changed from "${existingInvoice.contactName}" to "${savedInvoice.contactName}"`);
      }
      if (existingInvoice.items.length !== savedInvoice.items.length) {
        changeDetailsList.push(`Items count changed from ${existingInvoice.items.length} to ${savedInvoice.items.length}`);
      }
      if (existingInvoice.invoiceNumber !== savedInvoice.invoiceNumber) {
        changeDetailsList.push(`Invoice Number changed from "${existingInvoice.invoiceNumber}" to "${savedInvoice.invoiceNumber}"`);
      }
      if (existingInvoice.notes !== savedInvoice.notes) {
        changeDetailsList.push(`Notes changed`);
      }
      details = changeDetailsList.length > 0 
        ? `Modified: ${changeDetailsList.join(', ')}` 
        : `Re-saved invoice with no major changes`;
    }

    const newLogEntry: InvoiceChangeLogEntry = {
      id: `log-${Date.now()}-${Math.floor(100 + Math.random()*900)}`,
      timestamp: Date.now(),
      userEmail,
      userName,
      action,
      details
    };

    savedInvoice.changeLog = [...existingChangeLog, newLogEntry];

    setPreFinalizeInvoice(savedInvoice);
  };

  const commitPreFinalizeSave = () => {
    if (!preFinalizeInvoice) return;
    onSaveInvoice(preFinalizeInvoice);
    setIsEditing(false);
    setPreFinalizeInvoice(null);

    // Reset temporary states
    setSelectedProductId('');
    setLineItemName('');
    setLineItemModel('');
    setLineItemSerial('');
    setLineItemDesc('');
    setLineItemQty(1);
    setLineItemPcs(1);
    setLineItemUnit('PCS');
    setLineItemUnitPrice(0);
    setLineItemGstRate(18);
    setLineItemDiscount(0);
  };

  // Filter invoices based on Search input & type
  const filteredInvoices = invoices.filter(inv => {
    if (inv.type !== activeTab) return false;
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.contactMobile.includes(searchTerm);
    return matchesSearch;
  });

  const shareInvoiceOnWhatsApp = async (inv: Invoice) => {
    setSharingOnWhatsApp(true);
    let wasDark = isPreviewDarkMode;
    try {
      if (wasDark) {
        setIsPreviewDarkMode(false);
        // wait for dark mode style changes to apply
        await new Promise(r => setTimeout(r, 200));
      }

      let printArea = document.getElementById('print-area') || document.getElementById('print-area-preview');
      if (!printArea) {
        setViewingInvoice(inv);
        await new Promise(r => setTimeout(r, 250));
        printArea = document.getElementById('print-area') || document.getElementById('print-area-preview');
        if (!printArea) {
          throw new Error("Could not find the print area component.");
        }
      }

      const originalShadow = printArea.style.boxShadow;
      const originalRadius = printArea.style.borderRadius;
      const originalTransform = printArea.style.transform;
      
      printArea.style.boxShadow = 'none';
      printArea.style.borderRadius = '0';
      printArea.style.transform = 'none';

      const imgData = await htmlToImage.toJpeg(printArea, {
        quality: 1.0,
        pixelRatio: 2
      });
      
      printArea.style.boxShadow = originalShadow;
      printArea.style.borderRadius = originalRadius;
      printArea.style.transform = originalTransform;

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const JsPDFClass = getJsPdfInstance();
      let doc: any;
      try {
        doc = new JsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      } catch (err) {
        doc = new JsPDFClass('p', 'mm', 'a4');
      }

      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfPageHeight = doc.internal.pageSize.getHeight();
      const imgHeightInPdfUnits = (img.height * pdfWidth) / img.width;

      if (imgHeightInPdfUnits <= pdfPageHeight + 2) {
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightInPdfUnits);
      } else {
        let heightLeft = imgHeightInPdfUnits;
        let position = 0;
        let page = 0;

        while (heightLeft > 0) {
          if (page > 0) {
            doc.addPage();
          }
          doc.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdfUnits);
          heightLeft -= pdfPageHeight;
          position -= pdfPageHeight;
          page++;
        }
      }

      const pdfBlob = doc.output('blob');
      const filename = `Invoice_${inv.invoiceNumber}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Invoice ${inv.invoiceNumber}`,
            text: `Please find attached Invoice ${inv.invoiceNumber} from ${companySettings.companyName}.`
          });
          alert(`Success! Native share sheet opened. Select WhatsApp to share the PDF.`);
        } catch (shareErr: any) {
          console.log('Share prompt cancelled or failed:', shareErr);
          if (shareErr.name !== 'AbortError') {
            throw shareErr;
          }
        }
      } else {
        // Fallback: download the file and open WhatsApp Web/App
        doc.save(filename);
        const text = `Greetings from ${companySettings.companyName}! Your invoice *${inv.invoiceNumber}* for *₹${inv.grandTotal.toLocaleString('en-IN')}* has been generated. Due date: ${inv.dueDate}. We have downloaded your high-quality A4 PDF Invoice to this device. Please find it and send it to me.`;
        const whatsappUrl = `https://wa.me/91${inv.contactMobile.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
        alert(`Direct document sharing is not fully supported in this browser. We have successfully downloaded "${filename}" to your device and opened WhatsApp. Please select the contact and attach the downloaded PDF file.`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error generating or sharing WhatsApp PDF: ${e?.message || e}. Please try downloading the PDF instead.`);
    } finally {
      setSharingOnWhatsApp(false);
      if (wasDark) {
        setIsPreviewDarkMode(true);
      }
    }
  };

  const handleParseInvoiceWithAi = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please type an invoice prompt first (e.g. 'Make a sale bill for Royal Motors...')");
      return;
    }
    setIsParsingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse-invoice', prompt: aiPrompt })
      });
      const data = await response.json();
      if (data.text) {
        const parsed = JSON.parse(data.text);
        
        if (parsed.customerName) setContactName(parsed.customerName);
        if (parsed.mobile) setContactMobile(parsed.mobile);
        
        if (parsed.items && parsed.items.length > 0) {
          const mappedItems: InvoiceItem[] = parsed.items.map((it: any, index: number) => {
            const existingProd = products.find(p => p.name.toLowerCase().includes(it.productName.toLowerCase()) || it.productName.toLowerCase().includes(p.name.toLowerCase()));
            const prodId = existingProd ? existingProd.id : `prod-temp-${Date.now()}-${index}`;
            const gstRate = existingProd ? existingProd.gstRate : 18;
            
            const rate = it.rate || 120;
            const qty = it.quantity || 1;
            const taxableValue = rate * qty;
            const totalGst = (taxableValue * gstRate) / 100;
            const cgst = totalGst / 2;
            const sgst = totalGst / 2;
            const total = taxableValue + totalGst;

            return {
              productId: prodId,
              productName: it.productName,
              quantity: qty,
              unit: 'PCS',
              unitPrice: rate,
              gstRate: gstRate,
              cgstAmount: cgst,
              sgstAmount: sgst,
              taxableValue: taxableValue,
              discount: 0,
              totalAmount: total,
              description: it.description || ''
            };
          });
          setLineItems(mappedItems);
          setUploadSuccess(`Wow! AI successfully parsed details and added ${mappedItems.length} items to your invoice!`);
          setAiPrompt('');
        } else {
          setUploadSuccess("AI successfully parsed client name but didn't detect specific billing items. Please declare quantities & rates clearly!");
        }
      } else {
        setAiError(data.error || "AI was unable to structure this prompt.");
      }
    } catch (err: any) {
      setAiError(`AI Autocomplete Error: ${err.message}`);
    } finally {
      setIsParsingAi(false);
    }
  };

  const handleExpandDescriptionWithAi = async () => {
    let seed = lineItemDesc.trim();
    if (!seed && selectedProductId) {
      const selectedProd = products.find(p => p.id === selectedProductId);
      if (selectedProd) seed = selectedProd.name;
    }
    if (!seed) {
      alert("Please select a product or type its name in the specification box first!");
      return;
    }
    setIsExpandingDesc(true);
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'expand-description', prompt: seed })
      });
      const data = await response.json();
      if (data.text) {
        setLineItemDesc(data.text);
      } else {
        alert("Could not expand specifications. Check API key configurations.");
      }
    } catch (err: any) {
      alert(`AI Expander Connection Error: ${err.message}`);
    } finally {
      setIsExpandingDesc(false);
    }
  };

  const getWhatsAppShareLink = (inv: Invoice) => {
    const text = `Greetings from ${companySettings.companyName}! Your invoice *${inv.invoiceNumber}* for *₹${inv.grandTotal.toLocaleString('en-IN')}* has been generated. Due date: ${inv.dueDate}. Please find your copy.`;
    return `https://wa.me/91${inv.contactMobile}?text=${encodeURIComponent(text)}`;
  };

  const getEmailShareLink = (inv: Invoice) => {
    const subject = `Invoice ${inv.invoiceNumber} from ${companySettings.companyName}`;
    const body = `Hi ${inv.contactName},\n\nPlease find details for your recent order:\nInvoice No: ${inv.invoiceNumber}\nDate: ${inv.date}\nTotal Amount: RS.${inv.grandTotal}\n\nBank Transfer Info:\nBank: ${companySettings.bankName}\nAccount No: ${companySettings.accountNumber}\nIFSC Code: ${companySettings.ifscCode}\n\nThank you,\n${companySettings.companyName}`;
    return `mailto:${inv.contactMobile}@test.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const safeStrForPdf = (str: string) => {
    if (!str) return '';
    return str.replace(/₹/g, 'Rs.').replace(/[^\x00-\x7F]/g, '');
  };

  const formatRupeeForPdf = (value: number) => {
    return 'Rs. ' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(value);
  };

  const getJsPdfInstance = (): any => {
    if (typeof jsPDF === 'function') {
      return jsPDF;
    }
    if (jsPDF && typeof (jsPDF as any).default === 'function') {
      return (jsPDF as any).default;
    }
    const defaultExport = (jsPDF as any);
    if (typeof defaultExport === 'function') {
      return defaultExport;
    }
    const globalJsPDF = (window as any).jsPDF || (window as any).jspdf?.jsPDF;
    if (typeof globalJsPDF === 'function') {
      return globalJsPDF;
    }
    throw new Error("Unable to resolve standard jsPDF class constructor.");
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [249, 115, 22]; // fallback to orange
  };

  const printSnapshotPdf = async (inv: Invoice) => {
    setIsPrinting(true);
    let wasDark = isPreviewDarkMode;
    try {
      if (wasDark) {
        setIsPreviewDarkMode(false);
        await new Promise(r => setTimeout(r, 150));
      }

      let printArea = document.getElementById('print-area') || document.getElementById('print-area-preview');
      if (!printArea) {
        setViewingInvoice(inv);
        await new Promise(r => setTimeout(r, 200));
        printArea = document.getElementById('print-area') || document.getElementById('print-area-preview');
        if (!printArea) {
          throw new Error("Could not find the print area component.");
        }
      }

      const originalShadow = printArea.style.boxShadow;
      const originalRadius = printArea.style.borderRadius;
      const originalTransform = printArea.style.transform;
      
      printArea.style.boxShadow = 'none';
      printArea.style.borderRadius = '0';
      printArea.style.transform = 'none';

      // Capture full resolution image
      const imgData = await htmlToImage.toJpeg(printArea, {
        quality: 1.0,
        pixelRatio: 2
      });
      
      printArea.style.boxShadow = originalShadow;
      printArea.style.borderRadius = originalRadius;
      printArea.style.transform = originalTransform;

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const JsPDFClass = getJsPdfInstance();
      let doc: any;
      try {
        doc = new JsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      } catch (err) {
        doc = new JsPDFClass('p', 'mm', 'a4');
      }

      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfPageHeight = doc.internal.pageSize.getHeight();
      const imgHeightInPdfUnits = (img.height * pdfWidth) / img.width;

      if (imgHeightInPdfUnits <= pdfPageHeight + 2) {
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightInPdfUnits);
      } else {
        let heightLeft = imgHeightInPdfUnits;
        let position = 0;
        let page = 0;

        while (heightLeft > 0) {
          if (page > 0) {
            doc.addPage();
          }
          doc.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdfUnits);
          heightLeft -= pdfPageHeight;
          position -= pdfPageHeight;
          page++;
        }
      }
      
      const blobURL = doc.output('bloburl');

      // Create a hidden iframe for direct printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobURL;
      
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.error('Direct print via iframe failed, using fallback:', err);
            window.open(blobURL, '_blank');
          }
          // Cleanup iframe later
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 30000);
        }, 300);
      };

    } catch (e: any) {
      console.error(e);
      alert(`Error compiling HD Print: ${e?.message || e}`);
    } finally {
      setIsPrinting(false);
      if (wasDark) {
        setIsPreviewDarkMode(true);
      }
    }
  };

  const generateSnapshotPdf = async (inv: Invoice) => {
    let wasDark = isPreviewDarkMode;
    try {
      if (wasDark) {
        setIsPreviewDarkMode(false);
        await new Promise(r => setTimeout(r, 150));
      }

      let printArea = document.getElementById('print-area') || document.getElementById('print-area-preview');
      if (!printArea) {
        setViewingInvoice(inv);
        await new Promise(r => setTimeout(r, 200));
        printArea = document.getElementById('print-area') || document.getElementById('print-area-preview');
        if (!printArea) {
          throw new Error("Could not find the print area component.");
        }
      }

      const originalShadow = printArea.style.boxShadow;
      const originalRadius = printArea.style.borderRadius;
      const originalTransform = printArea.style.transform;
      
      printArea.style.boxShadow = 'none';
      printArea.style.borderRadius = '0';
      printArea.style.transform = 'none';

      const imgData = await htmlToImage.toJpeg(printArea, {
        quality: 1.0,
        pixelRatio: 2
      });
      
      printArea.style.boxShadow = originalShadow;
      printArea.style.borderRadius = originalRadius;
      printArea.style.transform = originalTransform;

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const JsPDFClass = getJsPdfInstance();
      let doc: any;
      try {
        doc = new JsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      } catch (err) {
        doc = new JsPDFClass('p', 'mm', 'a4');
      }

      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfPageHeight = doc.internal.pageSize.getHeight();
      const imgHeightInPdfUnits = (img.height * pdfWidth) / img.width;

      if (imgHeightInPdfUnits <= pdfPageHeight + 2) {
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightInPdfUnits);
      } else {
        let heightLeft = imgHeightInPdfUnits;
        let position = 0;
        let page = 0;

        while (heightLeft > 0) {
          if (page > 0) {
            doc.addPage();
          }
          doc.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdfUnits);
          heightLeft -= pdfPageHeight;
          position -= pdfPageHeight;
          page++;
        }
      }
      
      const formattedDate = new Date().toISOString().split('T')[0];
      doc.save(`${inv.invoiceNumber}_${formattedDate}.pdf`);
    } catch (e: any) {
      console.error(e);
      alert(`Error compiling PDF Invoice: ${e?.message || e}`);
    } finally {
      if (wasDark) {
        setIsPreviewDarkMode(true);
      }
    }
  };

  const downloadInvoicePdf = (inv: Invoice) => {
    try {
      const JsPDFClass = getJsPdfInstance();
      let doc: any;
      try {
        doc = new JsPDFClass({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
      } catch (err) {
        doc = new JsPDFClass('p', 'mm', 'a4');
      }

      const pageWidth = 210;
      const pageHeight = 297;
      let y = 15;

      // Function to add header and footer on each page
      const addInvoiceHeaderAndFooter = (pageNum: number) => {
        // Logo Accent Block matching screen style
        const pRgb = hexToRgb(invoiceStyle.primaryColor || '#f97316');
        doc.setFillColor(pRgb[0], pRgb[1], pRgb[2]);
        doc.rect(15, 12, 10, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("RE", 20, 18.5, { align: 'center' });

        // Seller details shifted X to 28
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(safeStrForPdf(companySettings.companyName), 28, 17);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const sRgb = hexToRgb(invoiceStyle.secondaryColor || '#ea580c');
        doc.setTextColor(sRgb[0], sRgb[1], sRgb[2]);
        doc.text(safeStrForPdf(companySettings.tagline), 28, 21);

        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(safeStrForPdf(`Address: ${companySettings.address}`), 28, 25);
        doc.text(`Contact: ${companySettings.phone} | Email: ${companySettings.email}`, 28, 29);
        
        if (companySettings.gstin) {
          doc.setFont('helvetica', 'bold');
          const pRgbGst = hexToRgb(invoiceStyle.primaryColor || '#f97316');
          doc.setTextColor(pRgbGst[0], pRgbGst[1], pRgbGst[2]);
          doc.text(`GSTIN: ${companySettings.gstin}`, 28, 33);
        }

        // Top Right: Document Title & Metadata
        const docTitle = inv.type === 'sale' ? "TAX INVOICE" : "PURCHASE RECORD";
        doc.setFillColor(pRgb[0], pRgb[1], pRgb[2]);
        doc.rect(145, 12, 50, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text(docTitle, 170, 16.5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(`Invoice No: ${inv.invoiceNumber}`, 195, 23, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Date of Issue: ${inv.date}`, 195, 27, { align: 'right' });
        doc.text(`Due Date: ${inv.dueDate}`, 195, 31, { align: 'right' });
        doc.text(`State of Supply: ${safeStrForPdf(inv.stateOfSupply)}`, 195, 35, { align: 'right' });

        // Divider Line matching primary accent color exactly
        doc.setDrawColor(pRgb[0], pRgb[1], pRgb[2]);
        doc.setLineWidth(0.6);
        doc.line(15, 38, 195, 38);

        // Footer block
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Powered by Rudra Enterprises | Generated on ${new Date().toLocaleDateString()}`, 15, 285);
        doc.text(`Page ${pageNum}`, 195, 285, { align: 'right' });
        doc.text("* This is a computer generated tax invoice and does not require a physical signature.", 15, 289);
      };

      // Set first page header
      addInvoiceHeaderAndFooter(1);
      y = 44;

      // Party details block (Billed To vs. Supplier Profile)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const partyHeader = inv.type === 'sale' ? "BILLED TO (BUYER):" : "PROCURING FROM (SUPPLIER):";
      doc.text(partyHeader, 15, y);

      // Party card background
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, y + 2, 180, 24, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(15, y + 2, 180, 24, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(safeStrForPdf(inv.contactName), 20, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      
      doc.text(`Mobile Connection: ${inv.contactMobile}`, 20, y + 13);
      doc.text(`Billing Location: ${safeStrForPdf(inv.contactAddress)}`, 20, y + 17);
      
      if (inv.contactGstin) {
        doc.setFont('helvetica', 'bold');
        const pRgb = hexToRgb(invoiceStyle.primaryColor || '#f97316');
        doc.setTextColor(pRgb[0], pRgb[1], pRgb[2]);
        doc.text(`GSTIN of Party: ${inv.contactGstin}`, 120, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
      }

      doc.text(`Status of Bill: ${inv.paymentStatus.toUpperCase()}`, 120, y + 15);

      y += 32;

      // Draw Items Table Header
      const drawTableHeader = (posY: number) => {
        const hBg = hexToRgb(invoiceStyle.tableHeaderBg || '#fff7ed');
        doc.setFillColor(hBg[0], hBg[1], hBg[2]);
        doc.rect(15, posY, 180, 7.5, 'F');

        // Border highlighting same as standard invoice stylesheet
        const pRgb = hexToRgb(invoiceStyle.primaryColor || '#f97316');
        doc.setDrawColor(pRgb[0], pRgb[1], pRgb[2]);
        doc.setLineWidth(0.3);
        doc.line(15, posY, 195, posY);
        doc.line(15, posY + 7.5, 195, posY + 7.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        const hText = hexToRgb(invoiceStyle.tableHeaderTextColor || '#ea580c');
        doc.setTextColor(hText[0], hText[1], hText[2]);
        doc.text("S.NO", 17, posY + 5);
        doc.text("ITEM", 25, posY + 5);
        doc.text("MODEL", 82, posY + 5, { align: 'center' });
        doc.text("SL NO", 102, posY + 5, { align: 'center' });
        doc.text("QUANTITY", 124, posY + 5, { align: 'right' });
        doc.text("PRODUCT RATE", 148, posY + 5, { align: 'right' });
        doc.text("GST RATE", 163, posY + 5, { align: 'right' });
        doc.text("AMOUNT", 193, posY + 5, { align: 'right' });
      };

      drawTableHeader(y);
      y += 7;

      let pageNum = 1;

      // Draw Items rows
      inv.items.forEach((item, index) => {
        const hasDesc = !!item.description;
        const rowHeight = hasDesc ? 10.5 : 6.5;

        // If getting safety margin too small
        if (y + rowHeight > 258) {
          doc.addPage();
          pageNum++;
          addInvoiceHeaderAndFooter(pageNum);
          y = 44;
          drawTableHeader(y);
          y += 7;
        }

        // Row backgrounds alternate
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252); // slate-50
          doc.rect(15, y, 180, rowHeight, 'F');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(15, y, 180, rowHeight, 'F');
        }

        // Draw line divider separator
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.setLineWidth(0.25);
        doc.line(15, y + rowHeight, 195, y + rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        
        // Serial No
        doc.text(String(index + 1), 17, y + 4.2);

        // Name
        const nameStr = safeStrForPdf(item.productName);
        const truncatedName = nameStr.length > 25 ? nameStr.substring(0, 23) + "..." : nameStr;
        doc.setFont('helvetica', 'bold');
        doc.text(truncatedName, 25, y + 4.2);
        doc.setFont('helvetica', 'normal');

        // Render Description beneath the Name if present
        if (hasDesc) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139); // slate-500
          
          const descStr = safeStrForPdf(item.description || '');
          const truncatedDesc = descStr.length > 32 ? descStr.substring(0, 29) + "..." : descStr;
          doc.text(truncatedDesc, 25, y + 7.8);
          
          // Restore styles
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
        }

        // Model
        doc.text(item.productModel || '—', 82, y + 4.2, { align: 'center' });

        // Serial No
        doc.text(item.serialNumber || '—', 102, y + 4.2, { align: 'center' });

        // Qty
        const unitLabel = item.unit ? ` ${item.unit}` : ' PCS';
        doc.text(`${item.quantity}${unitLabel}`, 124, y + 4.2, { align: 'right' });

        // Rate
        const rateLabel = item.discount > 0 ? `${item.rate} (-${item.discount}%)` : String(item.rate);
        doc.text(rateLabel, 148, y + 4.2, { align: 'right' });

        // GST
        doc.text(`${item.gstRate}%`, 163, y + 4.2, { align: 'right' });

        // Total
        doc.setFont('helvetica', 'bold');
        doc.text(item.total.toLocaleString('en-IN', { minimumFractionDigits: 1 }), 193, y + 4.2, { align: 'right' });

        y += rowHeight;
      });

      // Total of quantities and amounts divider
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);

      y += 1;

      // Bottom Section Layout (Left for Bank settings, Right for Tax math breakdown)
      if (y > 200) {
        doc.addPage();
        pageNum++;
        addInvoiceHeaderAndFooter(pageNum);
        y = 44;
      }

      // 1. BANK REMITTANCE BOX OR PRODUCT DESCRIPTION (LEFT SIDE)
      if (showBankInPrint) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, y + 2, 95, 41, 'F');
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.rect(15, y + 2, 95, 41, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("OFFICIAL PAYMENT MODALITIES (INR)", 20, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(`Bank Name: ${safeStrForPdf(companySettings.bankName)}`, 20, y + 13);
        doc.text(`Account No: ${companySettings.accountNumber}`, 20, y + 17);
        doc.text(`IFSC Details: ${companySettings.ifscCode}`, 20, y + 21);
        doc.text(`GPay / PhonePe / UPI: ${companySettings.upiId}`, 20, y + 25);

        // Terms or state info
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text("STATUTORY TERMS:", 20, y + 31);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const termsSnippet = companySettings.terms ? companySettings.terms.substring(0, 52) : "Subject to local jurisdiction. Goods once sold are not returnable.";
        doc.text(safeStrForPdf(termsSnippet), 20, y + 35);
      } else if (showProdDescInPrint) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, y + 2, 95, 41, 'F');
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.rect(15, y + 2, 95, 41, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("PRODUCT DESCRIPTION & PARTICULARS", 20, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105); // slate-600
        
        const lines = doc.splitTextToSize(customProductDesc || inv.notes || "Product description not specified.", 85);
        doc.text(lines, 20, y + 13);
      } else {
        // Left completely blank as requested by user
      }

      // 2. FINANCIAL DETAIL BREAKDOWN BOX (RIGHT SIDE)
      const labelX = 155;
      const valX = 193;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      doc.text("Taxable Subtotal:", labelX, y + 6, { align: 'right' });
      doc.text(formatRupeeForPdf(inv.subtotal), valX, y + 6, { align: 'right' });

      if (inv.totalDiscount > 0) {
        doc.text("Total Savings/Disc:", labelX, y + 11, { align: 'right' });
        doc.text(`- ${formatRupeeForPdf(inv.totalDiscount)}`, valX, y + 11, { align: 'right' });
      }

      let taxIncY = y + 16;
      if (inv.totalCgst > 0) {
        doc.text("Central GST (CGST):", labelX, taxIncY, { align: 'right' });
        doc.text(formatRupeeForPdf(inv.totalCgst), valX, taxIncY, { align: 'right' });
        taxIncY += 5;
      }
      if (inv.totalSgst > 0) {
        doc.text("State GST (SGST):", labelX, taxIncY, { align: 'right' });
        doc.text(formatRupeeForPdf(inv.totalSgst), valX, taxIncY, { align: 'right' });
        taxIncY += 5;
      }
      const totalGstVal = (inv.totalCgst || 0) + (inv.totalSgst || 0);
      if (totalGstVal > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Total GST Value:", labelX, taxIncY, { align: 'right' });
        doc.text(formatRupeeForPdf(totalGstVal), valX, taxIncY, { align: 'right' });
        doc.setFont("helvetica", "normal");
        taxIncY += 5;
      }

      // Draw thick divider before grand total
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.4);
      doc.line(115, taxIncY + 1, 195, taxIncY + 1);

      // Grand Total Highlight Banner based on custom dynamic theme variables
      const fillThemeRgb = hexToRgb(invoiceStyle.tableHeaderBg || '#ecfdf5');
      doc.setFillColor(fillThemeRgb[0], fillThemeRgb[1], fillThemeRgb[2]);
      doc.rect(115, taxIncY + 3, 80, 10, 'F');
      
      const strokeThemeRgb = hexToRgb(invoiceStyle.primaryColor || '#059669');
      doc.setDrawColor(strokeThemeRgb[0], strokeThemeRgb[1], strokeThemeRgb[2]);
      doc.rect(115, taxIncY + 3, 80, 10, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      
      const txtThemeRgb = hexToRgb(invoiceStyle.secondaryColor || '#047857');
      doc.setTextColor(txtThemeRgb[0], txtThemeRgb[1], txtThemeRgb[2]);
      doc.text("INVOICE GRAND TOTAL:", 120, taxIncY + 9.5);
      doc.text(formatRupeeForPdf(inv.grandTotal), valX - 2, taxIncY + 9.5, { align: 'right' });

      // Clean Signature Section underneath
      y = taxIncY + 20;
      if (y > 255) {
        doc.addPage();
        pageNum++;
        addInvoiceHeaderAndFooter(pageNum);
        y = 50;
      }

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(15, y + 12, 75, y + 12);
      doc.line(135, y + 12, 195, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Receiver's Signature", 45, y + 16, { align: 'center' });
      doc.text(`For ${safeStrForPdf(companySettings.companyName)}`, 165, y + 16, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text("Authorized Signatory", 165, y + 21, { align: 'center' });

      // Save and trigger immediate file download
      const formattedDate = new Date().toISOString().split('T')[0];
      doc.save(`${inv.invoiceNumber}_${formattedDate}.pdf`);
      alert(`Success! Invoice A4 PDF [${inv.invoiceNumber}] compiled successfully & saved directly to your device browser storage!`);
    } catch (e: any) {
      console.error(e);
      alert(`Error compiling PDF Invoice: ${e?.message || e}`);
    }
  };

  const printInvoicesListPdf = () => {
    try {
      const JsPDFClass = getJsPdfInstance();
      let doc: any;
      try {
        doc = new JsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      } catch (err) {
        doc = new JsPDFClass('p', 'mm', 'a4');
      }

      let y = 20;
      let pageNum = 1;

      const addHeaderAndFooter = (pageNum: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text("D BILLIFY STATEMENT", 15, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("Comprehensive All Invoices Report", 15, 25);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 15, 29);

        doc.setFillColor(249, 115, 22);
        doc.rect(15, 33, 180, 1, 'F');

        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${pageNum}`, 15, 287);
        doc.text("* Internal system generated statement report.", 130, 287);
      };

      addHeaderAndFooter(pageNum);
      y = 45;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("ALL INVOICES LIST", 15, y);
      
      const tlTotalDisplay = formatRupeeForPdf(filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Total Amount: ${tlTotalDisplay}`, 15, y + 6);
      
      y += 15;

      // Table Header
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Date", 18, y + 5.5);
      doc.text("Invoice No", 40, y + 5.5);
      doc.text("Customer", 75, y + 5.5);
      doc.text("Status", 155, y + 5.5);
      doc.text("Amount (INR)", 188, y + 5.5, { align: 'right' });

      y += 8;

      // Rows
      filteredInvoices.forEach((inv) => {
        if (y > 270) {
          doc.addPage();
          pageNum++;
          addHeaderAndFooter(pageNum);
          y = 45;
          doc.setFillColor(15, 23, 42);
          doc.rect(15, y, 180, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text("Date", 18, y + 5.5);
          doc.text("Invoice No", 40, y + 5.5);
          doc.text("Customer", 75, y + 5.5);
          doc.text("Status", 155, y + 5.5);
          doc.text("Amount (INR)", 188, y + 5.5, { align: 'right' });
          y += 8;
        }

        doc.setFillColor(255, 255, 255);
        doc.rect(15, y, 180, 7, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + 7, 195, y + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        
        const safeDate = safeStrForPdf(inv.date).substring(0, 10);
        doc.text(safeDate, 18, y + 4.5);
        
        doc.text(safeStrForPdf(inv.invoiceNumber), 40, y + 4.5);

        const nameStr = safeStrForPdf(inv.contactName);
        doc.text(nameStr.length > 40 ? nameStr.substring(0, 37) + "..." : nameStr, 75, y + 4.5);

        let statusStr = 'Pending';
        if (inv.paymentStatus === 'paid') statusStr = 'Paid';
        if (inv.paymentStatus === 'unpaid') statusStr = 'Unpaid';
        doc.setFont('helvetica', 'bold');
        if (inv.paymentStatus === 'paid') {
          doc.setTextColor(5, 150, 105);
        } else if (inv.paymentStatus === 'unpaid') {
          doc.setTextColor(202, 138, 4);
        } else {
          doc.setTextColor(225, 29, 72);
        }
        doc.text(statusStr, 155, y + 4.5);

        doc.setTextColor(15, 23, 42);
        doc.text(`${(inv.grandTotal || 0).toLocaleString('en-IN')}`, 188, y + 4.5, { align: 'right' });

        y += 7.5;
      });

      // Saving
      doc.save(`Invoices_List_${Date.now()}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert(`Print All Invoices List failed: ${err?.message}`);
    }
  };

  const handlePrint = () => {
    document.body.setAttribute('data-print-mode', 'invoice');
    window.print();
    const clearPrintMode = () => {
      document.body.removeAttribute('data-print-mode');
      window.removeEventListener('afterprint', clearPrintMode);
    };
    window.addEventListener('afterprint', clearPrintMode);
    setTimeout(clearPrintMode, 2000);
  };

  return (
    <div className="space-y-6">
      {!isEditing && !viewingInvoice ? (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          {/* Main Action Header with Integrated Format Uploader (Target Selectors) */}
          <div 
            className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-rose-50/10 pb-4 transition-all rounded-xl p-3 ${
              dragActive ? "bg-orange-50/20 border-2 border-dashed border-orange-400" : ""
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 capitalize tracking-tight">
                  {activeTab === 'sale' ? "Sales Ledger & Invoices" : "Procurement & Purchase Ledger"}
                </h2>
                <div 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 border shadow-xs transition-colors"
                  style={{ 
                    backgroundColor: (invoiceStyle.primaryColor || '#f97316') + '15', 
                    borderColor: (invoiceStyle.primaryColor || '#f97316') + '35',
                    color: invoiceStyle.primaryColor || '#f97316'
                  }}
                >
                  <Palette className="h-3 w-3 animate-pulse" />
                  Style: {invoiceStyle.themeName} ({invoiceStyle.fontFamily})
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'sale' 
                  ? "Manage output GST invoices, cash sales counter, and customer credit bills." 
                  : "Track inputs of goods, raw material procurements, and supplier accounts."}
              </p>
            </div>
            
            {/* Integrated Custom Styling Uploader Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Uploader File Input Button */}
              <div className="relative">
                <input
                  id="style-uploaddoc-top"
                  type="file"
                  className="hidden"
                  accept=".json,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="style-uploaddoc-top"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs select-none hover:scale-102"
                >
                  <UploadCloud className="h-4 w-4 text-orange-500" style={{ color: invoiceStyle.primaryColor }} />
                  <span>Upload Theme / Image (.json, .jpg, .png)</span>
                </label>
              </div>

              {/* Reset to Default Theme Button */}
              <button
                type="button"
                id="btn-reset-default-theme"
                onClick={() => {
                  const defaultTheme = {
                    themeName: 'Classic Clear Minimalist',
                    fontFamily: 'Inter',
                    primaryColor: '#1e293b',
                    secondaryColor: '#475569',
                    tableHeaderBg: '#f8fafc',
                    tableHeaderTextColor: '#0f172a',
                    logoPosition: 'left',
                    lineColor: 'slate',
                    lineStyle: 'solid',
                    lineThickness: 'thin',
                    textCase: 'normal',
                    fontSizeMultiplier: '100%'
                  };
                  setInvoiceStyle(defaultTheme);
                  localStorage.setItem('vyapar_invoice_style_config', JSON.stringify(defaultTheme));
                  setUploadSuccess("Restored Classic Clear Minimalist style & layout format successfully.");
                  setUploadError(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs select-none hover:scale-102"
              >
                <RotateCcw className="h-4 w-4 text-rose-500" style={{ color: invoiceStyle.primaryColor }} />
                <span>Default Theme</span>
              </button>

              {/* Toggle preset theme catalog */}
              <button
                type="button"
                id="btn-toggle-stylist"
                onClick={() => setShowStylist(!showStylist)}
                className={`text-xs font-bold py-2 px-3.5 rounded-xl transition-all border shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-102 ${
                  showStylist 
                    ? "bg-slate-800 border-slate-800 text-white" 
                    : "bg-white border-slate-200 text-slate-750 hover:bg-slate-50"
                }`}
              >
                <Palette className="h-3.5 w-3.5 text-orange-400" />
                <span>Preset Catalog {showStylist ? "▲" : "▼"}</span>
              </button>

              {/* Direct Print Invoices List Button */}
              <button
                type="button"
                id="btn-print-invoices-list"
                onClick={printInvoicesListPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs select-none hover:scale-102"
              >
                <Printer className="h-4 w-4 text-orange-400" />
                <span>Print Invoices List</span>
              </button>

              <button
                id="btn-add-invoice"
                onClick={initNewInvoice}
                className="hover:opacity-90 font-bold text-white text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 select-none hover:scale-102 shrink-0"
                style={{ 
                  backgroundColor: invoiceStyle.primaryColor || '#f97316',
                  shadowColor: (invoiceStyle.primaryColor || '#f97316') + '30'
                }}
              >
                <Plus className="h-4 w-4" /> 
                {activeTab === 'sale' ? "Create Sale Invoice" : "Record Purchase Bill"}
              </button>
            </div>
          </div>

          {/* Alert messages for style loading feedback */}
          {(uploadError || uploadSuccess) && (
            <div className="px-1.5">
              {uploadError && (
                <div className="p-3 text-xs font-bold text-red-650 bg-red-50/80 border border-red-100 rounded-xl flex items-center justify-between">
                  <span>⚠️ {uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="text-[10px] text-slate-400 hover:text-slate-600 font-extrabold uppercase ml-2">Dismiss</button>
                </div>
              )}
              {uploadSuccess && (
                <div className="p-3 text-xs font-bold text-emerald-850 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <span>✅ {uploadSuccess}</span>
                  <button onClick={() => setUploadSuccess(null)} className="text-[10px] text-slate-400 hover:text-slate-600 font-extrabold uppercase ml-2">Dismiss</button>
                </div>
              )}
            </div>
          )}

          {/* Expanded Theme Presets and sample schema generator library */}
          {showStylist && (
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Visual guidelines */}
                <div className="space-y-2 flex flex-col justify-center">
                  <h3 className="text-sm font-black text-slate-850 flex items-center gap-1.5">
                     <span>💡 Dynamic Visual Layout Sandbox</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Format configuration files redefine the color scheme, branding highlights, border finishes, and physical print fonts inside the PDF rendering pipeline on the fly. Select a pre-loaded GST compliant variant below, or download its source schema JSON file to customize your own styling patterns.
                  </p>
                  <div className="pt-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accepted Keys in uploaded JSON file:</span>
                    <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px] text-slate-600">
                      <span className="bg-white border rounded px-1.5 py-0.5">themeName</span>
                      <span className="bg-white border rounded px-1.5 py-0.5">primaryColor</span>
                      <span className="bg-white border rounded px-1.5 py-0.5">secondaryColor</span>
                      <span className="bg-white border rounded px-1.5 py-0.5">tableHeaderBg</span>
                      <span className="bg-white border rounded px-1.5 py-0.5">fontFamily</span>
                    </div>
                  </div>
                </div>

                {/* Theme Preset Selection, Preview, and Download sample config files */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span>🎯 Standard Presets Library</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {presetThemes.map((preset, index) => {
                      const isActive = invoiceStyle.themeName === preset.themeName;
                      return (
                        <div 
                          key={index}
                          className={`border rounded-xl p-2 bg-white flex flex-col justify-between transition-all hover:shadow-xs cursor-pointer ${
                            isActive ? "border-orange-500 ring-1 ring-orange-500" : "border-slate-150"
                          }`}
                          style={isActive ? {borderColor: invoiceStyle.primaryColor, ringColor: invoiceStyle.primaryColor} : {}}
                          onClick={() => applyPreset(preset)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-extrabold text-slate-800 line-clamp-1">{preset.themeName}</span>
                            {isActive && <Check className="h-3.5 w-3.5 text-orange-500 font-bold shrink-0" style={{color: invoiceStyle.primaryColor}} />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span 
                              className="h-3.5 w-3.5 rounded-full inline-block border border-white shrink-0 shadow-xs"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                            <span className="text-[9px] text-slate-400 font-mono italic">{preset.fontFamily}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPresetJson(preset);
                            }}
                            className="w-full mt-2 text-[9px] font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-650 py-1 rounded transition-colors text-center cursor-pointer font-mono"
                          >
                            Download format.json
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Printable list wrapper block */}
          <div id="print-invoice-list-area" className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 h-10 w-10 text-slate-400 flex items-center justify-center" />
              <input
                id="invoice-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder={`Search by contact name, mobile, or bill serial...`}
              />
            </div>

            {/* Table list */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Party Name</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">GST Totals</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50 font-medium">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      No invoices found matching criteria. Add your first record above!
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const gstTotal = inv.totalCgst + inv.totalSgst;
                    const isSale = inv.type === 'sale';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3.5 text-slate-500">{inv.date}</td>
                        <td className="px-4 py-3.5">
                          <p className="text-slate-900 font-bold">{inv.contactName}</p>
                          <p className="text-[10px] text-slate-400 font-normal">Party Mobile: {inv.contactMobile}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                          ₹{gstTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-orange-600">
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            inv.paymentStatus === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : inv.paymentStatus === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right flex items-center justify-end gap-2 px-1">
                          <button
                            id={`btn-view-${inv.id}`}
                            onClick={() => setViewingInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View / Print A4"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-dl-direct-${inv.id}`}
                            onClick={() => generateSnapshotPdf(inv)}
                            className="p-1.5 text-orange-500 hover:text-orange-650 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Download A4 PDF (Direct)"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-edit-${inv.id}`}
                            onClick={() => handleEditInit(inv)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            id={`btn-delete-${inv.id}`}
                            onClick={() => onDeleteInvoice(inv.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      ) : isEditing ? (
        /* DYNAMIC FORM (CREATION & EDIT) */
        <form onSubmit={handleSaveSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          
          {/* AI Invoice Builder Widget */}
          {!formInvoiceId && (
            <div className="bg-orange-50/75 border border-orange-200/50 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">AI Instant Invoice Builder (Natural Language)</h4>
                </div>
                <span className="text-[9px] bg-orange-100 text-orange-850 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Gemini Flash Active</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-normal">
                Type what you want to bill in plain English. The AI will instantly search matching products, calculate precise rates, apply GST, and autofill this draft!
              </p>
              <div className="flex gap-2.5 items-stretch">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'Make a sale invoice for Royal Motors, mobile 9876543210. Add item automatic saw qty 3 and hex screwdriver qty 5'"
                  rows={2}
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 font-sans resize-none text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleParseInvoiceWithAi}
                  disabled={isParsingAi}
                  className="px-4 hover:opacity-95 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
                >
                  {isParsingAi ? "Parsing..." : "Build Bill"}
                </button>
              </div>
              {aiError && (
                <p className="text-[10px] text-red-500 font-bold">⚠️ {aiError}</p>
              )}
            </div>
          )}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {formInvoiceId ? `Modify ${formType === 'sale' ? 'Sale' : 'Purchase'} Invoice` : `Generate New ${formType === 'sale' ? 'Sale' : 'Purchase'} Invoice`}
                </h3>
                <p className="text-xs text-slate-500">Define dynamic counterparty details, items list, values and tax calculations.</p>
              </div>
            </div>

            {/* Toggle form type inside editor if creating new */}
            {!formInvoiceId && (
              <div className="bg-slate-100 p-1 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => setFormType('sale')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formType === 'sale' ? 'bg-orange-500 text-white shadow' : 'text-slate-500'
                  }`}
                >
                  Sale Bill (A4 output)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('purchase')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formType === 'purchase' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'
                  }`}
                >
                  Purchase Bill (Inward)
                </button>
              </div>
            )}
          </div>

          {/* Editor Tabs Selection */}
          <div className="flex border-b border-slate-150">
            <button
              type="button"
              onClick={() => setEditorTab('details')}
              className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                editorTab === 'details' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Invoice Form Details
            </button>
            <button
              type="button"
              onClick={() => setEditorTab('changelog')}
              className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
                editorTab === 'changelog' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="h-4 w-4 text-slate-500" />
              Change Log Audit Trail
              {formInvoiceId && (
                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {((invoices.find(inv => inv.id === formInvoiceId)?.changeLog) || []).length}
                </span>
              )}
            </button>
          </div>

          {editorTab === 'changelog' ? (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-5 w-5 text-orange-500" />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Invoice Audit & Change Log Timeline</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Every modification is saved to Firestore in real-time. Below is the complete record of edits and revisions made to this invoice.
                </p>
              </div>

              {formInvoiceId ? (
                <div className="relative border-l border-slate-200 pl-6 ml-4 space-y-6">
                  {(() => {
                    const currentInv = invoices.find(inv => inv.id === formInvoiceId);
                    const logEntries = currentInv?.changeLog || [];
                    
                    if (logEntries.length === 0) {
                      return (
                        <div className="text-center py-10 text-slate-400 text-xs font-bold">
                          No audit changes have been recorded for this invoice yet.
                        </div>
                      );
                    }

                    // Sort chronologically (latest first)
                    const sortedLogs = [...logEntries].sort((a, b) => b.timestamp - a.timestamp);

                    return sortedLogs.map((log) => {
                      const dateObj = new Date(log.timestamp);
                      const formattedTime = dateObj.toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });

                      const isCreated = log.action === 'created';

                      return (
                        <div key={log.id} className="relative group">
                          {/* Dot marker */}
                          <span className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${
                            isCreated ? 'border-emerald-500' : 'border-blue-500'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              isCreated ? 'bg-emerald-500' : 'bg-blue-500'
                            }`} />
                          </span>

                          <div className="bg-slate-50/40 hover:bg-slate-50 border border-slate-100 rounded-xl p-4 transition-colors shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  isCreated 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="text-xs font-bold text-slate-800">{log.userName || log.userEmail}</span>
                                <span className="text-[10px] text-slate-400">({log.userEmail})</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium font-mono">{formattedTime}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap">{log.details}</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-100 text-orange-800 rounded-xl p-4 text-xs font-bold text-center">
                  This is a brand new draft invoice. The change log timeline will begin recording entries once you save the invoice for the first time.
                </div>
              )}

              {/* Close/Back to Form buttons */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditorTab('details')}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Back to Invoice Form
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                >
                  Close Editor
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Form Fields: Invoice Meta */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number</label>
              <div className="flex gap-1.5">
                <input
                  id="form-inv-num"
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500 bg-slate-50"
                  placeholder="INV-XXXX"
                />
                <button
                  type="button"
                  onClick={generateInvoiceNumber}
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 flex-shrink-0"
                  title="Regenerate"
                >
                  Auto
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                id="form-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input
                id="form-due-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State of Supply (GST Compliance)</label>
              <select
                id="form-supply-state"
                value={stateOfSupply}
                onChange={(e) => setStateOfSupply(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="Haryana">Haryana</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Punjab">Punjab</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="19 West Bengal">19 West Bengal</option>
              </select>
            </div>
          </div>

          {/* Section: Party Selection or Creation */}
          <div className="p-4 bg-slate-50/70 border border-slate-150 rounded-2xl space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-4 w-4 text-orange-500" />
              Party (Customer / Supplier) Credentials
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">Quick Select Party</label>
                <select
                  id="form-party-select"
                  value={contactId}
                  onChange={(e) => handleContactChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Choose Party --</option>
                  <option value="custom">✍️ Custom Cash / One-Time Party</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Party Legal Name</label>
                <input
                  id="form-party-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-orange-500 font-bold"
                  placeholder="e.g. Acme Enterprises"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mobile / Phone</label>
                <input
                  id="form-party-mobile"
                  type="tel"
                  maxLength={10}
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GSTIN Number (Optional)</label>
                <input
                  id="form-party-gstin"
                  type="text"
                  maxLength={15}
                  value={contactGstin}
                  onChange={(e) => setContactGstin(e.target.value.toUpperCase())}
                  className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  placeholder="e.g. 06AAAAA1111A1Z1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Billing Address</label>
              <input
                id="form-party-address"
                type="text"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-orange-500"
                placeholder="Complete street address details"
              />
            </div>
          </div>

          {/* Line Items Entry Portal */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <FileSpreadsheet className="h-4 w-4 text-orange-500" />
              Dynamic Product Sales Lines Options
            </h4>

            {/* Line Item Add Row */}
            <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100/85 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* SKU Selector (Autofills) */}
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pre-saved Product SKU (Optional Autocomplete)
                  </label>
                  <select
                    id="form-item-select"
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Type custom or select SKU --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Qty: {p.stockQuantity} {p.unit}, Sales Rate: ₹{p.salesRate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Name */}
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Product Description / Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="form-item-name-input"
                    type="text"
                    value={lineItemName}
                    onChange={(e) => setLineItemName(e.target.value)}
                    placeholder="e.g. Syska Smart LED Bulb"
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Product Model */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Product Model / Version
                  </label>
                  <input
                    id="form-item-model-input"
                    type="text"
                    value={lineItemModel}
                    onChange={(e) => setLineItemModel(e.target.value)}
                    placeholder="e.g. Smart-12W"
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Product Serial Number */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Product Serial Number
                  </label>
                  <input
                    id="form-item-serial-input"
                    type="text"
                    value={lineItemSerial}
                    onChange={(e) => setLineItemSerial(e.target.value)}
                    placeholder="e.g. SN-982138A"
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-orange-500 font-mono font-bold"
                  />
                </div>

                {/* Detailed Product Specifications / Custom Description */}
                <div className="md:col-span-12">
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <span>✍️ Detailed Product Specifications / Custom Description</span>
                      <span className="text-slate-400 font-normal lg:inline hidden normal-case italic">(This appears under the product name on the printed invoice)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleExpandDescriptionWithAi}
                      disabled={isExpandingDesc}
                      className="inline-flex items-center gap-1 text-[9px] font-extrabold text-orange-650 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-md transition-all uppercase select-none cursor-pointer"
                    >
                      {isExpandingDesc ? "Expanding..." : "✨ AI Expand Specification"}
                    </button>
                  </label>
                  <textarea
                    id="form-item-desc-textarea"
                    rows={1}
                    value={lineItemDesc}
                    onChange={(e) => setLineItemDesc(e.target.value)}
                    placeholder="Type customized specifications, technical parameters, color, batch details, warranty info, etc..."
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-orange-500 font-medium font-mono resize-y"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-12 gap-4">

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    id="form-item-qty"
                    type="number"
                    min={1}
                    value={lineItemQty}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setLineItemQty(val);
                      // Default pieces (pcs) to equal quantity
                      setLineItemPcs(val);
                    }}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Pieces Pcs */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Pieces (Pcs)
                  </label>
                  <input
                    id="form-item-pcs"
                    type="number"
                    min={1}
                    value={lineItemPcs}
                    onChange={(e) => setLineItemPcs(Math.max(1, Number(e.target.value)))}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Unit */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Unit Measure
                  </label>
                  <input
                    id="form-item-unit"
                    type="text"
                    value={lineItemUnit}
                    onChange={(e) => setLineItemUnit(e.target.value)}
                    placeholder="e.g. PCS, BOX, LTR"
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Unit Price Excl. Tax */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Unit Price (Excl. Tax)
                  </label>
                  <input
                    id="form-item-rate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={lineItemUnitPrice}
                    onChange={(e) => setLineItemUnitPrice(Math.max(0, Number(e.target.value)))}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500 text-orange-650"
                  />
                </div>

                {/* GST Rate Option Select */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    GST Rate Option (%)
                  </label>
                  <select
                    id="form-item-gst-select"
                    value={lineItemGstRate}
                    onChange={(e) => setLineItemGstRate(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value={0}>0% Tax Free</option>
                    <option value={5}>5% GST (CGST 2.5% + SGST 2.5%)</option>
                    <option value={12}>12% GST (CGST 6% + SGST 6%)</option>
                    <option value={18}>18% Standard GST (CGST 9% + SGST 9%)</option>
                    <option value={28}>28% Luxury GST (CGST 14% + SGST 14%)</option>
                  </select>
                </div>

                {/* Discount % */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Discount %
                  </label>
                  <input
                    id="form-item-disc"
                    type="number"
                    min={0}
                    max={100}
                    value={lineItemDiscount}
                    onChange={(e) => setLineItemDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

              </div>

              {/* Live automatic calculations summary row */}
              <div className="bg-white p-4 border border-orange-150 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs shadow-sm">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Automatic Price & GST Calculation Engine
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-700">
                    <span className="bg-slate-50 px-2 py-1 rounded border">
                      Excl. Tax Price: <strong>₹{(lineItemUnitPrice * (1 - lineItemDiscount / 100)).toFixed(2)}</strong>
                    </span>
                    <span className="bg-orange-50/50 text-orange-850 px-2 py-1 rounded border border-orange-100 font-semibold">
                      Incl. Tax Price (CGST + SGST): <strong>₹{(lineItemUnitPrice * (1 + lineItemGstRate / 100) * (1 - lineItemDiscount / 100)).toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span>
                      Line Subtotal: <strong>₹{(lineItemUnitPrice * lineItemQty).toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span>
                      Line Total GST: <strong>₹{((lineItemUnitPrice * lineItemQty * (1 - lineItemDiscount / 100)) * (lineItemGstRate / 100)).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    id="btn-add-line-item"
                    type="button"
                    onClick={addLineItem}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4 text-orange-400" /> Add to Invoice Roll
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Items Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Item Details</th>
                    <th className="px-3 py-2.5">Serial Number</th>
                    <th className="px-3 py-2.5 text-center">Quantity (Pcs)</th>
                    <th className="px-3 py-2.5 text-right">Unit Price (₹)</th>
                    <th className="px-3 py-2.5 text-center">Discount (%)</th>
                    <th className="px-3 py-2.5 text-center">GST Rate (%)</th>
                    <th className="px-3 py-2.5 text-right">SGST & CGST Tax</th>
                    <th className="px-3 py-2.5 text-right">Total Line (₹)</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50 font-medium">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-400 font-normal">
                        No product lines included yet. Use the customizable SKU row above to add items!
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, index) => {
                      const taxTotal = item.cgst + item.sgst;
                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3">
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            {item.description && (
                              <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 whitespace-pre-line leading-relaxed max-w-sm">
                                {item.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[9px]">
                              {item.productModel && (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">
                                  Model: {item.productModel}
                                </span>
                              )}
                              {item.serialNumber && (
                                <span className="bg-amber-150 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-200">
                                  S/N: {item.serialNumber}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-500 text-xs">{item.serialNumber || '—'}</td>
                          <td className="px-3 py-3 text-center">
                            <p className="font-bold text-slate-900 font-mono">{item.quantity}</p>
                            <p className="text-[9px] text-slate-400">
                              {item.pcs ? `${item.pcs} Pcs` : ''} ({item.unit || 'PCS'})
                            </p>
                          </td>
                          <td className="px-3 py-3 text-right font-mono">₹{item.rate.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-3 text-center font-mono text-slate-500">{item.discount}%</td>
                          <td className="px-3 py-3 text-center font-mono text-slate-500">{item.gstRate}%</td>
                          <td className="px-3 py-3 text-right">
                            {item.cgst > 0 ? (
                              <p className="text-[9px] text-slate-500 font-mono">CGST: ₹{item.cgst}</p>
                            ) : null}
                            {item.sgst > 0 ? (
                              <p className="text-[9px] text-slate-500 font-mono">SGST: ₹{item.sgst}</p>
                            ) : null}
                            <p className="text-[10px] font-black text-slate-800 font-mono">₹{taxTotal.toFixed(2)}</p>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">₹{item.total.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-3 text-center">
                            <button
                              id={`remove-draft-item-${index}`}
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes and Grand Calculations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
            <div className="lg:col-span-7">
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Notes / Terms Override</label>
              <textarea
                id="form-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50/40"
                placeholder="Optional notes or declarations specifically printed on customer's A4 invoice layout..."
              />
            </div>

            {/* Calculations and Breakdown Summary */}
            <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-slate-700 space-y-2.5">
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b pb-1.5">Compliance Summary</h5>
              
              <div className="flex justify-between text-xs">
                <span>Subtotal Value:</span>
                <span className="font-mono font-bold text-slate-900">₹{subtotalSum.toFixed(2)}</span>
              </div>

              {discountSum > 0 && (
                <div className="flex justify-between text-xs text-red-600">
                  <span>Custom Discount:</span>
                  <span className="font-mono font-bold">-₹{discountSum.toFixed(2)}</span>
                </div>
              )}

              {cgstSum > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>CGST Total:</span>
                  <span className="font-mono">₹{cgstSum.toFixed(2)}</span>
                </div>
              )}

              {sgstSum > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>SGST Total:</span>
                  <span className="font-mono">₹{sgstSum.toFixed(2)}</span>
                </div>
              )}

              {(cgstSum + sgstSum) > 0 && (
                <div className="flex justify-between text-xs text-orange-600 font-bold border-t border-dashed pt-1.5 mt-1.5">
                  <span>Total GST Value:</span>
                  <span className="font-mono">₹{(cgstSum + sgstSum).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-orange-600 border-t pt-2 mt-2">
                <span>Grand Total (INR):</span>
                <span className="font-mono text-base">₹{grandTotalResult.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Submit panel */}
              <div className="pt-3 flex gap-2">
                <button
                  id="btn-save-invoice-form"
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle className="h-4.5 w-4.5" /> Save Record & Complete
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          </>
          )}
        </form>
      ) : (
        /* A4 INVOICE PREVIEW MODAL layout (#9) */
        <div className="bg-slate-100 rounded-3xl p-4 sm:p-6 border border-slate-200/60 max-w-4xl mx-auto space-y-6">
          
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-150 shadow-sm">
            <button
              id="btn-preview-back"
              onClick={() => setViewingInvoice(null)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Go Back to List
            </button>

            <div className="flex items-center gap-2">
              <button
                id="btn-preview-print"
                disabled={isPrinting}
                onClick={() => printSnapshotPdf(viewingInvoice!)}
                className={`px-3.5 py-1.5 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm ${
                  isPrinting 
                    ? 'bg-slate-850 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-950 hover:bg-slate-900 text-white'
                }`}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                ) : (
                  <Printer className="h-4 w-4 text-orange-400" />
                )}
                {isPrinting ? 'Preparing Print...' : 'Print Invoice'}
              </button>
              <button
                id="btn-preview-download"
                onClick={() => generateSnapshotPdf(viewingInvoice!)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download A4 PDF
              </button>
              <button
                id="btn-preview-whatsapp"
                disabled={sharingOnWhatsApp}
                onClick={() => shareInvoiceOnWhatsApp(viewingInvoice!)}
                className={`px-3.5 py-1.5 text-white font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 ${
                  sharingOnWhatsApp 
                    ? 'bg-emerald-700/60 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {sharingOnWhatsApp ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sharingOnWhatsApp ? 'Generating PDF...' : 'Share on WhatsApp'}
              </button>
              <div className="w-[1px] h-5 bg-slate-300 self-center mx-1" />
              <a
                id="btn-preview-email"
                href={getEmailShareLink(viewingInvoice!)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
              >
                <Share2 className="h-4 w-4" /> Email Link
              </a>
            </div>
          </div>

          {/* Quick-Adjust Print Options Control Panel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                ⚙️ Invoice Printable Layout Adjustments
              </h4>
              <p className="text-[10px] text-slate-500">
                Control layout sections, show/hide details, and enter customized product descriptions/particulars before physical print or downloading PDF.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Toggle Bank Details */}
              <label className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer select-none transition-colors">
                <input 
                  type="checkbox" 
                  checked={showBankInPrint} 
                  onChange={(e) => {
                    setShowBankInPrint(e.target.checked);
                    localStorage.setItem('vyapar_show_bank_in_print', String(e.target.checked));
                    if (e.target.checked) {
                      setShowProdDescInPrint(false);
                      localStorage.setItem('vyapar_show_prod_desc_in_print', 'false');
                    }
                  }}
                  className="rounded text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-bold text-slate-700">Show Bank Details</span>
              </label>

              {/* Toggle Product Description */}
              <label className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer select-none transition-colors">
                <input 
                  type="checkbox" 
                  checked={showProdDescInPrint} 
                  onChange={(e) => {
                    setShowProdDescInPrint(e.target.checked);
                    localStorage.setItem('vyapar_show_prod_desc_in_print', String(e.target.checked));
                    if (e.target.checked) {
                      setShowBankInPrint(false);
                      localStorage.setItem('vyapar_show_bank_in_print', 'false');
                    }
                  }}
                  className="rounded text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-bold text-slate-700">Show Product Description</span>
              </label>

              {/* Edit Product Description Input Box */}
              {showProdDescInPrint && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customProductDesc}
                    onChange={(e) => {
                      setCustomProductDesc(e.target.value);
                      localStorage.setItem('vyapar_custom_prod_desc', e.target.value);
                    }}
                    placeholder="Enter custom specifications..."
                    className="px-2.5 py-1 text-[10px] border border-slate-200 bg-slate-50 hover:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium w-48 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* QR Code Generator Collapsible Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowQRGenerator(!showQRGenerator)}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between font-bold text-slate-800 text-xs uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-orange-500" />
                📱 Instant UPI QR Code Generator & Pay Hub
              </span>
              <span className="text-slate-400 font-black">{showQRGenerator ? "▲ Hide Generator" : "▼ Show Generator"}</span>
            </button>

            {showQRGenerator && (
              <div className="p-4 border-t border-slate-150 bg-slate-50/20">
                <QRCodeGenerator 
                  invoice={viewingInvoice!} 
                  companySettings={companySettings} 
                />
              </div>
            )}
          </div>

          {/* Theme, Text, and Line Format Customizer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowStyleCustomizer(!showStyleCustomizer)}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between font-bold text-slate-800 text-xs uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-orange-500" />
                🎨 Customize Theme, Lines & Text Case
              </span>
              <span className="text-slate-400 font-black">{showStyleCustomizer ? "▲ Hide Customizer" : "▼ Show Customizer"}</span>
            </button>

            {showStyleCustomizer && (
              <div className="p-4 border-t border-slate-150 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn">
                
                {/* BRAND COLOR SCHEME */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-700 uppercase tracking-wider border-b pb-1">
                    🎨 Branding Colors
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Primary Theme Color:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={invoiceStyle.primaryColor || '#0f5146'}
                          onChange={(e) => updateStyleProp('primaryColor', e.target.value)}
                          className="h-6 w-6 border rounded cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-600 font-bold">
                          {invoiceStyle.primaryColor || '#0f5146'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Secondary Accent:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={invoiceStyle.secondaryColor || '#475569'}
                          onChange={(e) => updateStyleProp('secondaryColor', e.target.value)}
                          className="h-6 w-6 border rounded cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-600 font-bold">
                          {invoiceStyle.secondaryColor || '#475569'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Table Header BG:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={invoiceStyle.tableHeaderBg || '#ccebe5'}
                          onChange={(e) => updateStyleProp('tableHeaderBg', e.target.value)}
                          className="h-6 w-6 border rounded cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-600 font-bold">
                          {invoiceStyle.tableHeaderBg || '#ccebe5'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Table Header Text:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={invoiceStyle.tableHeaderTextColor || '#000000'}
                          onChange={(e) => updateStyleProp('tableHeaderTextColor', e.target.value)}
                          className="h-6 w-6 border rounded cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-600 font-bold">
                          {invoiceStyle.tableHeaderTextColor || '#000000'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Logo Alignment:</span>
                      <select
                        value={invoiceStyle.logoPosition || 'right'}
                        onChange={(e) => updateStyleProp('logoPosition', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="left">Left Side Branding</option>
                        <option value="right">Right Side Branding</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BORDER & LINE FORMATTING */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-700 uppercase tracking-wider border-b pb-1">
                    ✏️ Border & Line Format
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Line Color Style:</span>
                      <select
                        value={invoiceStyle.lineColor || 'theme'}
                        onChange={(e) => updateStyleProp('lineColor', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="theme">Primary Theme Color</option>
                        <option value="black">Deep Elegant Black</option>
                        <option value="slate">Sleek Slate Gray</option>
                        <option value="charcoal">Bold Charcoal</option>
                        <option value="silver">Fine light Silver</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Border Line Type:</span>
                      <select
                        value={invoiceStyle.lineStyle || 'solid'}
                        onChange={(e) => updateStyleProp('lineStyle', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="solid">━━━━ Solid Line</option>
                        <option value="dashed">---- Dashed Line</option>
                        <option value="dotted">•••• Dotted Line</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Line Weight/Thickness:</span>
                      <select
                        value={invoiceStyle.lineThickness || 'thin'}
                        onChange={(e) => updateStyleProp('lineThickness', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="thin">Hairline Thin (1px)</option>
                        <option value="medium">Standard Weight (2px)</option>
                        <option value="bold">Extra Bold (3px)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* TYPOGRAPHY, SIZE & TEXT CASE */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-700 uppercase tracking-wider border-b pb-1">
                    🔤 Typography & Case
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Font Family:</span>
                      <select
                        value={invoiceStyle.fontFamily || 'Inter'}
                        onChange={(e) => updateStyleProp('fontFamily', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="Inter">Inter (Sans-Serif)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta (Modern)</option>
                        <option value="Georgia">Georgia (Classic Serif)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
                        <option value="Courier New">Courier New (Traditional)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Letter Case Style:</span>
                      <select
                        value={invoiceStyle.textCase || 'uppercase'}
                        onChange={(e) => updateStyleProp('textCase', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="uppercase">FORCE ALL UPPERCASE</option>
                        <option value="normal">Standard Natural Text</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Font Scaling:</span>
                      <select
                        value={invoiceStyle.fontSizeMultiplier || '100%'}
                        onChange={(e) => updateStyleProp('fontSizeMultiplier', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="90%">Compact (90%)</option>
                        <option value="100%">Default (100%)</option>
                        <option value="110%">Large (110%)</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Interactive instruction guidelines */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 text-center font-medium">
            🚩 <strong>A4 Page Print Optimized:</strong> This visual layout is fine-scaled to fit completely on a single A4 page for high-quality Indian Tax invoice output.
          </div>

          {/* Actual Invoice Sheet (The exact A4 Layout print area) */}
          <div 
            id="print-area" 
            className={`border border-slate-300/80 shadow-2xl rounded-2xl mx-auto relative transition-colors duration-200 overflow-hidden ${
              isPreviewDarkMode ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-slate-300'
            }`}
            style={{ 
              width: '210mm',
              minHeight: '297mm'
            }}
          >
                <style dangerouslySetInnerHTML={{ __html: `
                  #print-area {
                    font-family: "${invoiceStyle.fontFamily || 'Inter'}", system-ui, -apple-system, sans-serif !important;
                    box-sizing: border-box !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  #print-area * {
                    box-sizing: border-box !important;
                  }
                  @media print {
                    @page {
                      size: A4 portrait !important;
                      margin: 0 !important;
                    }
                    body * {
                      visibility: hidden !important;
                    }
                    #print-area, #print-area * {
                      visibility: visible !important;
                    }
                    #print-area {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 210mm !important;
                      height: 297mm !important;
                      min-height: 297mm !important;
                      max-width: 210mm !important;
                      max-height: 297mm !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      box-shadow: none !important;
                      border: none !important;
                      border-radius: 0 !important;
                      transform: none !important;
                      background: white !important;
                      color: black !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                  }
                ` }} />
                <A4InvoicePrintLayout
                  invoice={viewingInvoice!}
                  companySettings={companySettings}
                  invoiceStyle={invoiceStyle}
                  showBankInPrint={showBankInPrint}
                  showProdDescInPrint={showProdDescInPrint}
                  customProductDesc={customProductDesc}
                  isPreviewDarkMode={isPreviewDarkMode}
                  contacts={contacts}
                />
          </div>

          {/* Hidden legacy print area section to avoid layout matching issues */}
          <div style={{ display: 'none' }}>
                <style dangerouslySetInnerHTML={{ __html: `
                  #print-area {
                    font-family: "${invoiceStyle.fontFamily || 'Inter'}", system-ui, -apple-system, sans-serif !important;
                    font-size: ${invoiceStyle.fontSizeMultiplier === '90%' ? '0.90em' : invoiceStyle.fontSizeMultiplier === '110%' ? '1.10em' : '1em'} !important;
                    box-sizing: border-box !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  #print-area * {
                    box-sizing: border-box !important;
                  }
                  #print-area .border, 
                  #print-area .border-t, 
                  #print-area .border-b, 
                  #print-area .border-y, 
                  #print-area .border-x, 
                  #print-area .border-r, 
                  #print-area .border-l,
                  #print-area [class*="border"] {
                    border-color: ${getLineColor()} !important;
                    border-style: ${getLineStyle()} !important;
                    border-width: ${getLineThickness()} !important;
                  }
                  #print-area .border-y {
                    border-top-width: ${getLineThickness()} !important;
                    border-bottom-width: ${getLineThickness()} !important;
                  }
                  #print-area .border-t {
                    border-top-width: ${getLineThickness()} !important;
                  }
                  #print-area .border-b {
                    border-bottom-width: ${getLineThickness()} !important;
                  }
                  #print-area .border-r {
                    border-right-width: ${getLineThickness()} !important;
                  }
                  #print-area .border-l {
                    border-left-width: ${getLineThickness()} !important;
                  }
                  #print-area .border {
                    border-width: ${getLineThickness()} !important;
                  }

                  #print-area table {
                    border-collapse: collapse !important;
                  }
                  #print-area table tr {
                    border-bottom-width: ${getLineThickness()} !important;
                    border-bottom-color: ${getLineColor()} !important;
                    border-bottom-style: ${getLineStyle()} !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                  #print-area table th, #print-area table td {
                    border-right-width: ${getLineThickness()} !important;
                    border-right-color: ${getLineColor()} !important;
                    border-right-style: ${getLineStyle()} !important;
                  }
                  #print-area table th:last-child, #print-area table td:last-child {
                    border-right: none !important;
                  }

                  #print-area [class*="border"] {
                    border-color: ${getLineColor()} !important;
                    border-style: ${getLineStyle()} !important;
                  }
                  #print-area [class*="divide"] > * + * {
                    border-color: ${getLineColor()} !important;
                    border-style: ${getLineStyle()} !important;
                  }

                  #print-area .bg-black {
                    background-color: ${getLineStyle() === 'solid' ? getLineColor() : 'transparent'} !important;
                    border-left: ${getLineStyle() === 'dashed' || getLineStyle() === 'dotted' ? `${getLineThickness()} ${getLineStyle()} ${getLineColor()}` : 'none'} !important;
                    width: ${getLineStyle() === 'dashed' || getLineStyle() === 'dotted' ? '0px' : getLineThickness()} !important;
                  }

                  #print-area p, 
                  #print-area span:not(.font-mono), 
                  #print-area div:not(.bg-black):not(.no-case-transform), 
                  #print-area td:not(.font-mono), 
                  #print-area th {
                    text-transform: ${invoiceStyle.textCase === 'uppercase' ? 'uppercase' : 'none'} !important;
                  }
                  #print-area .logo-container {
                    order: ${invoiceStyle.logoPosition === 'left' ? -1 : 1} !important;
                  }

                  @media print {
                    @page {
                      size: A4 portrait !important;
                      margin: 0 !important;
                    }
                    body * {
                      visibility: hidden !important;
                    }
                    #print-area, #print-area * {
                      visibility: visible !important;
                    }
                    #print-area {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 210mm !important;
                      height: 297mm !important;
                      min-height: 297mm !important;
                      max-width: 210mm !important;
                      max-height: 297mm !important;
                      margin: 0 !important;
                      padding: 10mm !important;
                      box-shadow: none !important;
                      border: none !important;
                      border-radius: 0 !important;
                      transform: none !important;
                      background: white !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                  }
                ` }} />
                <div>
              {invoiceStyle.themeName === "Commercial Green Corporate" ? (
                <CommercialGreenCorporateInvoice
                  invoice={viewingInvoice!}
                  companySettings={companySettings}
                  showProdDescInPrint={showProdDescInPrint}
                  showBankInPrint={showBankInPrint}
                />
              ) : invoiceStyle.themeName === "Modern Premium Corporate" ? (
                <ModernPremiumCorporateInvoice 
                  invoice={viewingInvoice!} 
                  companySettings={companySettings} 
                  showProdDescInPrint={showProdDescInPrint} 
                  showBankInPrint={showBankInPrint} 
                />
              ) : invoiceStyle.themeName === "AI-Generated Theme Format Style" ? (
                /* --- AI-GENERATED MODERN THEME FORMAT STYLE --- */
                <div>
                  <div 
                    className="flex justify-between items-center p-6 rounded-2xl mb-4 text-white relative overflow-hidden"
                    style={{ backgroundColor: invoiceStyle.primaryColor || '#6366f1' }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 z-0"></div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-white/25 text-white mb-2 font-mono">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" /> AI-SYSTEM VERIFIED SECURE GST RECORD
                      </div>
                      <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
                        TAX INVOICE
                      </h1>
                      <p className="text-[12px] font-black uppercase tracking-widest mt-1.5 opacity-90">
                        {companySettings.companyName}
                      </p>
                    </div>
                    {/* Brand Emblem Logo block */}
                    <div className="flex items-center gap-3 relative z-10 bg-white/15 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Cpu className="h-5 w-5 text-indigo-200 animate-pulse" />
                      </div>
                      <div className="text-left select-none">
                        <p className="text-[9px] font-extrabold tracking-widest leading-tight uppercase text-white">INTELLIGENT</p>
                        <p className="text-[8px] font-semibold tracking-wider opacity-75 text-white uppercase">RECORDS</p>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Meta Row (A4 Grid spacing) */}
                  <div className="grid grid-cols-4 border border-solid border-slate-200 rounded-xl p-3 mb-4 text-center text-[10px] font-extrabold uppercase tracking-tight text-slate-800 bg-slate-50">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 mb-0.5">INVOICE NO</span>
                      <span className="text-slate-900 font-black text-[10px]">{viewingInvoice!.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 mb-0.5">DATE OF SUPPLY</span>
                      <span className="text-slate-900 font-black text-[10px]">{viewingInvoice!.date}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 mb-0.5">STATE OF SUPPLY</span>
                      <span className="text-slate-900 font-black text-[10px]">{viewingInvoice!.stateOfSupply || "19 West Bengal"}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 mb-0.5">GRAND TOTAL</span>
                      <span className="text-[11px] font-black" style={{ color: invoiceStyle.primaryColor }}>
                        ₹{viewingInvoice!.grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bill-To & Bill-From Structured Columns side-by-side */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-xl text-[10px] border border-solid border-slate-200 bg-white shadow-sm">
                      <h3 className="font-extrabold uppercase text-[9px] tracking-wider mb-2" style={{ color: invoiceStyle.primaryColor }}>BILL TO RECEIVER:</h3>
                      <p className="font-black text-[11px] uppercase text-slate-900 leading-tight">
                        {viewingInvoice!.contactName ? `BFL A/C ${viewingInvoice!.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
                      </p>
                      <p className="font-semibold text-slate-600 leading-snug mt-1">{viewingInvoice!.contactAddress}</p>
                      <div className="mt-3 space-y-1 text-[9px] font-bold text-slate-500 border-t pt-2 border-slate-100">
                        {viewingInvoice!.contactMobile && <p>PHONE: <span className="text-slate-800">{viewingInvoice!.contactMobile}</span></p>}
                        {viewingInvoice!.contactGstin && <p>GSTIN/UIN: <span className="text-slate-800">{viewingInvoice!.contactGstin}</span></p>}
                        <p>STATE: <span className="text-slate-800">{viewingInvoice!.stateOfSupply || "19 West Bengal"}</span></p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl text-[10px] border border-solid border-slate-200 bg-white shadow-sm">
                      <h3 className="font-extrabold uppercase text-[9px] tracking-wider mb-2" style={{ color: invoiceStyle.primaryColor }}>BILL FROM SENDER:</h3>
                      <p className="font-black text-[11px] uppercase text-slate-900 leading-tight">
                        {companySettings.companyName.toUpperCase()}
                      </p>
                      <p className="font-semibold text-slate-600 leading-snug mt-1">{companySettings.address}</p>
                      <div className="mt-3 space-y-1 text-[9px] font-bold text-slate-500 border-t pt-2 border-slate-100">
                        <p>PHONE: <span className="text-slate-800">{companySettings.phone}</span></p>
                        {companySettings.email && <p>E-MAIL: <span className="text-slate-800">{companySettings.email}</span></p>}
                        <p>GSTIN: <span className="text-slate-800">{companySettings.gstin}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : invoiceStyle.themeName === "Mint Landscape Creations" ? (
                /* --- MINT LANDSCAPE CREATIONS THEME --- */
                <div>
                  <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-dashed border-teal-600">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[8px] font-extrabold uppercase tracking-widest mb-1.5">
                        🌿 MINT COMPLIANT INVOICE
                      </div>
                      <h1 className="text-3xl font-black text-teal-800 uppercase tracking-tight">
                        TAX INVOICE
                      </h1>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                        Original Copy for Recipient
                      </p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-extrabold text-teal-950 uppercase">{companySettings.companyName}</h2>
                      <p className="text-[9px] text-slate-600 uppercase font-semibold leading-tight mt-1 max-w-[250px]">
                        {companySettings.address}
                      </p>
                      <p className="text-[9px] text-teal-700 font-bold mt-1">
                        GSTIN: {companySettings.gstin} | PH: {companySettings.phone}
                      </p>
                    </div>
                  </div>

                  {/* Meta box */}
                  <div className="grid grid-cols-4 border border-teal-100 rounded-lg p-2.5 mb-4 text-center text-[9px] font-bold uppercase tracking-tight text-slate-700 bg-teal-50/30">
                    <div>
                      <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">INVOICE NUMBER</span>
                      <span className="text-slate-900 font-black">{viewingInvoice!.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">DATE OF INVOICE</span>
                      <span className="text-slate-900 font-black">{viewingInvoice!.date}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">STATE OF SUPPLY</span>
                      <span className="text-slate-900 font-black">{viewingInvoice!.stateOfSupply || "19 West Bengal"}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">TOTAL DUE</span>
                      <span className="text-teal-800 font-black">₹{viewingInvoice!.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Billed info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3.5 rounded-lg text-[9px] border border-teal-100 bg-white">
                      <h3 className="font-extrabold uppercase text-[8px] tracking-wider mb-1 text-teal-700">CLIENT / RECEIVER:</h3>
                      <p className="font-black text-[10px] uppercase text-slate-900 leading-tight">
                        {viewingInvoice!.contactName ? `BFL A/C ${viewingInvoice!.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
                      </p>
                      <p className="font-medium text-slate-600 mt-1 leading-relaxed">{viewingInvoice!.contactAddress}</p>
                      <div className="mt-2 space-y-0.5 text-[8.5px] font-bold text-slate-500">
                        {viewingInvoice!.contactMobile && <p>PHONE: <span className="text-slate-800">{viewingInvoice!.contactMobile}</span></p>}
                        {viewingInvoice!.contactGstin && <p>GSTIN: <span className="text-slate-800">{viewingInvoice!.contactGstin}</span></p>}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-lg text-[9px] border border-teal-100 bg-white">
                      <h3 className="font-extrabold uppercase text-[8px] tracking-wider mb-1 text-teal-700">SUPPLIER / SENDER:</h3>
                      <p className="font-black text-[10px] uppercase text-slate-900 leading-tight">
                        {companySettings.companyName.toUpperCase()}
                      </p>
                      <p className="font-medium text-slate-600 mt-1 leading-relaxed">{companySettings.address}</p>
                      <div className="mt-2 space-y-0.5 text-[8.5px] font-bold text-slate-500">
                        <p>PHONE: <span className="text-slate-800">{companySettings.phone}</span></p>
                        {companySettings.email && <p>EMAIL: <span className="text-slate-800">{companySettings.email}</span></p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : invoiceStyle.themeName === "Gujarat Freight Tools Layout" ? (
                /* --- GUJARAT FREIGHT TOOLS LAYOUT --- */
                <div>
                  <div className="border-4 border-solid border-amber-600 p-4 mb-4 bg-white relative">
                    <div className="absolute top-2 right-2 text-[8px] font-black tracking-widest text-amber-600 border border-amber-600 px-1 py-0.5 uppercase">
                      GUJARAT FREIGHT REGISTERED
                    </div>
                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-extrabold text-amber-700 tracking-widest uppercase block">
                        ⚙️ HEAVY INDUSTRIAL & FREIGHT LEDGER BILL ⚙️
                      </span>
                      <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight leading-none">
                        {companySettings.companyName}
                      </h1>
                      <p className="text-[9px] text-slate-600 font-extrabold uppercase max-w-[500px] mx-auto leading-tight">
                        {companySettings.address}
                      </p>
                      <p className="text-[9.5px] font-black text-slate-900">
                        GSTIN: {companySettings.gstin} | CONTACT PHONE: {companySettings.phone}
                      </p>
                    </div>
                  </div>

                  {/* Horizontal Meta Row (Freight Bold Grid) */}
                  <div className="grid grid-cols-4 border-2 border-solid border-slate-900 mb-4 text-center text-[9px] font-extrabold uppercase tracking-tight text-slate-900 bg-amber-50 divide-x divide-solid divide-slate-900">
                    <div className="p-1.5">
                      <span className="block text-[7.5px] font-black text-slate-500">BILL NO.</span>
                      <span className="text-slate-950 font-black text-[10px]">{viewingInvoice!.invoiceNumber}</span>
                    </div>
                    <div className="p-1.5">
                      <span className="block text-[7.5px] font-black text-slate-500">BILL DATE</span>
                      <span className="text-slate-950 font-black text-[10px]">{viewingInvoice!.date}</span>
                    </div>
                    <div className="p-1.5">
                      <span className="block text-[7.5px] font-black text-slate-500">PLACE OF SUPPLY</span>
                      <span className="text-slate-950 font-black text-[10px]">{viewingInvoice!.stateOfSupply || "19 West Bengal"}</span>
                    </div>
                    <div className="p-1.5">
                      <span className="block text-[7.5px] font-black text-slate-500">TOTAL GST PAYABLE</span>
                      <span className="text-amber-750 font-black text-[10.5px]">₹{viewingInvoice!.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Billed details in traditional freight grid */}
                  <div className="grid grid-cols-2 border border-solid border-slate-900 mb-4 divide-x divide-solid divide-slate-900 bg-white">
                    <div className="p-3 text-[9.5px]">
                      <span className="block text-[8px] font-black text-amber-700 tracking-wider mb-1.5 uppercase">
                        CONSIGNEE / BILLED TO RECEIVER:
                      </span>
                      <p className="font-black text-[11px] uppercase text-slate-950">
                        {viewingInvoice!.contactName ? `BFL A/C ${viewingInvoice!.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
                      </p>
                      <p className="font-semibold text-slate-700 mt-1 leading-snug">{viewingInvoice!.contactAddress}</p>
                      <div className="mt-3 space-y-0.5 border-t border-dashed border-slate-200 pt-2 font-bold text-slate-600">
                        {viewingInvoice!.contactMobile && <p>CONSIGNEE TEL: <span className="text-slate-900">{viewingInvoice!.contactMobile}</span></p>}
                        {viewingInvoice!.contactGstin && <p>CONSIGNEE GSTIN: <span className="text-slate-900">{viewingInvoice!.contactGstin}</span></p>}
                      </div>
                    </div>
                    <div className="p-3 text-[9.5px]">
                      <span className="block text-[8px] font-black text-amber-700 tracking-wider mb-1.5 uppercase">
                        CONSIGNOR / BILLED FROM SENDER:
                      </span>
                      <p className="font-black text-[11px] uppercase text-slate-950">
                        {companySettings.companyName.toUpperCase()}
                      </p>
                      <p className="font-semibold text-slate-700 mt-1 leading-snug">{companySettings.address}</p>
                      <div className="mt-3 space-y-0.5 border-t border-dashed border-slate-200 pt-2 font-bold text-slate-600">
                        <p>TEL: <span className="text-slate-900">{companySettings.phone}</span></p>
                        {companySettings.email && <p>EMAIL: <span className="text-slate-900">{companySettings.email}</span></p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* --- CLASSIC THEME FORMAT STYLE (ELEGANT BUSINESS TRADITIONAL) --- */
                <>
                  <div className="text-center pb-2 mb-2">
                    <h1 
                      className="text-3xl font-black tracking-tighter uppercase leading-tight"
                      style={{ color: invoiceStyle.primaryColor || '#000000' }}
                    >
                      {companySettings.companyName}
                    </h1>
                    <p className="text-[10px] font-bold text-black uppercase">{companySettings.address}</p>
                    <div className="text-[10px] font-bold text-black uppercase mt-0.5">
                      PH. : {companySettings.phone} 
                      {companySettings.email && ` | E-Mail : ${companySettings.email}`}
                    </div>
                    <div className="text-[10px] font-bold text-black uppercase mt-0.5">
                      GSTIN : {companySettings.gstin}   STATE : 19 West Bengal
                    </div>
                  </div>

                  {/* TAX INVOICE heading */}
                  <div 
                    className="flex justify-between items-center text-[11px] font-bold pb-1 pt-1 mb-2 border-y border-solid border-black"
                    style={{ 
                      backgroundColor: invoiceStyle.tableHeaderBg || '#f1f5f9',
                      color: invoiceStyle.tableHeaderTextColor || '#000000'
                    }}
                  >
                    <div className="flex-1 text-center font-black uppercase text-[12px] tracking-wide ml-[20%]">
                      TAX INVOICE 
                    </div>
                    <div className="text-right whitespace-nowrap text-[10px] uppercase pr-2">
                      ORIGINAL For Recipient
                    </div>
                  </div>

                  {/* Invoice Meta and Party Details */}
                  <div className="flex border-b border-solid border-black pb-2 mb-2 min-h-[140px]">
                    {/* Billed To Left Side */}
                    <div className="flex-1 space-y-0.5 pr-2 border-r border-solid border-black text-[10px]">
                      <p className="uppercase text-black">
                         {viewingInvoice!.contactName && <span className="font-bold">BFL A/C {viewingInvoice!.contactName}</span>}
                      </p>
                      <p className="uppercase text-black mt-0.5 leading-snug">{viewingInvoice!.contactAddress}</p>
                      
                      <div className="pt-4">
                        <p className="uppercase">PH. : {viewingInvoice!.contactMobile}</p>
                        <p className="uppercase">GSTIN/UIN : {viewingInvoice!.contactGstin}</p>
                        <p className="uppercase mt-0.5 font-bold flex">
                           <span className="w-[80px] font-normal">STATE</span> 
                           <span>: {viewingInvoice!.stateOfSupply || "19 West Bengal"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Invoice details */}
                    <div className="w-[45%] text-[10px] uppercase font-bold pl-4 pt-1">
                      <div className="flex">
                        <span className="w-[100px]">Invoice No</span>
                        <span>: {viewingInvoice!.invoiceNumber}</span>
                      </div>
                      <div className="flex mt-1">
                        <span className="w-[100px]">Invoice Date</span>
                        <span>: {viewingInvoice!.date}</span>
                      </div>
                      <div className="flex mt-1">
                        <span className="w-[100px]">Due Date</span>
                        <span>: {viewingInvoice!.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Product Layout Table */}
              <div className="border border-solid border-black overflow-hidden mb-0 text-[10px] border-b-0 min-h-[300px] relative">
                {/* Absolute vertical divider lines to ensure they run continuously to the bottom of the table */}
                <>
                  <div className="absolute inset-y-0 left-[5%] w-[1px] bg-black pointer-events-none z-0"></div>
                  <div className="absolute inset-y-0 left-[15%] w-[1px] bg-black pointer-events-none z-0"></div>
                  <div className="absolute inset-y-0 left-[57%] w-[1px] bg-black pointer-events-none z-0"></div>
                  <div className="absolute inset-y-0 left-[65%] w-[1px] bg-black pointer-events-none z-0"></div>
                  <div className="absolute inset-y-0 left-[72%] w-[1px] bg-black pointer-events-none z-0"></div>
                  <div className="absolute inset-y-0 left-[82%] w-[1px] bg-black pointer-events-none z-0"></div>
                  <div className="absolute inset-y-0 left-[89%] w-[1px] bg-black pointer-events-none z-0"></div>
                  <div className="absolute inset-y-0 left-[96%] w-[1px] bg-black pointer-events-none z-0"></div>
                </>

                <table className="w-full text-left table-fixed relative z-10 bg-transparent">
                  <thead 
                    className="font-bold uppercase border-b border-solid border-black text-[10px] relative z-10"
                    style={{ 
                      backgroundColor: invoiceStyle.tableHeaderBg || '#f1f5f9',
                      color: invoiceStyle.tableHeaderTextColor || '#000000'
                    }}
                  >
                    <tr className="divide-x divide-solid divide-black">
                      <th className="px-1 py-1.5 w-[5%] text-center">Sr<br/>No</th>
                      <th className="px-1 py-1.5 w-[10%] text-center">HSN<br/>SAC</th>
                      <th className="px-2 py-1.5 w-[42%] text-center border-b-0">Product Description</th>
                      <th className="px-1 py-1.5 w-[8%] text-center">Qty</th>
                      <th className="px-1 py-1.5 w-[7%] text-center">Unit</th>
                      <th className="px-1 py-1.5 w-[10%] text-center">Rate</th>
                      <th className="px-1 py-1.5 w-[7%] text-center">SGST<br/>%</th>
                      <th className="px-1 py-1.5 w-[7%] text-center">CGST<br/>%</th>
                      <th className="px-2 py-1.5 w-[13%] text-center">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-black align-top font-bold">
                    {viewingInvoice!.items.map((item, index) => {
                      const cgstRate = (item.gstRate || 18) / 2;
                      return (
                        <tr key={index} className="divide-x divide-solid divide-black">
                          <td className="px-1 text-center py-2 font-normal text-[9px]">{index + 1}</td>
                          <td className="px-1 text-center py-2 font-normal text-[9px]">{item.hsnCode || '84151010'}</td>
                          <td className="px-2 uppercase py-2 text-[10px]">
                            {item.productName}
                            {item.productModel && <span className="block mt-0.5">{item.productModel}</span>}
                            {item.serialNumber && <span className="block font-normal mt-0.5">SL NO-{item.serialNumber}</span>}
                            {item.description && (
                              <div className="font-normal whitespace-pre-line mt-0.5 pt-1">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="px-1 text-right py-2 font-normal">{item.quantity.toFixed(3)}</td>
                          <td className="px-1 text-left pl-1 py-2 font-normal uppercase">{item.unit || 'Pcs'}</td>
                          <td className="px-1 text-right py-2 font-normal">{item.rate.toFixed(2)}</td>
                          <td className="px-1 text-center py-2 font-normal">{cgstRate}</td>
                          <td className="px-1 text-center py-2 font-normal">{cgstRate}</td>
                          <td className="px-2 text-right py-2 font-normal">{item.total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-solid border-black relative z-10 bg-white">
                     <tr className="divide-x divide-solid divide-black h-8 text-[11px] font-bold">
                        <td colSpan={3} className="px-1 border-r border-solid border-black text-right pr-2"></td>
                        <td className="px-1 text-right font-normal">{(viewingInvoice!.items.reduce((s,i) => s + i.quantity, 0)).toFixed(3)}</td>
                        <td colSpan={4} className="border-r border-solid border-black"></td>
                        <td className="px-2 text-right font-bold">{viewingInvoice!.subtotal.toFixed(2)}</td>
                     </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Table footer with totals and sub footer */}
              <div className="border border-solid border-black flex border-t-0 text-[10px]">
                {/* Tax Breakdown Matrix */}
                <div className="flex w-full">
                  {/* Left Side: Detail Tax */}
                  <div className="flex-1 p-2 border-r border-solid border-black flex flex-col justify-between bg-white">
                    <div>
                      <div className="flex font-normal w-[80%] text-[10px] uppercase pb-1 border-b border-solid border-black">
                        <div className="w-[20%] text-center">GST%</div>
                        <div className="w-[30%] text-center">TAXABLE AMT</div>
                        <div className="w-[25%] text-center">SGST</div>
                        <div className="w-[25%] text-center">CGST</div>
                      </div>
                      <div className="flex w-[80%] text-[10px] items-center pt-1 font-normal">
                        <div className="w-[20%] text-center">18.00%</div>
                        <div className="w-[30%] text-center whitespace-nowrap">of {viewingInvoice!.subtotal.toFixed(2)}=</div>
                        <div className="w-[25%] text-right">{viewingInvoice!.totalSgst.toFixed(2)}+</div>
                        <div className="w-[25%] text-right">{viewingInvoice!.totalCgst.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-8 border-t border-solid border-black pt-1">
                      <div className="flex font-normal w-[80%] text-[10px]">
                        <div className="w-[20%] uppercase text-left">TOTAL</div>
                        <div className="w-[30%] text-right">{viewingInvoice!.subtotal.toFixed(2)}</div>
                        <div className="w-[25%] text-right">{viewingInvoice!.totalSgst.toFixed(2)}</div>
                        <div className="w-[25%] text-right">{viewingInvoice!.totalCgst.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side summary amounts */}
                  <div className="w-[35%] text-[10px] uppercase font-normal relative border-l border-solid border-transparent bg-white">
                    <div className="flex font-normal">
                       <span className="w-[45%] pl-1 border-r border-solid border-black h-5 flex items-center">CGST</span>
                       <span className="w-[55%] text-right pr-2 h-5 flex items-center justify-end">{viewingInvoice!.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex font-normal">
                       <span className="w-[45%] pl-1 border-r border-solid border-black h-5 flex items-center">SGST</span>
                       <span className="w-[55%] text-right pr-2 h-5 flex items-center justify-end">{viewingInvoice!.totalSgst.toFixed(2)}</span>
                    </div>

                    {/* Gap filler */}
                    <div className="flex flex-col h-14 mt-4">
                       <div className="flex border-t border-solid border-black h-6 border-b border-solid border-black">
                         <span className="w-[45%] pl-1 border-r border-solid border-black flex items-center">Round Off</span>
                         <span className="w-[55%] text-right pr-2 flex items-center justify-end">
                            {viewingInvoice!.totalDiscount > 0 ? `-${viewingInvoice!.totalDiscount.toFixed(2)}` : '0.00'}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bank / Net Amt Bottom */}
              <div className="flex border border-solid border-t-0 border-black mb-2 h-16 bg-white">
                <div className="flex-1 p-1.5 pl-2 font-bold text-[9px] uppercase border-r border-solid border-black flex flex-col justify-center leading-tight">
                   {companySettings.bankName && <p>{companySettings.bankName}, BRANCH {companySettings.tagline || ''}</p>}
                   <p>A/C NO.{companySettings.accountNumber}, IFSC CODE-{companySettings.ifscCode}</p>
                   {companySettings.upiId && <p className="text-orange-650 font-extrabold">UPI ID: {companySettings.upiId}</p>}
                </div>
                {companySettings.upiId && (
                  <div className="w-[18%] p-1 border-r border-solid border-black flex flex-col items-center justify-center bg-slate-50/50">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        `upi://pay?pa=${companySettings.upiId}&pn=${encodeURIComponent(companySettings.companyName)}&am=${viewingInvoice!.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${viewingInvoice!.invoiceNumber}`)}&cu=INR`
                      )}`}
                      alt="UPI QR Code"
                      className="h-10 w-10 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[6.5px] font-black tracking-tighter text-slate-900 mt-0.5">SCAN TO PAY</span>
                  </div>
                )}
                <div 
                  className="w-[35%] flex items-center justify-between pl-2 pr-2 font-black text-[11px] uppercase"
                  style={{ 
                    backgroundColor: invoiceStyle.tableHeaderBg || '#f1f5f9',
                    color: invoiceStyle.tableHeaderTextColor || '#000000'
                  }}
                >
                  <span>NET AMOUNT</span>
                  <span>{viewingInvoice!.grandTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>

            <div className="border border-solid border-black p-1.5 font-bold text-[11px] uppercase mt-2 mb-2 px-2 bg-white">
                [In Words] : {(() => {
                  const toWords = (num: number) => {
                     return "Rupees " + (num < 10000 ? "Several Thousand Rupees Only" : "Twenty Thousand Plus Only");
                  }; 
                  return toWords(viewingInvoice!.grandTotal);
                })()}
            </div>

            {/* Print Footer / Terms & Conditions */}
            <div className="border border-solid border-black pt-1 px-2 pb-14 relative overflow-visible mt-2 bg-white">
               <div className="text-[9px] uppercase space-y-[2px] opacity-90 max-w-[70%] font-normal text-black">
                  <p>(1) We are not responsible for any Breakage/Damage/Shortage/Leakage in transit.</p>
                  <p>(2) Our responsibility ceases when the goods are delivered to the carrier.</p>
                  <p>(3) Goods once sold will not be accepted back.</p>
                  <p className="leading-[1.1]">(4) It is hear by inform that {companySettings.companyName} is a marketing & distribution co. <br/>
                  & is not a mfg., the product in this Inv. are covered by manufacturer strandered warrenty, we have no <br/>
                  leagle/finacinal liability for the same.</p>
                  <p>(5) All subject to kolkata judrcction.</p>
               </div>
               
               {/* Stamp & Signatory Wrapper positioned precisely at the bottom right */}
               <div className="absolute top-1 right-2 w-[240px] h-[calc(100%-8px)] flex flex-col items-end justify-between font-bold">
                  <span className="text-[10px] text-black font-normal mr-2">E & O E</span>
                  
                  <div className="relative text-black w-full flex flex-col items-end text-right pr-2">
                     <div className="h-16 w-full"></div>
                     
                     <div className="text-[10px] relative z-10 w-full text-right uppercase tracking-widest font-normal text-black font-sans border-t border-black/20 pt-1">
                        AUTHORISED SIGNATORY
                     </div>
                  </div>
               </div>
            </div>

            <div className="text-left text-[9px] text-slate-500 pt-1 font-normal ml-1">
              Generated from EXPERT Accounting Software
            </div>
          </div>
        </div>
      )}

      {preFinalizeInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center items-start">
          <div className="bg-slate-100 rounded-3xl p-5 sm:p-6 border border-slate-200/80 max-w-4xl w-full shadow-2xl space-y-6 my-4">
            
            {/* Modal Header & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
              <div className="space-y-1">
                <span className="bg-emerald-50 text-emerald-850 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-100">
                  Live Draft Preview
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Verify Print-Ready A4 Layout
                </h3>
              </div>

              {/* Dynamic Theme Adjuster right inside modal! */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Apply Theme:</span>
                  <select
                    value={invoiceStyle.themeName}
                    onChange={(e) => {
                      const found = presetThemes.find(t => t.themeName === e.target.value);
                      if (found) {
                        applyPreset(found);
                      }
                    }}
                    className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {presetThemes.map(t => (
                      <option key={t.themeName} value={t.themeName}>
                        {t.themeName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Print Draft/PDF download directly from preview */}
                <button
                  type="button"
                  disabled={isPrinting}
                  onClick={() => printSnapshotPdf(preFinalizeInvoice)}
                  className={`px-3.5 py-1.5 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    isPrinting 
                      ? 'bg-slate-850 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-950 hover:bg-slate-900 text-white'
                  }`}
                >
                  {isPrinting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  ) : (
                    <Printer className="h-4 w-4 text-emerald-400" />
                  )}
                  {isPrinting ? 'Preparing...' : 'Print'}
                </button>

                <button
                  type="button"
                  onClick={() => commitPreFinalizeSave()}
                  className="px-4 py-1.5 text-white font-extrabold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: invoiceStyle.primaryColor || '#0f5146' }}
                >
                  <Check className="h-4 w-4" /> Save & Finalize Invoice
                </button>

                <button
                  type="button"
                  onClick={() => setPreFinalizeInvoice(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Edit
                </button>
              </div>
            </div>

            {/* Layout options control block */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">Layout Controls:</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1 rounded-xl cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showBankInPrint} 
                    onChange={(e) => {
                      setShowBankInPrint(e.target.checked);
                      localStorage.setItem('vyapar_show_bank_in_print', String(e.target.checked));
                      if (e.target.checked) {
                        setShowProdDescInPrint(false);
                        localStorage.setItem('vyapar_show_prod_desc_in_print', 'false');
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span className="text-[10px] font-bold text-slate-700">Bank Details</span>
                </label>

                <label className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1 rounded-xl cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showProdDescInPrint} 
                    onChange={(e) => {
                      setShowProdDescInPrint(e.target.checked);
                      localStorage.setItem('vyapar_show_prod_desc_in_print', String(e.target.checked));
                      if (e.target.checked) {
                        setShowBankInPrint(false);
                        localStorage.setItem('vyapar_show_bank_in_print', 'false');
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span className="text-[10px] font-bold text-slate-700">Product Description</span>
                </label>

                {showProdDescInPrint && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-400">Edit Text:</span>
                    <input
                      type="text"
                      value={customProductDesc}
                      onChange={(e) => {
                        setCustomProductDesc(e.target.value);
                        localStorage.setItem('vyapar_custom_prod_desc', e.target.value);
                      }}
                      className="px-2 py-0.5 text-[10px] border border-slate-200 bg-slate-50 rounded-lg focus:outline-none w-48"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Generator Collapsible Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowQRGenerator(!showQRGenerator)}
                className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between font-bold text-slate-800 text-xs uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  📱 Instant UPI QR Code Generator & Pay Hub (Draft Live Test)
                </span>
                <span className="text-slate-400 font-black">{showQRGenerator ? "▲ Hide Generator" : "▼ Show Generator"}</span>
              </button>

              {showQRGenerator && (
                <div className="p-4 border-t border-slate-150 bg-slate-50/20">
                  <QRCodeGenerator 
                    invoice={preFinalizeInvoice!} 
                    companySettings={companySettings} 
                  />
                </div>
              )}
            </div>

            {/* A4 Sheet Preview wrapper container */}
            <div className="overflow-auto max-h-[70vh] border border-slate-350 shadow-inner rounded-2xl bg-slate-300 p-4 sm:p-6 flex justify-center">
              <div 
                id="print-area-preview" 
                className={`shadow-2xl relative scale-90 md:scale-100 origin-top animate-fadeIn rounded-2xl overflow-hidden transition-colors duration-200 ${
                  isPreviewDarkMode ? 'bg-slate-900 text-slate-100 border border-slate-700/80 shadow-slate-950/20' : 'bg-white text-slate-950'
                }`}
                style={{ 
                  width: '210mm',
                  minHeight: '297mm'
                }}
              >
                    <style dangerouslySetInnerHTML={{ __html: `
                      #print-area-preview {
                        font-family: "${invoiceStyle.fontFamily || 'Inter'}", system-ui, -apple-system, sans-serif !important;
                        box-sizing: border-box !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      #print-area-preview * {
                        box-sizing: border-box !important;
                      }
                    ` }} />
                    <A4InvoicePrintLayout
                      invoice={preFinalizeInvoice!}
                      companySettings={companySettings}
                      invoiceStyle={invoiceStyle}
                      showBankInPrint={showBankInPrint}
                      showProdDescInPrint={showProdDescInPrint}
                      customProductDesc={customProductDesc}
                      isPreviewDarkMode={isPreviewDarkMode}
                      contacts={contacts}
                    />
              </div>

              {/* Hidden legacy preview print area section to avoid layout matching issues */}
              <div style={{ display: 'none' }}>
                    <style dangerouslySetInnerHTML={{ __html: `
                      #print-area-preview {
                        font-family: "${invoiceStyle.fontFamily || 'Inter'}", system-ui, -apple-system, sans-serif !important;
                        font-size: ${invoiceStyle.fontSizeMultiplier === '90%' ? '0.90em' : invoiceStyle.fontSizeMultiplier === '110%' ? '1.10em' : '1em'} !important;
                        box-sizing: border-box !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      #print-area-preview * {
                        box-sizing: border-box !important;
                      }
                      #print-area-preview .border, 
                      #print-area-preview .border-t, 
                      #print-area-preview .border-b, 
                      #print-area-preview .border-y, 
                      #print-area-preview .border-x, 
                      #print-area-preview .border-r, 
                      #print-area-preview .border-l,
                      #print-area-preview [class*="border"] {
                        border-color: ${getLineColor()} !important;
                        border-style: ${getLineStyle()} !important;
                        border-width: ${getLineThickness()} !important;
                      }
                      #print-area-preview .border-y {
                        border-top-width: ${getLineThickness()} !important;
                        border-bottom-width: ${getLineThickness()} !important;
                      }
                      #print-area-preview .border-t {
                        border-top-width: ${getLineThickness()} !important;
                      }
                      #print-area-preview .border-b {
                        border-bottom-width: ${getLineThickness()} !important;
                      }
                      #print-area-preview .border-r {
                        border-right-width: ${getLineThickness()} !important;
                      }
                      #print-area-preview .border-l {
                        border-left-width: ${getLineThickness()} !important;
                      }
                      #print-area-preview .border {
                        border-width: ${getLineThickness()} !important;
                      }

                      #print-area-preview table {
                        border-collapse: collapse !important;
                      }
                      #print-area-preview table tr {
                        border-bottom-width: ${getLineThickness()} !important;
                        border-bottom-color: ${getLineColor()} !important;
                        border-bottom-style: ${getLineStyle()} !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                      }
                      #print-area-preview table th, #print-area-preview table td {
                        border-right-width: ${getLineThickness()} !important;
                        border-right-color: ${getLineColor()} !important;
                        border-right-style: ${getLineStyle()} !important;
                      }
                      #print-area-preview table th:last-child, #print-area-preview table td:last-child {
                        border-right: none !important;
                      }

                      #print-area-preview [class*="border"] {
                        border-color: ${getLineColor()} !important;
                        border-style: ${getLineStyle()} !important;
                      }
                      #print-area-preview [class*="divide"] > * + * {
                        border-color: ${getLineColor()} !important;
                        border-style: ${getLineStyle()} !important;
                      }

                      #print-area-preview .bg-black {
                        background-color: ${getLineStyle() === 'solid' ? getLineColor() : 'transparent'} !important;
                        border-left: ${getLineStyle() === 'dashed' || getLineStyle() === 'dotted' ? `${getLineThickness()} ${getLineStyle()} ${getLineColor()}` : 'none'} !important;
                        width: ${getLineStyle() === 'dashed' || getLineStyle() === 'dotted' ? '0px' : getLineThickness()} !important;
                      }

                      #print-area-preview p, 
                      #print-area-preview span:not(.font-mono), 
                      #print-area-preview div:not(.bg-black):not(.no-case-transform), 
                      #print-area-preview td:not(.font-mono), 
                      #print-area-preview th {
                        text-transform: ${invoiceStyle.textCase === 'uppercase' ? 'uppercase' : 'none'} !important;
                      }
                      #print-area-preview .logo-container {
                        order: ${invoiceStyle.logoPosition === 'left' ? -1 : 1} !important;
                      }

                      @media print {
                        @page {
                          size: A4 portrait !important;
                          margin: 0 !important;
                        }
                        body * {
                          visibility: hidden !important;
                        }
                        #print-area-preview, #print-area-preview * {
                          visibility: visible !important;
                        }
                        #print-area-preview {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 210mm !important;
                          height: 297mm !important;
                          min-height: 297mm !important;
                          max-width: 210mm !important;
                          max-height: 297mm !important;
                          margin: 0 !important;
                          padding: 10mm !important;
                          box-shadow: none !important;
                          border: none !important;
                          border-radius: 0 !important;
                          transform: none !important;
                          background: white !important;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                      }
                    ` }} />
                    <div>
                  {invoiceStyle.themeName === "Commercial Green Corporate" ? (
                    <CommercialGreenCorporateInvoice
                      invoice={preFinalizeInvoice!}
                      companySettings={companySettings}
                      showProdDescInPrint={showProdDescInPrint}
                      showBankInPrint={showBankInPrint}
                    />
                  ) : invoiceStyle.themeName === "Modern Premium Corporate" ? (
                    <ModernPremiumCorporateInvoice 
                      invoice={preFinalizeInvoice!} 
                      companySettings={companySettings} 
                      showProdDescInPrint={showProdDescInPrint} 
                      showBankInPrint={showBankInPrint} 
                    />
                  ) : invoiceStyle.themeName === "AI-Generated Theme Format Style" ? (
                    /* --- AI-GENERATED MODERN THEME FORMAT STYLE --- */
                    <div>
                      <div 
                        className="flex justify-between items-center p-6 rounded-2xl mb-4 text-white relative overflow-hidden"
                        style={{ backgroundColor: invoiceStyle.primaryColor || '#6366f1' }}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 z-0"></div>
                        <div className="relative z-10">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-white/25 text-white mb-2 font-mono">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" /> AI-SYSTEM VERIFIED SECURE GST RECORD
                          </div>
                          <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
                            TAX INVOICE
                          </h1>
                          <p className="text-[12px] font-black uppercase tracking-widest mt-1.5 opacity-90">
                            {companySettings.companyName}
                          </p>
                        </div>
                        {/* Brand Emblem Logo block */}
                        <div className="flex items-center gap-3 relative z-10 bg-white/15 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <Cpu className="h-5 w-5 text-indigo-200 animate-pulse" />
                          </div>
                          <div className="text-left select-none">
                            <p className="text-[9px] font-extrabold tracking-widest leading-tight uppercase text-white">INTELLIGENT</p>
                            <p className="text-[8px] font-semibold tracking-wider opacity-75 text-white uppercase">RECORDS</p>
                          </div>
                        </div>
                      </div>

                      {/* Horizontal Meta Row (A4 Grid spacing) */}
                      <div className="grid grid-cols-4 border border-solid border-slate-200 rounded-xl p-3 mb-4 text-center text-[10px] font-extrabold uppercase tracking-tight text-slate-800 bg-slate-50">
                        <div>
                          <span className="block text-[8px] font-black text-slate-400 mb-0.5">INVOICE NO</span>
                          <span className="text-slate-900 font-black text-[10px]">{preFinalizeInvoice.invoiceNumber}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-slate-400 mb-0.5">DATE OF SUPPLY</span>
                          <span className="text-slate-900 font-black text-[10px]">{preFinalizeInvoice.date}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-slate-400 mb-0.5">STATE OF SUPPLY</span>
                          <span className="text-slate-900 font-black text-[10px]">{preFinalizeInvoice.stateOfSupply || "19 West Bengal"}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black text-slate-400 mb-0.5">GRAND TOTAL</span>
                          <span className="text-[11px] font-black" style={{ color: invoiceStyle.primaryColor }}>
                            ₹{preFinalizeInvoice.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Bill-To & Bill-From Structured Columns side-by-side */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 rounded-xl text-[10px] border border-solid border-slate-200 bg-white shadow-sm">
                          <h3 className="font-extrabold uppercase text-[9px] tracking-wider mb-2" style={{ color: invoiceStyle.primaryColor }}>BILL TO RECEIVER:</h3>
                          <p className="font-black text-[11px] uppercase text-slate-900 leading-tight">
                            {preFinalizeInvoice.contactName ? `BFL A/C ${preFinalizeInvoice.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
                          </p>
                          <p className="font-semibold text-slate-600 leading-snug mt-1">{preFinalizeInvoice.contactAddress}</p>
                          <div className="mt-3 space-y-1 text-[9px] font-bold text-slate-500 border-t pt-2 border-slate-100">
                            {preFinalizeInvoice.contactMobile && <p>PHONE: <span className="text-slate-800">{preFinalizeInvoice.contactMobile}</span></p>}
                            {preFinalizeInvoice.contactGstin && <p>GSTIN/UIN: <span className="text-slate-800">{preFinalizeInvoice.contactGstin}</span></p>}
                            <p>STATE: <span className="text-slate-800">{preFinalizeInvoice.stateOfSupply || "19 West Bengal"}</span></p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl text-[10px] border border-solid border-slate-200 bg-white shadow-sm">
                          <h3 className="font-extrabold uppercase text-[9px] tracking-wider mb-2" style={{ color: invoiceStyle.primaryColor }}>BILL FROM SENDER:</h3>
                          <p className="font-black text-[11px] uppercase text-slate-900 leading-tight">
                            {companySettings.companyName.toUpperCase()}
                          </p>
                          <p className="font-semibold text-slate-600 leading-snug mt-1">{companySettings.address}</p>
                          <div className="mt-3 space-y-1 text-[9px] font-bold text-slate-500 border-t pt-2 border-slate-100">
                            <p>PHONE: <span className="text-slate-800">{companySettings.phone}</span></p>
                            {companySettings.email && <p>E-MAIL: <span className="text-slate-800">{companySettings.email}</span></p>}
                            <p>GSTIN: <span className="text-slate-800">{companySettings.gstin}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : invoiceStyle.themeName === "Mint Landscape Creations" ? (
                    /* --- MINT LANDSCAPE CREATIONS THEME --- */
                    <div>
                      <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-dashed border-teal-600">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[8px] font-extrabold uppercase tracking-widest mb-1.5">
                            🌿 MINT COMPLIANT INVOICE
                          </div>
                          <h1 className="text-3xl font-black text-teal-800 uppercase tracking-tight">
                            TAX INVOICE
                          </h1>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                            Original Copy for Recipient
                          </p>
                        </div>
                        <div className="text-right">
                          <h2 className="text-xl font-extrabold text-teal-950 uppercase">{companySettings.companyName}</h2>
                          <p className="text-[9px] text-slate-600 uppercase font-semibold leading-tight mt-1 max-w-[250px]">
                            {companySettings.address}
                          </p>
                          <p className="text-[9px] text-teal-700 font-bold mt-1">
                            GSTIN: {companySettings.gstin} | PH: {companySettings.phone}
                          </p>
                        </div>
                      </div>

                      {/* Meta box */}
                      <div className="grid grid-cols-4 border border-teal-100 rounded-lg p-2.5 mb-4 text-center text-[9px] font-bold uppercase tracking-tight text-slate-700 bg-teal-50/30">
                        <div>
                          <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">INVOICE NUMBER</span>
                          <span className="text-slate-900 font-black">{preFinalizeInvoice.invoiceNumber}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">DATE OF INVOICE</span>
                          <span className="text-slate-900 font-black">{preFinalizeInvoice.date}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">STATE OF SUPPLY</span>
                          <span className="text-slate-900 font-black">{preFinalizeInvoice.stateOfSupply || "19 West Bengal"}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-extrabold text-teal-600 mb-0.5">TOTAL DUE</span>
                          <span className="text-teal-800 font-black">₹{preFinalizeInvoice.grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Billed info */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3.5 rounded-lg text-[9px] border border-teal-100 bg-white">
                          <h3 className="font-extrabold uppercase text-[8px] tracking-wider mb-1 text-teal-700">CLIENT / RECEIVER:</h3>
                          <p className="font-black text-[10px] uppercase text-slate-900 leading-tight">
                            {preFinalizeInvoice.contactName ? `BFL A/C ${preFinalizeInvoice.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
                          </p>
                          <p className="font-medium text-slate-600 mt-1 leading-relaxed">{preFinalizeInvoice.contactAddress}</p>
                          <div className="mt-2 space-y-0.5 text-[8.5px] font-bold text-slate-500">
                            {preFinalizeInvoice.contactMobile && <p>PHONE: <span className="text-slate-800">{preFinalizeInvoice.contactMobile}</span></p>}
                            {preFinalizeInvoice.contactGstin && <p>GSTIN: <span className="text-slate-800">{preFinalizeInvoice.contactGstin}</span></p>}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-lg text-[9px] border border-teal-100 bg-white">
                          <h3 className="font-extrabold uppercase text-[8px] tracking-wider mb-1 text-teal-700">SUPPLIER / SENDER:</h3>
                          <p className="font-black text-[10px] uppercase text-slate-900 leading-tight">
                            {companySettings.companyName.toUpperCase()}
                          </p>
                          <p className="font-medium text-slate-600 mt-1 leading-relaxed">{companySettings.address}</p>
                          <div className="mt-2 space-y-0.5 text-[8.5px] font-bold text-slate-500">
                            <p>PHONE: <span className="text-slate-800">{companySettings.phone}</span></p>
                            {companySettings.email && <p>EMAIL: <span className="text-slate-800">{companySettings.email}</span></p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : invoiceStyle.themeName === "Gujarat Freight Tools Layout" ? (
                    /* --- GUJARAT FREIGHT TOOLS LAYOUT --- */
                    <div>
                      <div className="border-4 border-solid border-amber-600 p-4 mb-4 bg-white relative">
                        <div className="absolute top-2 right-2 text-[8px] font-black tracking-widest text-amber-600 border border-amber-600 px-1 py-0.5 uppercase">
                          GUJARAT FREIGHT REGISTERED
                        </div>
                        <div className="text-center space-y-1">
                          <span className="text-[10px] font-extrabold text-amber-700 tracking-widest uppercase block">
                            ⚙️ HEAVY INDUSTRIAL & FREIGHT LEDGER BILL ⚙️
                          </span>
                          <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight leading-none">
                            {companySettings.companyName}
                          </h1>
                          <p className="text-[9px] text-slate-600 font-extrabold uppercase max-w-[500px] mx-auto leading-tight">
                            {companySettings.address}
                          </p>
                          <p className="text-[9.5px] font-black text-slate-900">
                            GSTIN: {companySettings.gstin} | CONTACT PHONE: {companySettings.phone}
                          </p>
                        </div>
                      </div>

                      {/* Horizontal Meta Row (Freight Bold Grid) */}
                      <div className="grid grid-cols-4 border-2 border-solid border-slate-900 mb-4 text-center text-[9px] font-extrabold uppercase tracking-tight text-slate-900 bg-amber-50 divide-x divide-solid divide-slate-900">
                        <div className="p-1.5">
                          <span className="block text-[7.5px] font-black text-slate-500">BILL NO.</span>
                          <span className="text-slate-950 font-black text-[10px]">{preFinalizeInvoice.invoiceNumber}</span>
                        </div>
                        <div className="p-1.5">
                          <span className="block text-[7.5px] font-black text-slate-500">BILL DATE</span>
                          <span className="text-slate-950 font-black text-[10px]">{preFinalizeInvoice.date}</span>
                        </div>
                        <div className="p-1.5">
                          <span className="block text-[7.5px] font-black text-slate-500">PLACE OF SUPPLY</span>
                          <span className="text-slate-950 font-black text-[10px]">{preFinalizeInvoice.stateOfSupply || "19 West Bengal"}</span>
                        </div>
                        <div className="p-1.5">
                          <span className="block text-[7.5px] font-black text-slate-500">TOTAL GST PAYABLE</span>
                          <span className="text-amber-750 font-black text-[10.5px]">₹{preFinalizeInvoice.grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Billed details in traditional freight grid */}
                      <div className="grid grid-cols-2 border border-solid border-slate-900 mb-4 divide-x divide-solid divide-slate-900 bg-white">
                        <div className="p-3 text-[9.5px]">
                          <span className="block text-[8px] font-black text-amber-700 tracking-wider mb-1.5 uppercase">
                            CONSIGNEE / BILLED TO RECEIVER:
                          </span>
                          <p className="font-black text-[11px] uppercase text-slate-950">
                            {preFinalizeInvoice.contactName ? `BFL A/C ${preFinalizeInvoice.contactName.toUpperCase()}` : 'WALK-IN CUSTOMER'}
                          </p>
                          <p className="font-semibold text-slate-700 mt-1 leading-snug">{preFinalizeInvoice.contactAddress}</p>
                          <div className="mt-3 space-y-0.5 border-t border-dashed border-slate-200 pt-2 font-bold text-slate-600">
                            {preFinalizeInvoice.contactMobile && <p>CONSIGNEE TEL: <span className="text-slate-900">{preFinalizeInvoice.contactMobile}</span></p>}
                            {preFinalizeInvoice.contactGstin && <p>CONSIGNEE GSTIN: <span className="text-slate-900">{preFinalizeInvoice.contactGstin}</span></p>}
                          </div>
                        </div>
                        <div className="p-3 text-[9.5px]">
                          <span className="block text-[8px] font-black text-amber-700 tracking-wider mb-1.5 uppercase">
                            CONSIGNOR / BILLED FROM SENDER:
                          </span>
                          <p className="font-black text-[11px] uppercase text-slate-950">
                            {companySettings.companyName.toUpperCase()}
                          </p>
                          <p className="font-semibold text-slate-700 mt-1 leading-snug">{companySettings.address}</p>
                          <div className="mt-3 space-y-0.5 border-t border-dashed border-slate-200 pt-2 font-bold text-slate-600">
                            <p>TEL: <span className="text-slate-900">{companySettings.phone}</span></p>
                            {companySettings.email && <p>EMAIL: <span className="text-slate-900">{companySettings.email}</span></p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- CLASSIC THEME FORMAT STYLE (ELEGANT BUSINESS TRADITIONAL) --- */
                    <>
                      <div className="text-center pb-2 mb-2">
                        <h1 
                          className="text-3xl font-black tracking-tighter uppercase leading-tight"
                          style={{ color: invoiceStyle.primaryColor || '#000000' }}
                        >
                          {companySettings.companyName}
                        </h1>
                        <p className="text-[10px] font-bold text-black uppercase">{companySettings.address}</p>
                        <div className="text-[10px] font-bold text-black uppercase mt-0.5">
                          PH. : {companySettings.phone} 
                          {companySettings.email && ` | E-Mail : ${companySettings.email}`}
                        </div>
                        <div className="text-[10px] font-bold text-black uppercase mt-0.5">
                          GSTIN : {companySettings.gstin}   STATE : 19 West Bengal
                        </div>
                      </div>

                      {/* TAX INVOICE heading */}
                      <div 
                        className="flex justify-between items-center text-[11px] font-bold pb-1 pt-1 mb-2 border-y border-solid border-black"
                        style={{ 
                          backgroundColor: invoiceStyle.tableHeaderBg || '#f1f5f9',
                          color: invoiceStyle.tableHeaderTextColor || '#000000'
                        }}
                      >
                        <div className="flex-1 text-center font-black uppercase text-[12px] tracking-wide ml-[20%]">
                          TAX INVOICE 
                        </div>
                        <div className="text-right whitespace-nowrap text-[10px] uppercase pr-2">
                          ORIGINAL For Recipient
                        </div>
                      </div>

                      {/* Invoice Meta and Party Details */}
                      <div className="flex border-b border-solid border-black pb-2 mb-2 min-h-[140px]">
                        {/* Billed To Left Side */}
                        <div className="flex-1 space-y-0.5 pr-2 border-r border-solid border-black text-[10px]">
                          <p className="uppercase text-black">
                             {preFinalizeInvoice.contactName && <span className="font-bold">BFL A/C {preFinalizeInvoice.contactName}</span>}
                          </p>
                          <p className="uppercase text-black mt-0.5 leading-snug">{preFinalizeInvoice.contactAddress}</p>
                          
                          <div className="pt-4">
                            <p className="uppercase">PH. : {preFinalizeInvoice.contactMobile}</p>
                            <p className="uppercase">GSTIN/UIN : {preFinalizeInvoice.contactGstin}</p>
                            <p className="uppercase mt-0.5 font-bold flex">
                               <span className="w-[80px] font-normal">STATE</span> 
                               <span>: {preFinalizeInvoice.stateOfSupply || "19 West Bengal"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Invoice details */}
                        <div className="w-[45%] text-[10px] uppercase font-bold pl-4 pt-1">
                          <div className="flex">
                            <span className="w-[100px]">Invoice No</span>
                            <span>: {preFinalizeInvoice.invoiceNumber}</span>
                          </div>
                          <div className="flex mt-1">
                            <span className="w-[100px]">Invoice Date</span>
                            <span>: {preFinalizeInvoice.date}</span>
                          </div>
                          <div className="flex mt-1">
                            <span className="w-[100px]">Due Date</span>
                            <span>: {preFinalizeInvoice.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Product Layout Table */}
                  <div className="border border-solid border-black overflow-hidden mb-0 text-[10px] border-b-0 min-h-[300px] relative bg-white">
                    <div className="absolute inset-y-0 left-[5%] w-[1px] bg-black pointer-events-none z-0"></div>
                    <div className="absolute inset-y-0 left-[15%] w-[1px] bg-black pointer-events-none z-0"></div>
                    <div className="absolute inset-y-0 left-[57%] w-[1px] bg-black pointer-events-none z-0"></div>
                    <div className="absolute inset-y-0 left-[65%] w-[1px] bg-black pointer-events-none z-0"></div>
                    <div className="absolute inset-y-0 left-[72%] w-[1px] bg-black pointer-events-none z-0"></div>
                    <div className="absolute inset-y-0 left-[82%] w-[1px] bg-black pointer-events-none z-0"></div>
                    <div className="absolute inset-y-0 left-[89%] w-[1px] bg-black pointer-events-none z-0"></div>
                    <div className="absolute inset-y-0 left-[96%] w-[1px] bg-black pointer-events-none z-0"></div>

                    <table className="w-full text-left table-fixed relative z-10 bg-transparent">
                      <thead 
                        className="font-bold uppercase border-b border-solid border-black text-[10px] relative z-10"
                        style={{ 
                          backgroundColor: invoiceStyle.tableHeaderBg || '#f8fafc',
                          color: invoiceStyle.tableHeaderTextColor || '#000000'
                        }}
                      >
                        <tr className="divide-x divide-solid divide-black">
                          <th className="px-1 py-1.5 w-[5%] text-center">Sr<br/>No</th>
                          <th className="px-1 py-1.5 w-[10%] text-center">HSN<br/>SAC</th>
                          <th className="px-2 py-1.5 w-[42%] text-center border-b-0">Product Description</th>
                          <th className="px-1 py-1.5 w-[8%] text-center">Qty</th>
                          <th className="px-1 py-1.5 w-[7%] text-center">Unit</th>
                          <th className="px-1 py-1.5 w-[10%] text-center">Rate</th>
                          <th className="px-1 py-1.5 w-[7%] text-center">SGST<br/>%</th>
                          <th className="px-1 py-1.5 w-[7%] text-center">CGST<br/>%</th>
                          <th className="px-2 py-1.5 w-[13%] text-center">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-black align-top font-bold bg-white">
                        {preFinalizeInvoice.items.map((item, index) => {
                          const cgstRate = (item.gstRate || 18) / 2;
                          return (
                            <tr key={index} className="divide-x divide-solid divide-black">
                              <td className="px-1 text-center py-2 font-normal text-[9px]">{index + 1}</td>
                              <td className="px-1 text-center py-2 font-normal text-[9px]">{item.hsnCode || '84151010'}</td>
                              <td className="px-2 uppercase py-2 text-[10px]">
                                {item.productName}
                                {item.productModel && <span className="block mt-0.5">{item.productModel}</span>}
                                {item.serialNumber && <span className="block font-normal mt-0.5">SL NO-{item.serialNumber}</span>}
                                {item.description && (
                                  <div className="font-normal whitespace-pre-line mt-0.5 pt-1">
                                    {item.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-1 text-right py-2 font-normal">{item.quantity.toFixed(3)}</td>
                              <td className="px-1 text-left pl-1 py-2 font-normal uppercase">{item.unit || 'Pcs'}</td>
                              <td className="px-1 text-right py-2 font-normal">{item.rate.toFixed(2)}</td>
                              <td className="px-1 text-center py-2 font-normal">{cgstRate}</td>
                              <td className="px-1 text-center py-2 font-normal">{cgstRate}</td>
                              <td className="px-2 text-right py-2 font-normal">{item.total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t border-solid border-black relative z-10 bg-white">
                        <tr className="divide-x divide-solid divide-black h-8 text-[11px] font-bold">
                          <td colSpan={3} className="px-1 border-r border-solid border-black text-right pr-2"></td>
                          <td className="px-1 text-right font-normal">{(preFinalizeInvoice.items.reduce((s,i) => s + i.quantity, 0)).toFixed(3)}</td>
                          <td colSpan={4} className="border-r border-solid border-black"></td>
                          <td className="px-2 text-right font-bold">{preFinalizeInvoice.subtotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Table footer breakdown matrix */}
                  <div className="border border-solid border-black flex border-t-0 text-[10px] bg-white">
                    <div className="flex w-full">
                      <div className="flex-1 p-2 border-r border-solid border-black flex flex-col justify-between">
                        <div>
                          <div className="flex font-normal w-[80%] text-[10px] uppercase pb-1 border-b border-solid border-black">
                            <div className="w-[20%] text-center">GST%</div>
                            <div className="w-[30%] text-center">TAXABLE AMT</div>
                            <div className="w-[25%] text-center">SGST</div>
                            <div className="w-[25%] text-center">CGST</div>
                          </div>
                          <div className="flex w-[80%] text-[10px] items-center pt-1 font-normal">
                            <div className="w-[20%] text-center">18.00%</div>
                            <div className="w-[30%] text-center whitespace-nowrap">of {preFinalizeInvoice.subtotal.toFixed(2)}=</div>
                            <div className="w-[25%] text-right">{preFinalizeInvoice.totalSgst.toFixed(2)}+</div>
                            <div className="w-[25%] text-right">{preFinalizeInvoice.totalCgst.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-8 border-t border-solid border-black pt-1">
                          <div className="flex font-normal w-[80%] text-[10px]">
                            <div className="w-[20%] uppercase text-left">TOTAL</div>
                            <div className="w-[30%] text-right">{preFinalizeInvoice.subtotal.toFixed(2)}</div>
                            <div className="w-[25%] text-right">{preFinalizeInvoice.totalSgst.toFixed(2)}</div>
                            <div className="w-[25%] text-right">{preFinalizeInvoice.totalCgst.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="w-[35%] text-[10px] uppercase font-normal relative border-l border-solid border-transparent">
                        <div className="flex font-normal">
                          <span className="w-[45%] pl-1 border-r border-solid border-black h-5 flex items-center">CGST</span>
                          <span className="w-[55%] text-right pr-2 h-5 flex items-center justify-end">{preFinalizeInvoice.totalCgst.toFixed(2)}</span>
                        </div>
                        <div className="flex font-normal">
                          <span className="w-[45%] pl-1 border-r border-solid border-black h-5 flex items-center">SGST</span>
                          <span className="w-[55%] text-right pr-2 h-5 flex items-center justify-end">{preFinalizeInvoice.totalSgst.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col h-14 mt-4">
                          <div className="flex border-t border-solid border-black h-6 border-b border-solid border-black">
                            <span className="w-[45%] pl-1 border-r border-solid border-black flex items-center">Round Off</span>
                            <span className="w-[55%] text-right pr-2 flex items-center justify-end">
                              {preFinalizeInvoice.totalDiscount > 0 ? `-${preFinalizeInvoice.totalDiscount.toFixed(2)}` : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank / Net Amt Bottom */}
                  {showBankInPrint && (
                    <div className="flex border border-solid border-t-0 border-black mb-2 h-16 bg-white">
                      <div className="flex-1 p-1.5 pl-2 font-bold text-[9px] uppercase border-r border-solid border-black flex flex-col justify-center leading-tight">
                        {companySettings.bankName && <p>{companySettings.bankName}, BRANCH {companySettings.tagline || ''}</p>}
                        <p>A/C NO.{companySettings.accountNumber}, IFSC CODE-{companySettings.ifscCode}</p>
                        {companySettings.upiId && <p className="text-orange-655 font-extrabold text-orange-600">UPI ID: {companySettings.upiId}</p>}
                      </div>
                      {companySettings.upiId && (
                        <div className="w-[18%] p-1 border-r border-solid border-black flex flex-col items-center justify-center bg-slate-50/50">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                              `upi://pay?pa=${companySettings.upiId}&pn=${encodeURIComponent(companySettings.companyName)}&am=${preFinalizeInvoice.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${preFinalizeInvoice.invoiceNumber}`)}&cu=INR`
                            )}`}
                            alt="UPI QR Code"
                            className="h-10 w-10 object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[6.5px] font-black tracking-tighter text-slate-900 mt-0.5">SCAN TO PAY</span>
                        </div>
                      )}
                      <div 
                        className="w-[35%] flex items-center justify-between pl-2 pr-2 font-black text-[11px] uppercase"
                        style={{ 
                          backgroundColor: invoiceStyle.tableHeaderBg || '#f8fafc',
                          color: invoiceStyle.tableHeaderTextColor || '#000000'
                        }}
                      >
                        <span>NET AMOUNT</span>
                        <span>{preFinalizeInvoice.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {!showBankInPrint && (
                    <div className="flex justify-end mb-2">
                      <div 
                        className="w-[35%] flex items-center justify-between pl-2 pr-2 py-2 font-black text-[11px] uppercase border border-solid border-black"
                        style={{ 
                          backgroundColor: invoiceStyle.tableHeaderBg || '#f8fafc',
                          color: invoiceStyle.tableHeaderTextColor || '#000000'
                        }}
                      >
                        <span>NET AMOUNT</span>
                        <span>{preFinalizeInvoice.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {showProdDescInPrint && (
                    <div className="border border-solid border-black p-2 rounded-xl text-[9px] text-slate-700 bg-slate-50 font-medium mb-2 leading-relaxed">
                      <p className="font-bold text-black text-[10px] mb-0.5 uppercase">SPECIFICATIONS & DETAILS:</p>
                      <p className="whitespace-pre-line">{customProductDesc}</p>
                    </div>
                  )}

                  {/* In Words bar */}
                  <div className="border border-solid border-black p-1.5 font-bold text-[11px] uppercase mt-2 mb-2 px-2 bg-white">
                    [In Words] : {(() => {
                      const toWords = (num: number) => {
                        return "Rupees " + (num < 10000 ? "Several Thousand Rupees Only" : "Twenty Thousand Plus Only");
                      }; 
                      return toWords(preFinalizeInvoice.grandTotal);
                    })()}
                  </div>
                </div>

                {/* Print Footer / Terms & Conditions */}
                <div className="border border-solid border-black pt-1 px-2 pb-14 relative overflow-visible mt-2 bg-white">
                  <div className="text-[9px] uppercase space-y-[2px] opacity-90 max-w-[70%] font-normal">
                    <p>(1) We are not responsible for any Breakage/Damage/Shortage/Leakage in transit.</p>
                    <p>(2) Our responsibility ceases when the goods are delivered to the carrier.</p>
                    <p>(3) Goods once sold will not be accepted back.</p>
                    <p className="leading-[1.1]">(4) It is hear by inform that {companySettings.companyName} is a marketing & distribution co. <br/>
                    & is not a mfg., the product in this Inv. are covered by manufacturer strandered warrenty, we have no <br/>
                    leagle/finacinal liability for the same.</p>
                    <p>(5) All subject to kolkata judrcction.</p>
                  </div>
                  <div className="absolute top-1 right-2 w-[240px] h-[calc(100%-8px)] flex flex-col items-end justify-between font-bold">
                    <span className="text-[10px] text-black font-normal mr-2">E & O E</span>
                    <div className="relative text-black w-full flex flex-col items-end text-right pr-2">
                      <div className="h-16 w-full"></div>
                      <div className="text-[10px] relative z-10 w-full text-right uppercase tracking-widest font-normal text-black font-sans border-t border-black/20 pt-1">
                        AUTHORISED SIGNATORY
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-left text-[9px] text-slate-500 pt-1 font-normal ml-1">
                  Generated from EXPERT Accounting Software
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
