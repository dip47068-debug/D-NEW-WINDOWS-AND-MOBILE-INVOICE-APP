/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Package, 
  Plus, 
  AlertTriangle, 
  Coins, 
  IndianRupee, 
  Truck, 
  Layers, 
  Briefcase,
  AlertCircle,
  Brain,
  Sparkles,
  RefreshCw,
  Send,
  MessageSquare,
  Bot
} from 'lucide-react';
import { Invoice, Contact, Product, UserProfile } from '../types';

interface DashboardViewProps {
  invoices: Invoice[];
  contacts: Contact[];
  products: Product[];
  userProfile?: UserProfile;
  onNavigate: (view: 'dashboard' | 'sales' | 'purchases' | 'debit' | 'credit' | 'products' | 'reports' | 'settings') => void;
  onQuickInvoice: (type: 'sale' | 'purchase') => void;
}

export default function DashboardView({ invoices, contacts, products, userProfile, onNavigate, onQuickInvoice }: DashboardViewProps) {
  // AI States
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [aiError, setAiError] = React.useState('');
  const [aiResult, setAiResult] = React.useState<{
    trendsSummary: string;
    predictions: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      predictedMonthlyDemand: number;
      restockDate: string;
      recommendedQuantity: number;
      priority: 'High' | 'Medium' | 'Low';
      reason: string;
    }>;
    additionalInsights: string[];
  } | null>(() => {
    try {
      const cached = localStorage.getItem('vyapar_ai_predictions');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const handleFetchAiAnalysis = async () => {
    setLoadingAi(true);
    setAiError('');
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sales-trends-restocking',
          context: {
            invoices,
            products
          }
        })
      });
      const data = await response.json();
      if (response.ok && data.text) {
        const parsed = JSON.parse(data.text);
        setAiResult(parsed);
        localStorage.setItem('vyapar_ai_predictions', JSON.stringify(parsed));
      } else {
        setAiError(data.error || 'Failed to generate AI insights.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error contacting Gemini API.');
    } finally {
      setLoadingAi(false);
    }
  };

  // AI Chat Bot State & Handlers
  const [chatMessages, setChatMessages] = React.useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { 
      sender: 'ai', 
      text: "Hello! I am your D Billify GST Business Assistant. I am fully aware of your products inventory, corporate ledger, and active invoices. Ask me any question, such as drafting letters, compiling low stock items, summarizing profit, or explaining tax regulations!" 
    }
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const [loadingChat, setLoadingChat] = React.useState(false);
  const [chatError, setChatError] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim() || loadingChat) return;

    // Append user message
    const updatedMessages = [...chatMessages, { sender: 'user', text: promptToSend }];
    setChatMessages(updatedMessages);
    if (!customPrompt) setChatInput('');
    setLoadingChat(true);
    setChatError('');

    try {
      const history = updatedMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          history: history,
          context: {
            invoices,
            products,
            contacts,
            todayStr
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.text }]);
      } else {
        setChatError(data.error || 'Failed to get an AI reply.');
      }
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || 'Error communicating with AI.');
    } finally {
      setLoadingChat(false);
    }
  };

  // Calculations
  const todayStr = "2026-06-11"; // Centered at current local simulation date

  // 1. Today's sales
  const todaysSales = invoices
    .filter(inv => inv.type === 'sale' && inv.date === todayStr)
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  // 2. Today's purchases
  const todaysPurchases = invoices
    .filter(inv => inv.type === 'purchase' && inv.date === todayStr)
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  // 3. Receivables (Customer balance dues)
  const totalReceivables = contacts
    .filter(c => c.type === 'customer')
    .reduce((sum, c) => sum + Math.max(0, c.balance), 0);

  // 4. Payables (Supplier balances)
  const totalPayables = contacts
    .filter(c => c.type === 'supplier')
    .reduce((sum, c) => sum + Math.max(0, c.balance), 0);

  // 5. Total customers and suppliers
  const totalCustomersCount = contacts.filter(c => c.type === 'customer').length;
  const totalSuppliersCount = contacts.filter(c => c.type === 'supplier').length;

  // 6. Monthly profit calculation
  // Monthly Sales Grand Total - Monthly Purchase Grand Total (can also subtract inventory cost, but standard Gross Profit is nicely shown)
  const monthlySales = invoices
    .filter(inv => inv.type === 'sale' && inv.date.startsWith("2026-06"))
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const monthlyPurchases = invoices
    .filter(inv => inv.type === 'purchase' && inv.date.startsWith("2026-06"))
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const monthlyProfit = Math.max(0, monthlySales - monthlyPurchases);

  // Stock counts and alerts
  const lowStockAlerts = products.filter(p => p.stockQuantity <= p.lowStockAlert);

  // Format helper
  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-md border border-slate-700/50">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            Merchant Core Live Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Running GSTIN compliance system • Active session data for Rudra Enterprises
          </p>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="btn-quick-sale"
            onClick={() => onQuickInvoice('sale')}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20"
          >
            <Plus className="h-4 w-4" /> Quick Invoice
          </button>
          <button
            id="btn-quick-purchase"
            onClick={() => onQuickInvoice('purchase')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 border border-slate-650 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4 text-orange-400" /> Record Purchase
          </button>
        </div>
      </div>

      {/* 2x3 Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Today's Sales</p>
            <h4 className="text-2xl font-bold font-mono text-slate-900">{formatRupee(todaysSales)}</h4>
            <div className="flex items-center text-xs text-emerald-600 font-bold gap-1 mt-1">
              <TrendingUp className="h-3.5 w-3.5" /> Live billing update
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Today's Purchases</p>
            <h4 className="text-2xl font-bold font-mono text-slate-900">{formatRupee(todaysPurchases)}</h4>
            <p className="text-xs text-slate-400 mt-1">Acquisition & warehouse bills</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-center text-blue-600">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        {/* Total Receivables (Due from Customers) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigate('debit')}>
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Total Receivable</p>
            <h4 className="text-2xl font-bold font-mono text-orange-600">{formatRupee(totalReceivables)}</h4>
            <span className="text-xs font-bold text-orange-500 select-none hover:underline">
              Outstanding debit ledger ↗
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        {/* Total Payables (Due to Suppliers) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigate('credit')}>
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Total Payable</p>
            <h4 className="text-2xl font-bold font-mono text-slate-900">{formatRupee(totalPayables)}</h4>
            <span className="text-xs font-bold text-blue-600 select-none hover:underline">
              Outstanding credit ledger ↗
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Truck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Second Row Counters (Customers, Suppliers, Monthly profit, Low Stock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex items-center gap-4 border border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-slate-850 flex items-center justify-center text-orange-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Customers</p>
            <h4 className="text-lg font-bold font-mono">{totalCustomersCount} Accounts</h4>
            <button onClick={() => onNavigate('debit')} className="text-[10px] text-orange-400 hover:underline">Manage Sales Ledger →</button>
          </div>
        </div>

        {/* Total Suppliers */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex items-center gap-4 border border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-slate-850 flex items-center justify-center text-blue-300">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Suppliers</p>
            <h4 className="text-lg font-bold font-mono">{totalSuppliersCount} Accounts</h4>
            <button onClick={() => onNavigate('credit')} className="text-[10px] text-blue-300 hover:underline">Manage Supplier Ledger →</button>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex items-center gap-4 border border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Gross Monthly profit</p>
            <h4 className="text-lg font-bold font-mono text-emerald-400">{formatRupee(monthlyProfit)}</h4>
            <p className="text-[10px] text-slate-400">Based on June 2026 data</p>
          </div>
        </div>

        {/* Stock Alerts count */}
        <div 
          onClick={() => onNavigate('products')} 
          className={`p-4 rounded-2xl shadow-sm flex items-center gap-4 border cursor-pointer transition-all ${
            lowStockAlerts.length > 0 
              ? 'bg-orange-50 border-orange-200 text-orange-950 hover:bg-orange-100/70' 
              : 'bg-white border-slate-150 text-slate-900'
          }`}
        >
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            lowStockAlerts.length > 0 ? 'bg-orange-200 text-orange-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Low Stock Alerts</p>
            <h4 className="text-lg font-bold font-mono">
              {lowStockAlerts.length} Products
            </h4>
            <span className="text-[10px] font-bold hover:underline">Check Inventory →</span>
          </div>
        </div>
      </div>

      {/* Gemini AI Sales Trends & Restocking Panel */}
      <div id="gemini-ai-analytics-panel" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-650">
              <Brain className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 font-sans tracking-tight">
                Gemini AI Predictive Sales & Procurement Desk
                <span className="bg-emerald-50 text-emerald-750 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-widest animate-pulse">
                  Active Intelligence
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Automated seasonal trend forecasting, dynamic inventory burn rates, and intelligent reorder thresholds.
              </p>
            </div>
          </div>

          {userProfile?.aiEnabled !== false && (
            <button
              id="btn-run-ai-forecast"
              onClick={handleFetchAiAnalysis}
              disabled={loadingAi}
              className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-500 font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              {loadingAi ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Analyzing Ledger...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                  {aiResult ? 'Recalculate AI Forecast' : 'Run Gemini AI Forecast'}
                </>
              )}
            </button>
          )}
        </div>

        {userProfile?.aiEnabled === false ? (
          <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-slate-200 text-slate-500">
              <Brain className="h-6 w-6" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
              Gemini AI Predictive Panel Disabled
            </h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-normal">
              Predictive forecasting is deactivated based on your security configuration. 
              To activate Gemini-powered sales trends analysis and inventory optimization insights, 
              please head to <strong>Company Setup</strong> &rarr; <strong>Settings</strong> and enable 
              "Enable Gemini AI Dashboard".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingAi && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <div className="p-4 rounded-full bg-orange-50 text-orange-500 ring-4 ring-orange-500/10 animate-bounce">
                    <Brain className="h-8 w-8" />
                  </div>
                  <span className="absolute inset-0 rounded-full border border-orange-500 animate-ping"></span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-900">Contacting Gemini AI Engine...</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Analyzing active invoice logs, item frequencies, and current inventory levels...
                  </p>
                </div>
              </div>
            )}

            {aiError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Gemini AI Connection Error</p>
                  <p className="mt-0.5 text-red-700">{aiError}</p>
                  <button
                    onClick={handleFetchAiAnalysis}
                    className="mt-2 text-[10px] font-bold text-red-900 bg-red-150 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Retry Analysis
                  </button>
                </div>
              </div>
            )}

            {!loadingAi && !aiError && !aiResult && (
              <div className="py-10 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-slate-50 text-slate-400 border">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                    Ready for Predictive Diagnostics
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-normal font-sans">
                    Let Gemini read your ledger sales invoices, match against products stock, and suggest optimal restock schedules dynamically.
                  </p>
                </div>
                <button
                  onClick={handleFetchAiAnalysis}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  ✨ Run First AI Analysis
                </button>
              </div>
            )}

            {!loadingAi && !aiError && aiResult && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trends summary and insights */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      📈 Seasonal Sales Trends
                    </h4>
                    <p className="text-xs text-slate-900 font-bold leading-relaxed font-sans">
                      {aiResult.trendsSummary}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50/40 border border-amber-200/50 rounded-xl space-y-2">
                    <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      💡 Strategic AI Action Items
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-900">
                      {aiResult.additionalInsights?.map((insight, idx) => (
                        <li key={idx} className="flex gap-1.5 items-start">
                          <span className="text-amber-500 font-extrabold shrink-0">•</span>
                          <span className="font-bold font-sans">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Restocking predictions matrix table */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-sans">
                    📋 Stock Burn Rate & Restocking Priority Grid
                  </h4>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-xs text-left text-slate-700">
                      <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b">
                        <tr>
                          <th className="px-3 py-2.5">Product Name</th>
                          <th className="px-3 py-2.5 text-center">Stock</th>
                          <th className="px-3 py-2.5 text-center">Est. Monthly Sales</th>
                          <th className="px-3 py-2.5 text-center">Reorder Vol</th>
                          <th className="px-3 py-2.5">Priority</th>
                          <th className="px-3 py-2.5">Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {aiResult.predictions?.map((pred, index) => (
                          <React.Fragment key={index}>
                            <tr className="hover:bg-slate-50/50 font-medium">
                              <td className="px-3 py-2.5 font-bold text-slate-900 font-sans">{pred.productName}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold">
                                <span className={pred.currentStock <= 10 ? 'text-red-650' : 'text-slate-900'}>
                                  {pred.currentStock}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono text-slate-950 font-bold">{pred.predictedMonthlyDemand}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-slate-900 font-extrabold">
                                {pred.recommendedQuantity}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                                  pred.priority === 'High' 
                                    ? 'bg-red-100 text-red-800 border border-red-200 font-bold' 
                                    : pred.priority === 'Medium'
                                      ? 'bg-orange-100 text-orange-850 border border-orange-200 font-bold'
                                      : 'bg-slate-100 text-slate-700 font-bold'
                                }`}>
                                  {pred.priority}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-bold text-slate-900 font-sans">{pred.restockDate}</td>
                            </tr>
                            <tr className="bg-slate-50/20 text-[11px] border-b">
                              <td colSpan={6} className="px-3 py-1.5 italic text-slate-900 font-semibold font-sans">
                                <strong>Advisory:</strong> {pred.reason}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive AI Business Assistant Chat Bot */}
      <div id="gemini-ai-chat-panel" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-650 flex-shrink-0">
            <Bot className="h-5 w-5 text-orange-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 font-sans tracking-tight">
              Interactive D Billify AI Chat Assistant
              <span className="bg-orange-50 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-orange-100 uppercase tracking-widest animate-pulse">
                Active Context Aware
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Ask questions about sales performance, invoice details, product stock levels, taxes, or request template drafts in real time.
            </p>
          </div>
        </div>

        {userProfile?.aiEnabled === false ? (
          <div className="p-5 bg-slate-50 rounded-xl text-center text-xs text-slate-500 font-medium">
            🤖 AI Chat Assistant deactivated based on company security settings. Head to Settings &gt; Company Setup and enable "Enable Gemini AI Dashboard" to activate.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Quick Prompt Suggesters */}
            <div className="lg:col-span-1 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                💡 Instant Inquiries
              </span>
              <div className="flex flex-row flex-wrap lg:flex-col gap-2">
                {[
                  { label: "📊 June Sales Summary", prompt: "Summarize my sales performance and invoices for June 2026. What is the total volume and average ticket size?" },
                  { label: "⚠️ Find Low Stock", prompt: "Which of my products are currently low in stock? Give me a list with names and their low stock alert values." },
                  { label: "🧾 Draft Unpaid Reminder", prompt: "Draft a polite professional email reminder that I can send to a customer who has unpaid invoices." },
                  { label: "💼 Strategies to Boost Profit", prompt: "Analyze my products and invoices to give 3 highly specific strategies for Rudra Enterprises to increase gross monthly profit next month." },
                  { label: "📋 Explain CGST/SGST/IGST", prompt: "Explain how GST taxes (CGST, SGST, IGST) are calculated and applied to intra-state vs inter-state transactions in India." }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChatMessage(s.prompt)}
                    disabled={loadingChat}
                    className="text-left w-full p-2 bg-slate-50 hover:bg-orange-50/50 hover:text-orange-950 border border-slate-100 hover:border-orange-200 rounded-xl text-[11px] font-bold text-slate-700 transition duration-150 cursor-pointer text-wrap"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Chat Interface */}
            <div className="lg:col-span-3 flex flex-col h-[340px] border border-slate-100 rounded-xl bg-slate-50/20 overflow-hidden">
              {/* Messages Area */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-thin">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white font-semibold rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-100 shadow-sm font-medium rounded-tl-none whitespace-pre-wrap'
                    }`}>
                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black text-orange-600 uppercase tracking-widest border-b border-dashed border-slate-100 pb-0.5 select-none">
                          <Bot className="h-3 w-3 text-orange-500 animate-pulse" /> D Billify AI
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl p-3 text-xs text-slate-500 rounded-tl-none flex items-center gap-2 shadow-sm font-semibold">
                      <Bot className="h-3.5 w-3.5 animate-spin text-orange-500" />
                      Gemini is formulating business advisory...
                    </div>
                  </div>
                )}

                {chatError && (
                  <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-[11px] border border-red-100">
                    ⚠️ Error: {chatError}
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                className="p-2 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={loadingChat}
                  placeholder="Ask Gemini about sales, draft emails, check inventory..."
                  className="flex-grow px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:outline-none focus:border-orange-500 disabled:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  disabled={loadingChat || !chatInput.trim()}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl transition cursor-pointer shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Visual Analytics & Recent Ledger Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Simulation Chart */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-950 text-sm">Monthly GST Business Summary</h3>
              <p className="text-xs text-slate-500">Performance indicator for Sales (Orange) vs Purchases (Blue)</p>
            </div>
            <button 
              onClick={() => onNavigate('reports')} 
              className="text-xs text-orange-500 font-bold hover:underline"
            >
              GST Summary Report →
            </button>
          </div>

          {/* Simple Highly Responsive Vector Chart representation */}
          <div className="relative h-48 bg-slate-50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex h-36 items-end justify-between px-2 pt-4 relative">
              {/* background grids */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-dashed border-slate-200 pb-1">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="w-full border-t border-dashed border-slate-200/85 h-0" />
                ))}
              </div>

              {/* simulated bars for May and June */}
              <div className="flex items-end justify-around w-full z-10">
                <div className="flex flex-col items-center gap-1.5 w-1/3">
                  <div className="flex gap-1.5 items-end justify-center h-28">
                    {/* May purchase */}
                    <div className="w-6 bg-slate-400 hover:bg-slate-500 rounded-t h-16 transition-all" title="May Purchases: ₹80,000"></div>
                    {/* May Sale */}
                    <div className="w-6 bg-orange-400 hover:bg-orange-500 rounded-t h-24 transition-all" title="May Sales: ₹1,20,000"></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">May 2026</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 w-1/3 text-center">
                  <div className="flex gap-1.5 items-end justify-center h-28">
                    {/* June purchase */}
                    <div className="w-7 bg-blue-600 hover:bg-blue-700 rounded-t h-10 transition-all" title="June Purchases: ₹30,267"></div>
                    {/* June Sale */}
                    <div className="w-7 bg-orange-500 hover:bg-orange-600 rounded-t h-20 transition-all" title="June Sales: ₹24,913"></div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">Current Month (June)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-xs font-semibold pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded"></span> Net Sales: {formatRupee(monthlySales)}
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded flex-shrink-0"></span> Net Procurement: {formatRupee(monthlyPurchases)}
              </span>
            </div>
          </div>
        </div>

        {/* Side panel: Critical Quick Alerts */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-950 text-sm flex items-center gap-1.5">
              <AlertCircle className="h-4.5 w-4.5 text-orange-500 flex-shrink-0" />
              Stock Alert Desk
            </h3>
            <p className="text-xs text-slate-500">Keep track of fast depleting stocks to prevent dispatch delays.</p>
          </div>

          <div className="space-y-3 my-2 overflow-y-auto max-h-48 flex-grow">
            {lowStockAlerts.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800">
                ✅ All inventory items are matching minimum buffer standards beautifully!
              </div>
            ) : (
              lowStockAlerts.map(p => (
                <div key={p.id} className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Category: {p.category || 'N/A'} • HSN: {p.hsnCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{p.stockQuantity} {p.unit} remaining</p>
                    <p className="text-[9px] text-slate-500">Buffer: {p.lowStockAlert} {p.unit}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            id="btn-navigate-inventory"
            onClick={() => onNavigate('products')}
            className="w-full text-xs py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            Go to Product Master <Plus className="h-3 w-3" />
          </button>
        </div>

      </div>
    </div>
  );
}
