import React, { useState, useEffect, useMemo } from 'react';
import { 
  QrCode, Copy, Download, Check, RotateCcw, Edit2, 
  CreditCard, Smartphone, Sparkles, Info, ExternalLink, 
  Palette, RefreshCw, Eye, CheckCircle2, DollarSign
} from 'lucide-react';
import { Invoice, CompanySettings } from '../types';

interface QRCodeGeneratorProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  onApplyToInvoice?: (customQrUrl: string) => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  invoice,
  companySettings,
  onApplyToInvoice
}) => {
  // State for editable UPI / Payment variables
  const [upiId, setUpiId] = useState(companySettings.upiId || 'payee@okbank');
  const [payeeName, setPayeeName] = useState(companySettings.companyName || 'Business Name');
  const [invoiceId, setInvoiceId] = useState(invoice.invoiceNumber || '');
  const [amount, setAmount] = useState<number>(invoice.grandTotal || 0);
  const [paymentNote, setPaymentNote] = useState(`Payment for Invoice ${invoice.invoiceNumber || ''}`);
  
  // Custom payment gateway link support
  const [useCustomLink, setUseCustomLink] = useState(false);
  const [customLink, setCustomLink] = useState(`https://payment-gateway.com/pay?invoice=${invoice.invoiceNumber || ''}&amount=${invoice.grandTotal || 0}`);

  // Style and aesthetics customization
  const [qrSize, setQrSize] = useState(180);
  const [fgColor, setFgColor] = useState('#1e293b'); // Dark Slate/Charcoal by default
  const [bgColor, setBgColor] = useState('#ffffff');
  const [centerLogo, setCenterLogo] = useState<'upi' | 'rupay' | 'gpay' | 'none'>('upi');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync state if invoice changes
  useEffect(() => {
    if (invoice) {
      setInvoiceId(invoice.invoiceNumber || '');
      setAmount(invoice.grandTotal || 0);
      setPaymentNote(`Payment for Invoice ${invoice.invoiceNumber || ''}`);
      setCustomLink(`https://payment-gateway.com/pay?invoice=${invoice.invoiceNumber || ''}&amount=${invoice.grandTotal || 0}`);
    }
  }, [invoice]);

  // Construct the payment link or UPI URI
  const finalPaymentLink = useMemo(() => {
    if (useCustomLink) {
      return customLink;
    }
    // Standard UPI Link scheme: upi://pay?pa=address&pn=name&am=amount&tn=note&cu=INR
    const encodedPa = encodeURIComponent(upiId.trim());
    const encodedPn = encodeURIComponent(payeeName.trim());
    const encodedAm = encodeURIComponent(amount.toFixed(2));
    const encodedTn = encodeURIComponent(paymentNote.trim());
    
    return `upi://pay?pa=${encodedPa}&pn=${encodedPn}&am=${encodedAm}&tn=${encodedTn}&cu=INR`;
  }, [useCustomLink, customLink, upiId, payeeName, amount, paymentNote]);

  // Generate qrserver URL with custom background and foreground colors
  const qrCodeUrl = useMemo(() => {
    const rawFg = fgColor.replace('#', '');
    const rawBg = bgColor.replace('#', '');
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(finalPaymentLink)}&color=${rawFg}&bgcolor=${rawBg}&ecc=H`;
  }, [finalPaymentLink, qrSize, fgColor, bgColor]);

  // Copy payment link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalPaymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset parameters to match current invoice defaults
  const handleReset = () => {
    setUpiId(companySettings.upiId || 'payee@okbank');
    setPayeeName(companySettings.companyName || 'Business Name');
    setInvoiceId(invoice.invoiceNumber || '');
    setAmount(invoice.grandTotal || 0);
    setPaymentNote(`Payment for Invoice ${invoice.invoiceNumber || ''}`);
    setUseCustomLink(false);
    setFgColor('#1e293b');
    setBgColor('#ffffff');
    setCenterLogo('upi');
    
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Download QR Code function
  const handleDownloadQR = () => {
    // We open the QR code image URL in a new tab or trigger download
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.target = '_blank';
    link.download = `QR_Invoice_${invoiceId || 'Payment'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-orange-500/10 p-2 rounded-2xl text-orange-600">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              Instant Payment QR Generator <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-500">
              Create and preview custom UPI payment QRs encoded with Invoice ID, billing amount, and payment note.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Reset to Invoice Defaults"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* Left Side: Generator Form Inputs (8 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setUseCustomLink(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                !useCustomLink 
                  ? 'bg-white text-orange-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📱 Standard UPI App QR
            </button>
            <button
              type="button"
              onClick={() => setUseCustomLink(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                useCustomLink 
                  ? 'bg-white text-orange-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔗 Custom Payment Link QR
            </button>
          </div>

          {!useCustomLink ? (
            /* UPI CONFIG FIELDS */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  UPI VPA / ID Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. merchant@okaxis"
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold text-slate-800 transition-all"
                  />
                  <div className="absolute right-3 top-2.5 flex items-center text-[8px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                    UPI Active
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Payee / Business Name
                </label>
                <input
                  type="text"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Billing Amount (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono font-bold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Invoice ID / Reference
                </label>
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="e.g. INV-1002"
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold text-slate-800 transition-all"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Payment Description / Memo
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Enter custom transaction note..."
                  maxLength={50}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-slate-800 transition-all"
                />
                <p className="text-[9px] text-slate-400">
                  Most banks only accept up to 50 characters in the transaction note.
                </p>
              </div>
            </div>
          ) : (
            /* CUSTOM GATEWAY LINK FIELD */
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Direct Payment Link / Gateway URL
                </label>
                <input
                  type="url"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  placeholder="https://razorpay.me/@acme"
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono font-bold text-slate-800 transition-all"
                />
                <p className="text-[9px] text-slate-400">
                  Enter any direct payment gateway URL (e.g., Stripe, Razorpay, Instamojo, PayPal) with your invoice information appended.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Invoice ID (For Reference Only)
                  </label>
                  <input
                    type="text"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Billing Amount (For Reference Only)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* QR Code Appearance & Stylist options */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3.5">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-orange-500" /> QR Code Styling & Colors
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Foreground Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-7 w-10 p-0 border border-slate-200 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-20 px-1.5 py-1 text-[10px] border border-slate-200 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Background Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-7 w-10 p-0 border border-slate-200 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-20 px-1.5 py-1 text-[10px] border border-slate-200 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Center Logo Badge</label>
                <select
                  value={centerLogo}
                  onChange={(e: any) => setCenterLogo(e.target.value)}
                  className="w-full px-2 py-1.5 text-[10px] border border-slate-200 bg-white rounded-lg font-bold"
                >
                  <option value="upi">UPI Logo</option>
                  <option value="rupay">RuPay Card</option>
                  <option value="gpay">GPay Icon</option>
                  <option value="none">No Badge (Faster Scan)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-500">
              <Info className="h-3 w-3 text-slate-400" />
              <span>For reliable scans, maintain a high contrast between foreground and background.</span>
            </div>
          </div>

        </div>

        {/* Right Side: Smartphone / Preview Ticket (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          
          {/* Smart Phone Frame Container */}
          <div className="relative w-full max-w-[260px] bg-slate-900 rounded-[36px] p-3 shadow-xl border-4 border-slate-850">
            {/* Phone Speaker/Camera Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-slate-50 rounded-[28px] overflow-hidden pt-5 px-3 pb-3 min-h-[360px] flex flex-col justify-between text-center relative z-10">
              
              {/* Payment Hub Header */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-[8px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                  Secure Merchant Pay
                </span>
                <p className="text-[11px] font-black text-slate-800 uppercase mt-1.5 truncate max-w-[180px] mx-auto">
                  {payeeName}
                </p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                  INV: {invoiceId}
                </p>
              </div>

              {/* QR Image Box */}
              <div className="my-3 flex flex-col items-center justify-center relative">
                <div className="bg-white p-3 rounded-2xl border border-slate-150/80 shadow-xs relative overflow-hidden transition-all duration-300">
                  {isRefreshing ? (
                    <div className="h-[140px] w-[140px] flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={qrCodeUrl}
                        alt="Generated Payment QR"
                        className="h-[140px] w-[140px] object-contain select-none transition-opacity duration-300"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Optional Overlay Central Badge */}
                      {centerLogo !== 'none' && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-md shadow-xs border border-slate-100 flex items-center justify-center">
                          {centerLogo === 'upi' && (
                            <span className="text-[7px] font-black text-blue-800 tracking-tighter uppercase px-1 py-0.5 bg-blue-50 rounded">UPI</span>
                          )}
                          {centerLogo === 'rupay' && (
                            <span className="text-[7px] font-black text-orange-800 tracking-tighter uppercase px-1 py-0.5 bg-orange-50 rounded">RuPay</span>
                          )}
                          {centerLogo === 'gpay' && (
                            <span className="text-[7px] font-black text-green-800 tracking-tighter uppercase px-1 py-0.5 bg-green-50 rounded">GPay</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Dynamic Scan Info text */}
                <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase mt-2 flex items-center gap-1 justify-center">
                  <Smartphone className="h-3 w-3 text-orange-500" /> scan with any upi app
                </span>
              </div>

              {/* Financial Box */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-150/80 text-left space-y-1">
                <div className="flex justify-between text-[8px] font-bold text-slate-400">
                  <span>BILL TOTAL</span>
                  <span>UPI CURRENCY</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900 font-mono">
                    ₹{amount.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 font-mono">
                    INR
                  </span>
                </div>
              </div>

              {/* Fake Network Status */}
              <div className="flex items-center justify-center gap-1.5 mt-2 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Active Secure Connection</span>
              </div>

            </div>
          </div>

          {/* Action Tools Beneath Preview */}
          <div className="w-full mt-4 flex flex-col sm:flex-row gap-2 max-w-[260px]">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer border ${
                copied 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex-1 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Download QR
            </button>
          </div>

          {onApplyToInvoice && (
            <button
              type="button"
              onClick={() => {
                onApplyToInvoice(qrCodeUrl);
              }}
              className="w-full mt-2 py-1.5 max-w-[260px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-1 shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Apply QR Code to Invoice
            </button>
          )}

        </div>

      </div>

      {/* Footer Informational Info Box */}
      <div className="bg-slate-50 px-6 py-4.5 border-t border-slate-150 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10.5px] leading-relaxed text-slate-500">
        <div>
          <span className="font-bold text-slate-700 block uppercase mb-0.5">Scan Requirements</span>
          Customers can use GPay, PhonePe, Paytm, BHIM, or any mobile banking app. The app will automatically populate the exact business name, invoice reference, and amount.
        </div>
        <div>
          <span className="font-bold text-slate-700 block uppercase mb-0.5">Payment Link Format</span>
          <code className="bg-slate-200/60 text-slate-700 px-1.5 py-0.5 rounded text-[9.5px] block truncate font-mono mt-0.5">
            {finalPaymentLink}
          </code>
        </div>
      </div>
    </div>
  );
};
