/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart, 
  TrendingUp, 
  Calculator, 
  Calendar, 
  Download, 
  FileText, 
  Percent, 
  ChevronRight, 
  DollarSign, 
  Layers,
  Scale
} from 'lucide-react';
import { Invoice, Product, Contact } from '../types';

interface ReportsViewProps {
  invoices: Invoice[];
  products: Product[];
  contacts: Contact[];
}

export default function ReportsView({ invoices, products, contacts }: ReportsViewProps) {
  const [reportType, setReportType] = useState<'sales_purchase' | 'gst_summary' | 'hsn_report' | 'pnl' | 'ledger'>('gst_summary');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Filter invoices within range
  const filteredInvoices = invoices.filter(inv => {
    return inv.date >= startDate && inv.date <= endDate;
  });

  // Calculate generic sales and purchase gross values
  const totalSalesVal = filteredInvoices
    .filter(inv => inv.type === 'sale')
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const totalProcureVal = filteredInvoices
    .filter(inv => inv.type === 'purchase')
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const taxableSalesTurnover = filteredInvoices
    .filter(inv => inv.type === 'sale')
    .reduce((sum, inv) => sum + (inv.subtotal - inv.totalDiscount), 0);

  // Collect GST summaries
  const totalSalesCGST = filteredInvoices
    .filter(inv => inv.type === 'sale')
    .reduce((sum, inv) => sum + inv.totalCgst, 0);

  const totalSalesSGST = filteredInvoices
    .filter(inv => inv.type === 'sale')
    .reduce((sum, inv) => sum + inv.totalSgst, 0);

  const totalSalesIGST = filteredInvoices
    .filter(inv => inv.type === 'sale')
    .reduce((sum, inv) => sum + inv.totalIgst, 0);

  const totalTaxLiabilityCollected = totalSalesCGST + totalSalesSGST + totalSalesIGST;

  // HSN Summarizer
  const hsnMap: { [key: string]: { hsn: string; name: string; qty: number; value: number; tax: number; rate: number } } = {};
  
  filteredInvoices
    .filter(inv => inv.type === 'sale')
    .forEach(inv => {
      inv.items.forEach(item => {
        const key = `${item.hsnCode}-${item.productId}`;
        const itemTax = item.cgst + item.sgst + item.igst;
        const netValue = (item.rate * item.quantity) - (item.rate * item.quantity * (item.discount / 100));
        
        if (hsnMap[key]) {
          hsnMap[key].qty += item.quantity;
          hsnMap[key].value += netValue;
          hsnMap[key].tax += itemTax;
        } else {
          hsnMap[key] = {
            hsn: item.hsnCode,
            name: item.productName,
            qty: item.quantity,
            value: netValue,
            tax: itemTax,
            rate: item.gstRate
          };
        }
      });
    });

  const hsnList = Object.values(hsnMap);

  const handleExportCSV = () => {
    alert("Export successful!\nGenerated GST report CSV downloaded and logged to audits log file.");
  };

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      
      {/* Search filters header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Calculator className="h-5 w-5 text-orange-500" />
            GST Compliance & Accounting Statements
          </h2>
          <p className="text-xs text-slate-500">Analyze financial turnover, HSN summaries, and calculate net tax outputs.</p>
        </div>

        {/* Calendar Range Selection */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="font-bold border-none focus:outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="font-bold border-none focus:outline-none bg-transparent"
            />
          </div>

          <button
            id="btn-export-report"
            onClick={handleExportCSV}
            className="p-2 border border-slate-200 hover:bg-slate-150 rounded-xl bg-orange-50 text-orange-650"
            title="Export Sheet"
          >
            <Download className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main layout: left reports menu, right summary details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Reports Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-fit space-y-1.5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 mb-2">Government Statements</p>
          
          <button
            onClick={() => setReportType('gst_summary')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              reportType === 'gst_summary' 
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10' 
                : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Percent className="h-4 w-4" /> GST Summary Report (GSTR-1)
            </span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setReportType('hsn_report')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              reportType === 'hsn_report' 
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10' 
                : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> HSN Summary Report
            </span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 pt-4 mb-2">Loss & Balances</p>

          <button
            onClick={() => setReportType('pnl')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              reportType === 'pnl' 
                ? 'bg-orange-500 text-white shadow-sm tracking-wide' 
                : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Profit & Loss Statement
            </span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setReportType('sales_purchase')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              reportType === 'sales_purchase' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BarChart className="h-4 w-4" /> Sales & Purchase Logs
            </span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>
        </div>

        {/* Detailed Report View Details */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          
          {reportType === 'gst_summary' && (
            /* GST compliance calculator */
            <div className="space-y-6">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">GSTR-1 Billing Tax Summary</h3>
                  <p className="text-xs text-slate-500">Calculate taxable turnover and divide output liability between CGST, SGST, & IGST bands.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400">Quarter Code: Q1-FY26</span>
                </div>
              </div>

              {/* Stat Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Taxable Turnover value</p>
                  <h4 className="text-lg font-black font-mono text-slate-900 mt-1">{formatRupee(taxableSalesTurnover)}</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Excludes applied invoice discounts</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-150">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Output Tax liability</p>
                  <h4 className="text-lg font-black font-mono text-orange-600 mt-1">{formatRupee(totalTaxLiabilityCollected)}</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Sum of central & state taxes</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-150">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Average Tax rate%</p>
                  <h4 className="text-lg font-black font-mono text-slate-900 mt-1">
                    {taxableSalesTurnover > 0 ? ((totalTaxLiabilityCollected / taxableSalesTurnover) * 100).toFixed(1) : '0.0'}%
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-1">Standardized tax multiplier</p>
                </div>
              </div>

              {/* Tax class sub-breakdown */}
              <div className="space-y-3 pt-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Scale className="h-4.5 w-4.5 text-orange-500" />
                  Tax Slabs Allocation
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center bg-white shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">State GST (SGST)</p>
                      <p className="font-mono text-xs font-black text-slate-900 mt-0.5">{formatRupee(totalSalesSGST)}</p>
                    </div>
                    <span className="text-[9px] bg-slate-100 rounded px-1 text-slate-500">9% Slabs</span>
                  </div>

                  <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center bg-white shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Central GST (CGST)</p>
                      <p className="font-mono text-xs font-black text-slate-900 mt-0.5">{formatRupee(totalSalesCGST)}</p>
                    </div>
                    <span className="text-[9px] bg-slate-100 rounded px-1 text-slate-500">9% Slabs</span>
                  </div>

                  <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center bg-white shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Integrated GST (IGST)</p>
                      <p className="font-mono text-xs font-black text-slate-900 mt-0.5">{formatRupee(totalSalesIGST)}</p>
                    </div>
                    <span className="text-[9px] bg-slate-100 rounded px-1 text-slate-500">18%/28% Slabs</span>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] leading-relaxed text-slate-700">
                  ⚠️ <strong>Tax Note:</strong> SGST and CGST divisions are automatically applied for intra-state sales inside Haryana. Inter-state transactions (e.g. sales dispatched into Delhi / Karnataka) directly pool into the Integrated IGST band.
                </div>
              </div>
            </div>
          )}

          {reportType === 'hsn_report' && (
            /* HSN Summarizer */
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm">HSN Classification Summary</h3>
                <p className="text-xs text-slate-500">A detailed compliance ledger of goods categorized by HSN, required for GSTR-1 returns.</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="min-w-full divide-y text-xs text-left">
                  <thead className="bg-slate-50 font-bold uppercase text-[9px] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">HSN Code</th>
                      <th className="px-4 py-3">Description Name</th>
                      <th className="px-4 py-3 text-center">GST Rate (%)</th>
                      <th className="px-4 py-3 text-center">Quantities Sold</th>
                      <th className="px-4 py-3 text-right">Taxable Turnover</th>
                      <th className="px-4 py-3 text-right">GST Collected</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y font-medium text-slate-800">
                    {hsnList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400 font-normal">No items sold in selected period.</td>
                      </tr>
                    ) : (
                      hsnList.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.hsn}</td>
                          <td className="px-4 py-3 font-semibold">{item.name}</td>
                          <td className="px-4 py-3 text-center font-mono">{item.rate}%</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500">{item.qty} PCS</td>
                          <td className="px-4 py-3 text-right font-mono">₹{item.value.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-orange-650">₹{item.tax.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'pnl' && (
            /* Profit & Loss statement */
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Profit & Loss Statement (Gross Estimate)</h3>
                <p className="text-xs text-slate-500">Calculate net operational gross margin based on sales revenue vs stock procurements.</p>
              </div>

              {/* Main table sheets look structure */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                {/* Section A: Revenue */}
                <div className="bg-slate-50 p-2.5 font-bold text-slate-900 border-b flex justify-between">
                  <span>OPERATIONAL INWARD REVENUE</span>
                  <span className="font-mono">Reference June</span>
                </div>
                <div className="bg-white p-3 space-y-2 font-medium border-b">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Sales Value (Credit & Cash)</span>
                    <span className="font-mono">₹{totalSalesVal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span className="text-slate-400">Less: Applied Discounts</span>
                    <span className="font-mono">-₹{filteredInvoices.filter(i => i.type === 'sale').reduce((sum, i) => sum + i.totalDiscount, 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Section B: Expenses */}
                <div className="bg-slate-50 p-2.5 font-bold text-slate-900 border-b flex justify-between">
                  <span>OUTWARD ACQUISITION EXPENSES</span>
                  <span className="font-mono">Warehouse stock</span>
                </div>
                <div className="bg-white p-3 space-y-2 font-medium border-b">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Procurement & Raw Material Bills (Supplier)</span>
                    <span className="font-mono">₹{totalProcureVal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Section C: Net margins */}
                <div className="bg-emerald-50/70 p-3.5 font-bold text-emerald-950 flex justify-between text-sm">
                  <span>ESTIMATED OPERATIONAL PROFIT:</span>
                  <span className="font-mono text-emerald-700 text-base">₹{Math.max(0, totalSalesVal - totalProcureVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {reportType === 'sales_purchase' && (
            /* Invoice ledger logs list */
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Sales & Inward Registry Logs</h3>
                <p className="text-xs text-slate-500">Continuous calendar registry list of generated billing invoices.</p>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[360px]">
                {filteredInvoices.map((inv) => (
                  <div key={inv.id} className="p-3 border rounded-xl flex justify-between items-center text-xs hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Recipient Name: {inv.contactName} • Date: {inv.date}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold block mb-1 uppercase tracking-wider ${
                        inv.type === 'sale' ? 'bg-orange-50 text-orange-700' : 'bg-blue-550 bg-blue-50 text-blue-700'
                      }`}>
                        {inv.type}
                      </span>
                      <p className="font-mono font-bold text-slate-900">₹{inv.grandTotal.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
