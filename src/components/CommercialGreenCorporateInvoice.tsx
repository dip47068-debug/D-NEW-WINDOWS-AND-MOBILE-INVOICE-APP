import React, { useState, useMemo } from 'react';
import { Invoice, CompanySettings, InvoiceItem } from '../types';
import { 
  Sparkles, Globe, DollarSign, CreditCard, CheckCircle2, 
  AlertCircle, Truck, Anchor, FileText, Edit3, Check, 
  Plus, Trash2, Search, ArrowUpDown, User, MapPin, ShieldAlert
} from 'lucide-react';

interface CommercialGreenCorporateInvoiceProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  showProdDescInPrint?: boolean;
  showBankInPrint?: boolean;
}

// Currencies mapping with symbols and default exchange rates relative to INR
const CURRENCIES = [
  { code: 'INR', symbol: '₹', rate: 1.0, label: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', rate: 0.012, label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', rate: 0.011, label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', rate: 0.0094, label: 'British Pound (GBP)' },
  { code: 'AED', symbol: 'د.إ', rate: 0.044, label: 'UAE Dirham (AED)' },
  { code: 'JPY', symbol: '¥', rate: 1.85, label: 'Japanese Yen (JPY)' },
];

export const CommercialGreenCorporateInvoice: React.FC<CommercialGreenCorporateInvoiceProps> = ({
  invoice,
  companySettings,
  showProdDescInPrint = true,
  showBankInPrint = true,
}) => {
  // --- INTERACTIVE / EDITABLE COMMERCIAL STATE ---
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'no' | 'name' | 'qty' | 'rate' | 'total'>('no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-currency Support
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [customExchangeRate, setCustomExchangeRate] = useState<number | null>(null);

  // Custom Commercial Fields
  const [customsDeclarationNo, setCustomsDeclarationNo] = useState('CD-908234-IN');
  const [exportCountry, setExportCountry] = useState('India');
  const [importLicenseNo, setImportLicenseNo] = useState('IL-88749-US');
  const [taxId, setTaxId] = useState('VAT-44558239');
  
  // Importer Information (Optional customized fields)
  const [importerTaxNo, setImporterTaxNo] = useState('US-TAX-998842');
  const [importerPostalCode, setImporterPostalCode] = useState('10001');
  const [importerPhone, setImporterPhone] = useState('+1 (555) 321-9876');
  const [importerEmail, setImporterEmail] = useState('imports@consignee.com');

  // Shipping & Shipping info
  const [shippingDate, setShippingDate] = useState('2026-07-10');
  const [deliveryDate, setDeliveryDate] = useState('2026-07-28');
  const [trackingNumber, setTrackingNumber] = useState('TRK-DHL-88749302');
  const [courier, setCourier] = useState('DHL Express WorldWide');
  const [containerNumber, setContainerNumber] = useState('MSCU-902348-2');
  const [portOfLoading, setPortOfLoading] = useState('Nhava Sheva (INNSA), India');
  const [portOfDestination, setPortOfDestination] = useState('Port of New York (USNYC), USA');
  const [incoterms, setIncoterms] = useState('CIF - Cost, Insurance & Freight');

  // Extra Financial fields (Insurance, Packaging, etc)
  const [insuranceCost, setInsuranceCost] = useState<number>(3500);
  const [packagingCost, setPackagingCost] = useState<number>(1500);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [customShippingCharge, setCustomShippingCharge] = useState<number>(4500);

  // Direct edit table items locally for interactive fine-tuning
  const [localItems, setLocalItems] = useState<InvoiceItem[]>(() => [...invoice.items]);

  // Payment details override
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [bankName, setBankName] = useState(companySettings.bankName || 'HDFC Bank');
  const [accountHolder, setAccountHolder] = useState(companySettings.companyName || 'Expert Solutions');
  const [accountNumber, setAccountNumber] = useState(companySettings.accountNumber || '50100234567890');
  const [ifscCode, setIfscCode] = useState(companySettings.ifscCode || 'HDFC0001234');
  const [iban, setIban] = useState('GB82 WEST 1234 5678 9012 34');

  // Additional Notes (Terms & Returns) states
  const [qualityTerms, setQualityTerms] = useState('Goods supplied are in premium merchantable quality, packed for inter-state and maritime transit.');
  const [returnTerms, setReturnTerms] = useState('No refunds once maritime shipping container seals are detached or bills of lading certified.');
  const [regulatoryTerms, setRegulatoryTerms] = useState('Inbound consignments are subject to carrier delays, custom duties, local levies, and audits.');
  const [jurisdictionTerms, setJurisdictionTerms] = useState('All disputes strictly referred to regional judicial arbitrations matching shipper\'s location.');

  // --- DERIVED MULTI-CURRENCY CONVERTER ---
  const currencyInfo = useMemo(() => {
    const found = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];
    const rate = customExchangeRate !== null ? customExchangeRate : found.rate;
    return {
      code: found.code,
      symbol: found.symbol,
      rate: rate
    };
  }, [selectedCurrency, customExchangeRate]);

  const convertAmount = (val: number) => {
    return val * currencyInfo.rate;
  };

  const formatCurrency = (val: number) => {
    return `${currencyInfo.symbol}${convertAmount(val).toFixed(2)}`;
  };

  // --- ACTIONS ---
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      productId: `prod-${Date.now()}`,
      productName: 'NEW COMMERCIAL GOOD ITEM',
      hsnCode: '84713010',
      quantity: 1,
      rate: 10000,
      discount: 0,
      gstRate: 18,
      cgst: 900,
      sgst: 900,
      igst: 0,
      total: 11800,
      productModel: 'CM-X1',
      serialNumber: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      description: 'Standard technical commercial grade packaging unit.'
    };
    setLocalItems([...localItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...localItems];
    const item = { ...updated[index], [field]: value };
    
    // Recalculate totals for this item
    if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'gstRate') {
      const q = Number(item.quantity) || 0;
      const r = Number(item.rate) || 0;
      const d = Number(item.discount) || 0;
      const gst = Number(item.gstRate) || 0;

      const baseAmount = q * r;
      const discAmount = baseAmount * (d / 100);
      const taxableAmount = baseAmount - discAmount;
      const taxAmount = taxableAmount * (gst / 100);

      item.total = taxableAmount + taxAmount;
      item.cgst = taxAmount / 2;
      item.sgst = taxAmount / 2;
    }
    
    updated[index] = item;
    setLocalItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
  };

  // --- CALCULATE DYNAMIC TOTALS ---
  const computedTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    localItems.forEach(item => {
      const base = item.quantity * item.rate;
      const disc = base * (item.discount / 100);
      subtotal += base;
      totalDiscount += disc;
      totalTax += (base - disc) * (item.gstRate / 100);
    });

    const baseGrand = subtotal - totalDiscount + totalTax;
    const finalGrand = baseGrand + insuranceCost + packagingCost + otherCharges + customShippingCharge;
    const balanceDue = Math.max(0, finalGrand - invoice.paidAmount);

    return {
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal: finalGrand,
      balanceDue
    };
  }, [localItems, insuranceCost, packagingCost, otherCharges, customShippingCharge, invoice.paidAmount]);

  // --- SEARCH AND SORT ---
  const processedItems = useMemo(() => {
    let items = [...localItems];
    
    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.productName.toLowerCase().includes(term) || 
        (item.productModel && item.productModel.toLowerCase().includes(term)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(term)) ||
        (item.hsnCode && item.hsnCode.toLowerCase().includes(term))
      );
    }

    // Sorting
    items.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortBy) {
        case 'no':
          return sortOrder === 'asc' ? 1 : -1; // Default index sort
        case 'name':
          valA = a.productName.toLowerCase();
          valB = b.productName.toLowerCase();
          break;
        case 'qty':
          valA = a.quantity;
          valB = b.quantity;
          break;
        case 'rate':
          valA = a.rate;
          valB = b.rate;
          break;
        case 'total':
          valA = a.total;
          valB = b.total;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [localItems, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="relative font-sans text-black bg-white select-none leading-relaxed w-full max-w-4xl mx-auto p-4 sm:p-8 rounded-lg shadow-sm border border-slate-100">
      
      {/* EXCLUDED FROM PRINT: INTERACTIVE CONTROL PANEL */}
      <div className="mb-6 p-5 rounded-lg bg-[#A4C45A]/5 border border-[#A4C45A]/20 flex flex-col gap-4 shadow-sm print:hidden">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#356854]/10 text-[#356854] font-extrabold text-[10px] uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Commercial Dashboard Tools
            </span>
            <p className="text-[11px] text-black mt-1">Configure multi-currency, customs variables, or edit quantities below.</p>
          </div>
          
          <button
            type="button"
            onClick={() => setIsEditingMode(!isEditingMode)}
            className={`px-4 py-2.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all shadow-sm cursor-pointer inline-flex items-center gap-2 ${
              isEditingMode 
                ? 'bg-[#356854] text-white hover:bg-[#2c5645]' 
                : 'bg-[#A4C45A] text-white hover:bg-[#92b04f]'
            }`}
          >
            {isEditingMode ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
            {isEditingMode ? 'Done Customizing' : 'Click to Edit Fields'}
          </button>
        </div>

        {/* Editing Dashboard Inputs Grid */}
        {isEditingMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-emerald-100 text-xs text-black">
            {/* Multi-currency */}
            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Currency System</label>
              <select
                value={selectedCurrency}
                onChange={(e) => {
                  setSelectedCurrency(e.target.value);
                  setCustomExchangeRate(null);
                }}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Custom Exchange Rate</label>
              <input
                type="number"
                step="any"
                value={customExchangeRate !== null ? customExchangeRate : ''}
                placeholder={`Default: ${CURRENCIES.find(c => c.code === selectedCurrency)?.rate}`}
                onChange={(e) => setCustomExchangeRate(e.target.value !== '' ? Number(e.target.value) : null)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-mono font-bold"
              />
            </div>

            {/* Customs & Export details */}
            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Customs Decl. No</label>
              <input
                type="text"
                value={customsDeclarationNo}
                onChange={(e) => setCustomsDeclarationNo(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Export Country</label>
              <input
                type="text"
                value={exportCountry}
                onChange={(e) => setExportCountry(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Import License No</label>
              <input
                type="text"
                value={importLicenseNo}
                onChange={(e) => setImportLicenseNo(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Consignee Tax ID</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold"
              />
            </div>

            {/* Financial charges */}
            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Insurance Cost (₹)</label>
              <input
                type="number"
                value={insuranceCost}
                onChange={(e) => setInsuranceCost(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Packaging Cost (₹)</label>
              <input
                type="number"
                value={packagingCost}
                onChange={(e) => setPackagingCost(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold font-mono"
              />
            </div>

            {/* Freight details */}
            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Port of Loading</label>
              <input
                type="text"
                value={portOfLoading}
                onChange={(e) => setPortOfLoading(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Port of Destination</label>
              <input
                type="text"
                value={portOfDestination}
                onChange={(e) => setPortOfDestination(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Incoterms Agreement</label>
              <input
                type="text"
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Shipping Freight (₹)</label>
              <input
                type="number"
                value={customShippingCharge}
                onChange={(e) => setCustomShippingCharge(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-bold font-mono"
              />
            </div>

            {/* Dates & tracking */}
            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Shipping Date</label>
              <input
                type="date"
                value={shippingDate}
                onChange={(e) => setShippingDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Container Number</label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Quality Guarantee Terms</label>
              <input
                type="text"
                value={qualityTerms}
                onChange={(e) => setQualityTerms(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Return & Refund Policy</label>
              <input
                type="text"
                value={returnTerms}
                onChange={(e) => setReturnTerms(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Regulatory Custom Terms</label>
              <input
                type="text"
                value={regulatoryTerms}
                onChange={(e) => setRegulatoryTerms(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-extrabold text-[10px] text-emerald-800 uppercase">Dispute Jurisdiction</label>
              <input
                type="text"
                value={jurisdictionTerms}
                onChange={(e) => setJurisdictionTerms(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 bg-white rounded-lg font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* --- PRINT / A4 PORTRAIT CONTAINER --- */}
      <div className="w-full overflow-x-auto flex justify-center mt-6">
        <div className="flex flex-col justify-between w-[210mm] min-w-[210mm] max-w-[210mm] h-[297mm] max-h-[297mm] min-h-[297mm] text-black bg-white select-none leading-tight p-6 rounded-[8px] shadow-md border border-slate-100 print:p-0 print:shadow-none print:rounded-none print:border-none overflow-hidden box-border">
        
        {/* --- HEADER BLOCK --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-slate-200 pb-2 mb-2">
          {/* Left Side: Commercial Title & Branding */}
          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="space-y-0.5">
              <h1 style={{ color: '#356854' }} className="text-[18px] font-black tracking-tight leading-none uppercase">
                {companySettings.companyName}
              </h1>
              {companySettings.tagline && (
                <p className="text-[7.5px] font-bold uppercase tracking-wider text-black italic">
                  {companySettings.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Invoice Meta & Status Badges inside Green Information Card */}
          <div className="md:col-span-5 text-right flex flex-col items-end justify-between">
            {/* Status & Document Reference Info */}
            <div className="flex items-center gap-1 mb-1">
              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border ${
                invoice.paymentStatus === 'paid' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : invoice.paymentStatus === 'partial'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                ● {invoice.paymentStatus.toUpperCase()}
              </span>
              <span className="bg-slate-100 text-black border border-slate-200 px-2 py-0.5 rounded text-[8px] font-extrabold font-mono tracking-wider">
                REF: {invoice.invoiceNumber}-COM
              </span>
            </div>

            {/* Custom Green Info Box */}
            <div className="w-full text-[8.5px] p-2 rounded bg-gradient-to-r from-[#356854]/10 to-[#356854]/5 border border-[#356854]/20 space-y-0.5 shadow-sm">
              <p className="flex justify-between font-bold text-black">
                <span className="text-black">Invoice Number:</span> 
                <span className="font-mono text-black font-black">{invoice.invoiceNumber}</span>
              </p>
              <p className="flex justify-between font-bold text-black">
                <span className="text-black">Date of Issue:</span> 
                <span className="text-black">{invoice.date}</span>
              </p>
              <p className="flex justify-between font-bold text-black">
                <span className="text-black">Export Country:</span> 
                <span className="text-black font-mono font-black">{exportCountry}</span>
              </p>
              <p className="flex justify-between font-bold text-black">
                <span className="text-black">Due Date:</span> 
                <span className="text-rose-700 font-black">{invoice.dueDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* --- EXPORTER AND IMPORTER CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2.5 text-[8.5px]">
          {/* Exporter Info Card */}
          <div className="p-2 px-3 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#356854' }}></div>
            <div className="pl-1.5 space-y-0.5">
              <p style={{ color: '#356854' }} className="text-[7.5px] font-black tracking-widest uppercase mb-0.5">
                EXPORTER (SHIPPER DETAILS)
              </p>
              <p className="text-[9.5px] font-black text-black uppercase leading-none">
                {companySettings.companyName}
              </p>
              <p className="text-black font-semibold leading-normal">{companySettings.address}</p>
              
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-dashed border-slate-200 text-[8px] font-semibold text-black">
                <p>Phone: <span className="text-black font-black">{companySettings.phone}</span></p>
                {companySettings.email && <p>Email: <span className="text-black font-black">{companySettings.email}</span></p>}
                <p className="col-span-2">GSTIN/VAT: <span className="text-black font-mono font-black">{companySettings.gstin || '27AADCB2312Z1ZA'}</span></p>
                <p>Customs Decl. No: <span className="text-black font-mono font-black">{customsDeclarationNo}</span></p>
                <p>Exporter Tax ID: <span className="text-black font-mono font-black">{taxId}</span></p>
              </div>
            </div>
          </div>

          {/* Importer Info Card */}
          <div className="p-2 px-3 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#A4C45A' }}></div>
            <div className="pl-1.5 space-y-0.5">
              <p style={{ color: '#A4C45A' }} className="text-[7.5px] font-black tracking-widest uppercase mb-0.5">
                IMPORTER (CONSIGNEE DETAILS)
              </p>
              <p className="text-[9.5px] font-black text-black uppercase leading-none">
                {invoice.contactName ? `BFL A/C ${invoice.contactName.toUpperCase()}` : 'WALK-IN CONSIGNEE'}
              </p>
              <p className="text-black font-semibold leading-normal">{invoice.contactAddress || 'No Address Provided'}</p>
              
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-dashed border-slate-200 text-[8px] font-semibold text-black">
                <p>Phone: <span className="text-black font-black">{invoice.contactMobile || importerPhone}</span></p>
                <p>Email: <span className="text-black font-black">{importerEmail}</span></p>
                <p className="col-span-2">GSTIN/Tax No: <span className="text-black font-mono font-black">{invoice.contactGstin || importerTaxNo}</span></p>
                <p>Dest. Country: <span className="text-black font-black">{invoice.stateOfSupply || 'USA'}</span></p>
                <p>License No: <span className="text-black font-mono font-black">{importLicenseNo}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* --- INTERNATIONAL SHIPPING & TRANSPORT INFORMATION --- */}
        <div className="mb-2.5 p-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[8.5px] text-black shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: '#356854' }}></div>
          <p className="text-[7.5px] font-black tracking-widest text-[#356854] uppercase mb-1.5 flex items-center gap-1">
            <Truck className="h-3 w-3 text-[#356854]" /> INTERNATIONAL COMMERCIAL SHIPPING INFORMATION
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Column 1: Carrier & Agreement */}
            <div className="space-y-0.5 bg-white p-1.5 border border-slate-200/60 rounded-md">
              <span className="text-[7px] text-black font-extrabold uppercase block tracking-wider leading-none">Carrier & Transport</span>
              <p className="text-black font-black text-[8px] uppercase flex items-center gap-0.5">
                <Globe className="h-2.5 w-2.5 text-[#A4C45A]" /> {courier}
              </p>
              <div className="pt-0.5 mt-0.5 border-t border-dashed border-slate-100">
                <span className="text-[6.5px] text-black font-extrabold uppercase block tracking-wider leading-none">Incoterms Protocol</span>
                <p className="text-black font-bold text-[7.5px] leading-tight">{incoterms}</p>
              </div>
            </div>

            {/* Column 2: Port & Customs Clearance */}
            <div className="space-y-0.5 bg-white p-1.5 border border-slate-200/60 rounded-md">
              <span className="text-[7px] text-black font-extrabold uppercase block tracking-wider leading-none">Port of Loading</span>
              <p className="text-black font-black text-[8px] uppercase flex items-center gap-0.5 leading-none">
                <Anchor className="h-2.5 w-2.5 text-[#356854]" /> {portOfLoading}
              </p>
              <div className="pt-0.5 mt-0.5 border-t border-dashed border-slate-100">
                <span className="text-[6.5px] text-black font-extrabold uppercase block tracking-wider leading-none">Port of Discharge</span>
                <p className="text-black font-black text-[8px] uppercase flex items-center gap-0.5 leading-none">
                  <Anchor className="h-2.5 w-2.5 text-[#A4C45A]" /> {portOfDestination}
                </p>
              </div>
            </div>

            {/* Column 3: Logistics Identifiers */}
            <div className="space-y-0.5 bg-white p-1.5 border border-slate-200/60 rounded-md">
              <span className="text-[7px] text-black font-extrabold uppercase block tracking-wider leading-none">AWB / Tracking Number</span>
              <p className="text-black font-mono font-black text-[8px] tracking-tight leading-none">{trackingNumber}</p>
              <div className="pt-0.5 mt-0.5 border-t border-dashed border-slate-100">
                <span className="text-[6.5px] text-black font-extrabold uppercase block tracking-wider leading-none">Container Identifier</span>
                <p className="text-black font-mono font-black text-[8px] tracking-tight leading-none">{containerNumber || 'N/A - LCL cargo'}</p>
              </div>
            </div>

            {/* Column 4: Critical Transit Dates */}
            <div className="space-y-0.5 bg-white p-1.5 border border-slate-200/60 rounded-md">
              <span className="text-[7px] text-black font-extrabold uppercase block tracking-wider leading-none">Departure Date</span>
              <p className="text-black font-mono font-black text-[8px] leading-none">{shippingDate}</p>
              <div className="pt-0.5 mt-0.5 border-t border-dashed border-slate-100">
                <span className="text-[6.5px] text-black font-extrabold uppercase block tracking-wider leading-none">Est. Delivery Date</span>
                <p className="text-black font-mono font-black text-[8px] leading-none">{deliveryDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- PRODUCT SEARCH & FILTER BLOCK (EXCLUDED FROM PRINT) --- */}
        <div className="mb-5 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-black" />
            <input
              type="text"
              placeholder="Search products in list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-[#356854] font-medium shadow-sm"
            />
          </div>
          
          <div className="flex gap-2.5 w-full sm:w-auto">
            {isEditingMode && (
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-[#A4C45A] hover:bg-[#92b04f] active:bg-[#819e44] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item Line
              </button>
            )}
            
            <div className="flex items-center gap-1.5 text-xs text-black font-bold ml-auto sm:ml-0">
              <span>Sort Table:</span>
              <button
                type="button"
                onClick={() => toggleSort('name')}
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] shadow-sm transition-all cursor-pointer ${sortBy === 'name' ? 'bg-[#356854] text-white border-[#356854]' : 'bg-slate-50 border-slate-200 text-black hover:bg-slate-100'}`}
              >
                Name <ArrowUpDown className="inline-block h-2.5 w-2.5 ml-0.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleSort('total')}
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] shadow-sm transition-all cursor-pointer ${sortBy === 'total' ? 'bg-[#356854] text-white border-[#356854]' : 'bg-slate-50 border-slate-200 text-black hover:bg-slate-100'}`}
              >
                Total <ArrowUpDown className="inline-block h-2.5 w-2.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- MAIN PRODUCT / TRANSIT TABLE --- */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-2.5 text-[8.5px] bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#356854' }} className="font-extrabold uppercase text-white text-[8px] tracking-wide">
                <th className="px-2.5 py-1.5 w-[5%] text-center">No</th>
                <th className="px-2.5 py-1.5 w-[38%]">Goods Nomenclature & Marks</th>
                <th className="px-2.5 py-1.5 w-[10%] text-center">HS Code</th>
                <th className="px-2.5 py-1.5 w-[10%] text-right">Qty</th>
                <th className="px-2.5 py-1.5 w-[12%] text-right">Unit Price</th>
                <th className="px-2.5 py-1.5 w-[8%] text-center">Tax %</th>
                <th className="px-2.5 py-1.5 w-[17%] text-right">Amount Total</th>
                {isEditingMode && <th className="px-1.5 py-1.5 w-[5%] text-center print:hidden">🗑️</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-black">
              {processedItems.length === 0 ? (
                <tr>
                  <td colSpan={isEditingMode ? 8 : 7} className="px-3 py-4 text-center text-black font-medium italic">
                    No products matching search criteria.
                  </td>
                </tr>
              ) : (
                processedItems.map((item, index) => (
                  <tr 
                    key={`${item.productId || 'item'}-${index}`} 
                    className="hover:bg-slate-50/40 transition-colors"
                    style={{ backgroundColor: index % 2 === 1 ? '#F3F4F6' : undefined }}
                  >
                    {/* S/N */}
                    <td className="px-2.5 py-1 text-center text-black font-mono text-[8px]">{index + 1}</td>
                    
                    {/* Item Name / Desc */}
                    <td className="px-2.5 py-1">
                      {isEditingMode ? (
                        <div className="space-y-1 print:space-y-0">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleUpdateItem(index, 'productName', e.target.value)}
                            className="w-full px-1 py-0.5 text-[9px] font-bold border border-slate-200 bg-white rounded-md"
                          />
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              value={item.productModel || ''}
                              placeholder="Model Name"
                              onChange={(e) => handleUpdateItem(index, 'productModel', e.target.value)}
                              className="px-1 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md font-mono"
                            />
                            <input
                              type="text"
                              value={item.serialNumber || ''}
                              placeholder="Serial Number"
                              onChange={(e) => handleUpdateItem(index, 'serialNumber', e.target.value)}
                              className="px-1 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-extrabold text-black block uppercase text-[8.5px]">{item.productName}</span>
                          {(item.productModel || item.serialNumber) && (
                            <span className="text-[7.5px] text-black block mt-0.5 font-mono">
                              {item.productModel && `Model: ${item.productModel}`}
                              {item.productModel && item.serialNumber && ' | '}
                              {item.serialNumber && `S/N: ${item.serialNumber}`}
                            </span>
                          )}
                          {item.description && showProdDescInPrint && (
                            <span className="text-[7.5px] text-black block mt-0.5 font-normal italic leading-normal bg-white p-0.5 px-1 rounded border border-slate-100">
                              {item.description}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* HS Code */}
                    <td className="px-2.5 py-1 text-center">
                      {isEditingMode ? (
                        <input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => handleUpdateItem(index, 'hsnCode', e.target.value)}
                          className="w-14 px-1 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md text-center font-mono"
                        />
                      ) : (
                        <span className="font-mono text-black font-bold text-[8px]">{item.hsnCode || '847130'}</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-2.5 py-1 text-right">
                      {isEditingMode ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                            className="w-10 px-1 py-0.5 text-[9px] border border-slate-200 bg-white rounded-md text-right font-mono"
                          />
                          <input
                            type="text"
                            value={item.unit || 'Pcs'}
                            placeholder="Unit"
                            onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                            className="w-7 px-1 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md uppercase font-bold"
                          />
                        </div>
                      ) : (
                        <span className="font-black text-black font-mono text-[8px]">
                          {item.quantity.toFixed(2)} <span className="text-[7.5px] text-black uppercase font-extrabold">{item.unit || 'Pcs'}</span>
                        </span>
                      )}
                    </td>

                    {/* Rate */}
                    <td className="px-2.5 py-1 text-right font-mono text-black text-[8px]">
                      {isEditingMode ? (
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(index, 'rate', Number(e.target.value))}
                          className="w-14 px-1 py-0.5 text-[9px] border border-slate-200 bg-white rounded-md text-right font-mono"
                        />
                      ) : (
                        formatCurrency(item.rate)
                      )}
                    </td>

                    {/* Tax Rate */}
                    <td className="px-2.5 py-1 text-center font-mono text-black text-[8px]">
                      {isEditingMode ? (
                        <input
                          type="number"
                          value={item.gstRate}
                          onChange={(e) => handleUpdateItem(index, 'gstRate', Number(e.target.value))}
                          className="w-8 px-1 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md text-center font-mono"
                        />
                      ) : (
                        `${item.gstRate.toFixed(0)}%`
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="px-2.5 py-1 text-right font-black text-black font-mono text-[8px]">
                      {formatCurrency(item.total)}
                    </td>

                    {/* Delete Line */}
                    {isEditingMode && (
                      <td className="px-1.5 py-1 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-rose-500 hover:text-rose-700 transition-colors p-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-bold text-black text-[8.5px]">
              <tr>
                <td colSpan={3} className="px-2.5 py-1 text-right text-black font-medium">SHIPPING WEIGHT / TABLE TOTALS:</td>
                <td className="px-2.5 py-1 text-right font-mono font-black">
                  {localItems.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
                </td>
                <td colSpan={isEditingMode ? 4 : 3} className="px-2.5 py-1 text-right font-mono font-black text-[#356854]">
                  {formatCurrency(computedTotals.subtotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* --- FINANCIAL SUMMARY & PAYMENT SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 mt-1">
          
          {/* Left Block: Payment Directives & Multi-Currency Indicator */}
          <div className="md:col-span-7 space-y-2">
            {/* Multi-Currency Box */}
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[8.5px] text-black space-y-1 font-semibold leading-normal shadow-sm">
              <p className="text-[7.5px] font-black text-[#356854] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Globe className="h-2.5 w-2.5 text-[#356854]" /> Multi-Currency Valuation & Foreign Exchange Rates
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <span className="block text-black font-bold text-[7px] uppercase leading-none">Base Denomination:</span>
                  <span className="font-extrabold text-black text-[8px]">INR (₹)</span>
                </div>
                <div>
                  <span className="block text-black font-bold text-[7px] uppercase leading-none">Selected Forex:</span>
                  <span className="font-extrabold text-black text-[8px]">{currencyInfo.code}</span>
                </div>
                <div>
                  <span className="block text-black font-bold text-[7px] uppercase leading-none">Current Rate:</span>
                  <span className="font-extrabold text-black font-mono text-[7.5px]">1 INR = {currencyInfo.rate} {currencyInfo.code}</span>
                </div>
              </div>
              <p className="text-[7px] text-black italic pt-0.5 leading-tight border-t border-slate-200 mt-0.5">
                Rates represent commercial interbank exchange valuations. Total amounts converted automatically.
              </p>
            </div>

            {/* Payment Account Directive Block */}
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[8.5px] leading-normal shadow-sm">
              <p className="text-[7.5px] font-black tracking-widest text-[#356854] uppercase mb-1 flex items-center gap-1">
                <CreditCard className="h-2.5 w-2.5 text-[#356854]" /> Approved Settlement Channels
              </p>
              
              {isEditingMode ? (
                <div className="space-y-1 text-xs">
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-2 py-1 text-[8px] font-bold border border-slate-200 bg-white rounded-md"
                  >
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="UPI">UPI Instant Pay</option>
                    <option value="Credit Card">International Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash Settle</option>
                    <option value="Cheque">Corporate Cheque</option>
                  </select>
                  <input
                    type="text"
                    value={bankName}
                    placeholder="Bank Name"
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-2 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md font-semibold"
                  />
                  <input
                    type="text"
                    value={accountNumber}
                    placeholder="Account Number"
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-2 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md font-semibold font-mono"
                  />
                  <input
                    type="text"
                    value={ifscCode}
                    placeholder="IFSC / SWIFT"
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-2 py-0.5 text-[8px] border border-slate-200 bg-white rounded-md font-semibold font-mono"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-0.5 text-black font-bold text-[8px]">
                  <p>Settlement Via: <span className="text-black font-black uppercase">{paymentMethod}</span></p>
                  <p>Bank: <span className="text-black font-black">{bankName}</span></p>
                  <p className="col-span-2">Account Number: <span className="text-black font-black font-mono">{accountNumber}</span></p>
                  <p>IFSC / SWIFT: <span className="text-black font-black font-mono">{ifscCode}</span></p>
                  {iban && <p className="col-span-2">IBAN Code: <span className="text-black font-black font-mono">{iban}</span></p>}
                </div>
              )}

              {/* UPI Instant QR Code for payments */}
              {companySettings.upiId && paymentMethod === 'UPI' && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg mt-1 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                      `upi://pay?pa=${companySettings.upiId}&pn=${encodeURIComponent(companySettings.companyName)}&am=${computedTotals.grandTotal.toFixed(2)}&tn=${encodeURIComponent(`Inv ${invoice.invoiceNumber}`)}&cu=INR`
                    )}`}
                    alt="UPI payment QR Code"
                    className="h-8 w-8 object-contain rounded border border-slate-100 bg-white p-0.5 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left">
                    <p style={{ color: '#356854' }} className="text-[7.5px] font-black uppercase tracking-tight flex items-center gap-0.5">⚡ UPI Direct Settlement</p>
                    <p className="text-[6.5px] text-black font-semibold leading-none mt-0.5">
                      Scan INR value securely.
                    </p>
                    <p className="text-[7px] font-black text-black font-mono mt-0.5 leading-none">UPI ID: {companySettings.upiId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Block: Financial calculations and highlighted grand total green card */}
          <div className="md:col-span-5 bg-slate-50 border border-[#A4C45A]/20 p-2.5 rounded-lg text-[8.5px] font-semibold space-y-1 flex flex-col justify-between shadow-sm">
            <div className="space-y-1 text-black font-bold">
              <div className="flex justify-between">
                <span>SUBTOTAL VALUE:</span>
                <span className="font-mono text-black font-black">{formatCurrency(computedTotals.subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>INTEGRATED / VALUE TAX (GST):</span>
                <span className="font-mono text-black font-black">{formatCurrency(computedTotals.totalTax)}</span>
              </div>

              {computedTotals.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>DISCOUNTS / CONCESSIONS:</span>
                  <span className="font-mono text-emerald-800 font-black">-{formatCurrency(computedTotals.totalDiscount)}</span>
                </div>
              )}

              {customShippingCharge > 0 && (
                <div className="flex justify-between">
                  <span>FREIGHT / SHIPPING CHARGES:</span>
                  <span className="font-mono text-black font-black">{formatCurrency(customShippingCharge)}</span>
                </div>
              )}

              {insuranceCost > 0 && (
                <div className="flex justify-between">
                  <span>MARINE / CARGO INSURANCE:</span>
                  <span className="font-mono text-black font-black">{formatCurrency(insuranceCost)}</span>
                </div>
              )}

              {packagingCost > 0 && (
                <div className="flex justify-between">
                  <span>PACKAGING / EXPORT CRATING:</span>
                  <span className="font-mono text-black font-black">{formatCurrency(packagingCost)}</span>
                </div>
              )}

              {otherCharges > 0 && (
                <div className="flex justify-between">
                  <span>SURCHARGES / OTHER FEES:</span>
                  <span className="font-mono text-black font-black">{formatCurrency(otherCharges)}</span>
                </div>
              )}
            </div>

            {/* GREEN TOTAL HERO BOX */}
            <div className="pt-1.5 border-t border-slate-200">
              <div style={{ backgroundColor: '#A4C45A' }} className="flex justify-between items-center text-white p-1.5 rounded shadow-sm">
                <span className="text-[7.5px] font-black tracking-widest uppercase">GRAND TOTAL DUE:</span>
                <span className="text-[10px] font-black font-mono text-white">
                  {formatCurrency(computedTotals.grandTotal)}
                </span>
              </div>

              {/* Amount Paid / Balance Due */}
              <div className="mt-1 space-y-0.5 text-[7.5px] px-1 text-black font-bold">
                <div className="flex justify-between">
                  <span>TRANSFERRED PREPAYMENT:</span>
                  <span className="font-mono text-black font-black">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-350 pt-0.5">
                  <span className="text-black font-black">UNPAID OUTSTANDING BALANCE:</span>
                  <span className={`font-mono font-black ${computedTotals.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                    {formatCurrency(computedTotals.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- NOTES & EXPORTER TERM STATEMENTS --- */}
        <div className="border-t border-slate-150 pt-2 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            {/* Terms & Exporter Return / Quality policy */}
            <div className="md:col-span-7 space-y-1">
              <p className="font-black text-[7.5px] text-[#356854] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <FileText className="h-2.5 w-2.5 text-[#356854]" /> REGULATORY TERMS & ADDITIONAL NOTES
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[7px] text-black font-semibold leading-normal">
                <div className="bg-slate-50 border border-slate-200/60 p-1 px-1.5 rounded">
                  <span className="block font-black text-[#356854] uppercase tracking-wide text-[6.5px] mb-0.5">1. Quality Guarantee</span>
                  <p>{qualityTerms}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-1 px-1.5 rounded">
                  <span className="block font-black text-[#356854] uppercase tracking-wide text-[6.5px] mb-0.5">2. Return & Refund Policy</span>
                  <p>{returnTerms}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-1 px-1.5 rounded">
                  <span className="block font-black text-[#356854] uppercase tracking-wide text-[6.5px] mb-0.5">3. Delivery & Customs</span>
                  <p>{regulatoryTerms}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-1 px-1.5 rounded">
                  <span className="block font-black text-[#356854] uppercase tracking-wide text-[6.5px] mb-0.5">4. Dispute Jurisdiction</span>
                  <p>{jurisdictionTerms}</p>
                </div>
              </div>
              
              <p className="text-[7.5px] text-black font-mono mt-0.5 font-black uppercase bg-slate-50 p-1 rounded border border-slate-150">
                Amt in Words ({currencyInfo.code}): {(() => {
                  const toWords = (num: number) => {
                     return `${currencyInfo.code} ${num.toLocaleString()} Only`;
                  }; 
                  return toWords(convertAmount(computedTotals.grandTotal));
                })()}
              </p>
            </div>

            {/* Signature Block & Company Seal Area */}
            <div className="md:col-span-5 flex flex-col items-end space-y-1 text-right">
              {/* Fake Seal Placeholder & Authorized Signature */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-dashed border-[#A4C45A]/60 flex items-center justify-center text-[5.5px] text-black text-center font-black font-mono leading-none">
                  OFFICIAL<br />EXPORTER<br />SEAL
                </div>
                
                <div className="space-y-0.5">
                  <div className="h-6 border-b border-slate-300 w-28"></div>
                  <p className="text-[7.5px] font-black text-black uppercase tracking-widest">
                    AUTHORIZED SIGNATURE
                  </p>
                  <p className="text-[6.5px] text-[#356854] font-semibold italic">
                    {companySettings.companyName}
                  </p>
                </div>
              </div>

              <p className="text-[6.5px] text-black font-mono font-black uppercase">
                Date certified: <span className="text-black">{invoice.date}</span>
              </p>
            </div>
          </div>

          {/* Standard Footer Note */}
          <div className="text-center md:text-left text-[7px] text-black pt-1.5 border-t border-slate-100 mt-2 font-normal font-mono uppercase flex justify-between">
            <span>Generated from EXPERT Accounting Software • A4 Portrait Commercial Conformity</span>
            <span className="text-black">ISO 9001:2015 Compliant Supply</span>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
};
