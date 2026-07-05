/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Check, 
  History, 
  CreditCard, 
  Calendar, 
  Coins, 
  IndianRupee, 
  UserCheck, 
  FileText,
  Clock,
  Plus,
  Edit,
  Trash2,
  Printer,
  Share2,
  X,
  UserPlus,
  Download,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { Contact, LedgerTransaction } from '../types';

interface LedgerViewProps {
  contacts: Contact[];
  transactions: LedgerTransaction[];
  onAddTransaction: (tx: LedgerTransaction) => void;
  onUpdateTransaction?: (tx: LedgerTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddContact?: (contact: Contact) => void;
  onUpdateContact?: (contact: Contact) => void;
  onDeleteContact?: (id: string) => void;
  onUpdateContactBalance: (id: string, newBalance: number) => void;
  initialType: 'customer' | 'supplier';
}

export default function LedgerView({ 
  contacts, 
  transactions, 
  onAddTransaction, 
  onUpdateTransaction,
  onDeleteTransaction,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onUpdateContactBalance,
  initialType 
}: LedgerViewProps) {
  
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>(initialType);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected visual state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Modal / Form trigger states
  const [isAddingParty, setIsAddingParty] = useState(false);
  const [isEditingParty, setIsEditingParty] = useState<Contact | null>(null);
  const [isEditingTx, setIsEditingTx] = useState<LedgerTransaction | null>(null);
  const [showPdfStatement, setShowPdfStatement] = useState(false);
  
  // Ledger statement printable layout customization states
  const [showBankInStatementPrint, setShowBankInStatementPrint] = useState(() => {
    return localStorage.getItem('vyapar_show_bank_in_statement_print') !== 'false';
  });
  const [showStampInStatementPrint, setShowStampInStatementPrint] = useState(() => {
    return localStorage.getItem('vyapar_show_stamp_in_statement_print') !== 'false';
  });
  const [showTermsInStatementPrint, setShowTermsInStatementPrint] = useState(() => {
    return localStorage.getItem('vyapar_show_terms_in_statement_print') !== 'false';
  });
  const [customStatementTerms, setCustomStatementTerms] = useState(() => {
    return localStorage.getItem('vyapar_custom_statement_terms') || '';
  });
  
  // Direct settlement state
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementNotes, setSettlementNotes] = useState('');

  // Party Form states
  const [partyName, setPartyName] = useState('');
  const [partyMobile, setPartyMobile] = useState('');
  const [partyEmail, setPartyEmail] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [partyOpeningBalance, setPartyOpeningBalance] = useState<number>(0);

  // Edit Direct Voucher state
  const [editTxAmount, setEditTxAmount] = useState<number>(0);
  const [editTxNotes, setEditTxNotes] = useState('');

  // Confirmation state for deleting contacts and transactions
  const [showDeleteContactConfirm, setShowDeleteContactConfirm] = useState(false);
  const [txToDelete, setTxToDelete] = useState<LedgerTransaction | null>(null);

  // Filter contacts based on current tab
  const filteredContacts = contacts.filter(c => {
    if (c.type !== activeTab) return false;
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.mobile.includes(searchTerm);
  });

  // Calculate high-level stats
  const totalOutstanding = filteredContacts.reduce((sum, c) => sum + Math.max(0, c.balance), 0);

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Setup / reset state for Adding custom party
  const triggerAddParty = () => {
    setPartyName('');
    setPartyMobile('');
    setPartyEmail('');
    setPartyAddress('');
    setPartyGstin('');
    setPartyOpeningBalance(0);
    setIsAddingParty(true);
    setIsEditingParty(null);
  };

  // Setup / reset state for editing party
  const triggerEditParty = (contact: Contact) => {
    setPartyName(contact.name);
    setPartyMobile(contact.mobile);
    setPartyEmail(contact.email || '');
    setPartyAddress(contact.address);
    setPartyGstin(contact.gstin || '');
    setPartyOpeningBalance(contact.balance);
    setIsEditingParty(contact);
    setIsAddingParty(false);
  };

  // Submit new or updated party
  const handlePartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      alert("Please provide a valid Firm or Party Name.");
      return;
    }

    if (isEditingParty) {
      const updated: Contact = {
        ...isEditingParty,
        name: partyName,
        mobile: partyMobile,
        email: partyEmail || undefined,
        address: partyAddress,
        gstin: partyGstin || undefined,
        balance: partyOpeningBalance
      };
      if (onUpdateContact) {
        onUpdateContact(updated);
        // If it was selected, update selected entity reference too
        if (selectedContact?.id === updated.id) {
          setSelectedContact(updated);
        }
        alert("Party/ledger account profile adjusted successfully!");
      }
      setIsEditingParty(null);
    } else {
      const newContact: Contact = {
        id: `ct-sys-${Date.now()}`,
        name: partyName,
        mobile: partyMobile,
        email: partyEmail || undefined,
        address: partyAddress,
        gstin: partyGstin || undefined,
        type: activeTab,
        balance: partyOpeningBalance
      };
      if (onAddContact) {
        onAddContact(newContact);
        // Post direct opening balance transaction entry if applicable
        if (partyOpeningBalance > 0) {
          const opTx: LedgerTransaction = {
            id: `tx-sys-op-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            contactId: newContact.id,
            contactName: newContact.name,
            type: 'invoice',
            amount: partyOpeningBalance,
            referenceId: 'op-bal-setup',
            notes: `Auto Setup: Opening debit ledger outstanding`
          };
          onAddTransaction(opTx);
        }
        alert(`Registered new ${activeTab} account successfully!`);
      }
      setIsAddingParty(false);
    }
  };

  // Handle posting a settlement payment receipt/payment made
  const handleSettlementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || settlementAmount <= 0) return;

    const isCustomer = selectedContact.type === 'customer';
    
    // Calculate new balance
    // For customers: receiving payment decreases receivable
    // For suppliers: making payment decreases supplier liability
    const currentBalance = selectedContact.balance;
    const newBalance = Math.max(0, currentBalance - settlementAmount);

    const newTx: LedgerTransaction = {
      id: `tx-sys-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      type: isCustomer ? 'payment_received' : 'payment_made',
      amount: settlementAmount,
      referenceId: `VOUCH-${Math.floor(1000 + Math.random()*9000)}`,
      notes: settlementNotes || `${isCustomer ? 'Received' : 'Paid'} outstanding ledger cash settlement`
    };

    onAddTransaction(newTx);
    onUpdateContactBalance(selectedContact.id, newBalance);
    
    // Refresh local selected state reference so changes reflect immediately
    setSelectedContact({
      ...selectedContact,
      balance: newBalance
    });

    // Reset modals
    setSettlementAmount(0);
    setSettlementNotes('');
    alert("Voucher payment posted! Party and ledger balances adjusted successfully.");
  };

  // Handle Editing an existing transaction entry (direct settlement edits)
  const handleEditTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingTx || !selectedContact) return;

    const isReceipt = isEditingTx.type === 'payment_received' || isEditingTx.type === 'payment_made';
    
    // Calculate the difference in ledger balance adjustment
    const deltaAmount = editTxAmount - isEditingTx.amount;
    
    // Create copy with new data
    const updatedTx: LedgerTransaction = {
      ...isEditingTx,
      amount: editTxAmount,
      notes: editTxNotes
    };

    // Update the transaction in parent state
    if (onUpdateTransaction) {
      onUpdateTransaction(updatedTx);
    }

    // Recalculate contact balance
    // For customer payment: increasing receipt amount decreases the final outstanding
    // For customer invoice: increasing invoice amount increases outstanding
    let balanceAdjustment = 0;
    if (isReceipt) {
      balanceAdjustment = -deltaAmount; // more payment matches less outstanding due
    } else {
      balanceAdjustment = deltaAmount; // more invoice matches more outstanding
    }

    const nextBal = Math.max(0, selectedContact.balance + balanceAdjustment);
    onUpdateContactBalance(selectedContact.id, nextBal);
    
    setSelectedContact({
      ...selectedContact,
      balance: nextBal
    });

    setIsEditingTx(null);
    alert("Voucher details recalculated & recompiled successfully!");
  };

  // Handle deleting a direct voucher payment or transaction entry
  const handleDeleteTx = (tx: LedgerTransaction) => {
    setTxToDelete(tx);
  };

  const confirmDeleteTx = () => {
    if (!selectedContact || !txToDelete) return;

    if (onDeleteTransaction) {
      onDeleteTransaction(txToDelete.id);
    }

    const isReceipt = txToDelete.type === 'payment_received' || txToDelete.type === 'payment_made';
    // Reversing a receipt increases the outstanding balance due again
    // Reversing an invoice/bill decreases the outstanding balance
    const adjustment = isReceipt ? txToDelete.amount : -txToDelete.amount;
    const nextBal = Math.max(0, selectedContact.balance + adjustment);
    
    onUpdateContactBalance(selectedContact.id, nextBal);
    setSelectedContact({
      ...selectedContact,
      balance: nextBal
    });

    setTxToDelete(null);
  };

  // Completely delete a trading party/ledger account
  const handleDeleteContactClick = () => {
    if (!selectedContact) return;
    setShowDeleteContactConfirm(true);
  };

  const confirmDeleteContact = () => {
    if (!selectedContact) return;
    
    if (onDeleteContact) {
      onDeleteContact(selectedContact.id);
      setSelectedContact(null);
      setShowDeleteContactConfirm(false);
    } else {
      alert("Delete operation is not configured for this setup.");
      setShowDeleteContactConfirm(false);
    }
  };

  // Filter transactions specific to selected party to create a real individual ledger card
  const customerTx = selectedContact 
    ? transactions.filter(t => t.contactId === selectedContact.id)
    : [];

  // Generate dynamic WhatsApp link
  const getWhatsAppLink = () => {
    if (!selectedContact) return '#';
    const text = `Greetings from Rudra Enterprises!\n\nDear Sir/Madam,\nWe have compiled your ledger account statement with current due balances listed:\n\n*Party Name*: ${selectedContact.name}\n*Active Balance*: ${formatRupee(selectedContact.balance)}\n\nKindly process the remittance wire transfer via GPay/UPS ID to: *billing@rudra*\n\nThank you for choosing Rudra!`;
    return `https://api.whatsapp.com/send?phone=91${selectedContact.mobile.replace(/\D/g, '')}&text=${encodeURIComponent(text)}`;
  };

  const formatRupeeForPdf = (value: number) => {
    return 'Rs. ' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(value);
  };

  const safeStrForPdf = (str: string) => {
    if (!str) return '';
    // Replace rupee symbol and other non-ascii problematic characters to keep the standard font happy
    return str.replace(/₹/g, 'Rs.').replace(/[^\x00-\x7F]/g, '');
  };

  const getJsPdfInstance = (): any => {
    // 1. Try named export
    if (typeof jsPDF === 'function') {
      return jsPDF;
    }
    // 2. Try default export from imported module wrapper
    if (jsPDF && typeof (jsPDF as any).default === 'function') {
      return (jsPDF as any).default;
    }
    // 3. Try standard commonjs default resolution
    const defaultExport = (jsPDF as any);
    if (typeof defaultExport === 'function') {
      return defaultExport;
    }
    // 4. Try global browser fallback if it leaked to window
    const globalJsPDF = (window as any).jsPDF || (window as any).jspdf?.jsPDF;
    if (typeof globalJsPDF === 'function') {
      return globalJsPDF;
    }
    throw new Error("Unable to resolve standard jsPDF class constructor.");
  };

  const printLedgerListPdf = () => {
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
        doc.text("Comprehensive Outstandings Report", 15, 25);
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
      doc.text(
        activeTab === 'customer' 
          ? "DEBIT STATEMENT: CUSTOMER RECEIVABLES" 
          : "CREDIT STATEMENT: SUPPLIER PAYABLES", 
        15, y
      );
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Total Outstanding: Rs. ${totalOutstanding.toLocaleString('en-IN')}`, 15, y + 6);
      
      y += 15;

      // Table Header
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Party / Company Name", 18, y + 5.5);
      doc.text("Contact Info", 80, y + 5.5);
      doc.text("Balance (INR)", 188, y + 5.5, { align: 'right' });

      y += 8;

      // Rows
      filteredContacts.forEach((c) => {
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
          doc.text("Party / Company Name", 18, y + 5.5);
          doc.text("Contact Info", 80, y + 5.5);
          doc.text("Balance (INR)", 188, y + 5.5, { align: 'right' });
          y += 8;
        }

        doc.setFillColor(255, 255, 255);
        doc.rect(15, y, 180, 7, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + 7, 195, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const nameStr = safeStrForPdf(c.name);
        doc.text(nameStr.length > 35 ? nameStr.substring(0, 32) + "..." : nameStr, 18, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${c.mobile} ${c.gstin ? '| ' + c.gstin : ''}`, 80, y + 4.5);

        doc.setFont('helvetica', 'bold');
        if (c.balance > 0) {
          doc.setTextColor(185, 28, 28);
        } else {
          doc.setTextColor(5, 150, 105);
        }
        doc.text(`${c.balance.toLocaleString('en-IN')}`, 188, y + 4.5, { align: 'right' });

        y += 7.5;
      });

      // Saving
      doc.save(`${activeTab}_statement_list_${Date.now()}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert(`Print Statement failed: ${err?.message}`);
    }
  };

  const handlePrintLedger = () => {
    document.body.setAttribute('data-print-mode', 'ledger');
    window.print();
    const clearPrintMode = () => {
      document.body.removeAttribute('data-print-mode');
      setShowPdfStatement(false);
      window.removeEventListener('afterprint', clearPrintMode);
    };
    window.addEventListener('afterprint', clearPrintMode);
    setTimeout(clearPrintMode, 2000);
  };

  const handleDirectPrintLedgerFlow = () => {
    setShowPdfStatement(true);
    setTimeout(() => {
      handlePrintLedger();
    }, 250);
  };

  const downloadLedgerPdf = () => {
    if (!selectedContact) return;

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
        // Fallback to positional constructor parameters which is extremely universal
        doc = new JsPDFClass('p', 'mm', 'a4');
      }

      const pageWidth = 210;
      const pageHeight = 297;
      let y = 20;

      // Helper for adding headers on new pages
      const addHeaderAndFooter = (pageNum: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("RUDRA ENTERPRISES", 15, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("Quality & Trust | GSTIN: 06AAAAA1111A1Z1", 15, 25);
        doc.text("Address: Near Railway Station Rd, Ambala, Haryana, India", 15, 29);
        doc.text("Contacts: +91 9876543210 | billing@rudraenterprises.com", 15, 33);

        // Divider
        doc.setFillColor(249, 115, 22); // orange-500
        doc.rect(15, 36, 180, 1, 'F');

        // Footer block
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleString()} | Page ${pageNum}`, 15, 287);
        doc.text("* This is a computer generated ledger account statement.", 120, 287);
      };

      // Add page 1 headers
      addHeaderAndFooter(1);
      y = 45;

      // Party Details Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("STATEMENT PREPARED FOR:", 15, y);
      
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, y + 2, 180, 25, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(15, y + 2, 180, 25, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(safeStrForPdf(selectedContact.name), 20, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Mobile Contact: ${selectedContact.mobile}`, 20, y + 13);
      doc.text(`Email Address: ${selectedContact.email || 'N/A'}`, 20, y + 17);
      doc.text(`Billing Location: ${safeStrForPdf(selectedContact.address)}`, 20, y + 21);

      if (selectedContact.gstin) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(249, 115, 22);
        doc.text(`GSTIN: ${selectedContact.gstin}`, 110, y + 8);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
      }

      // Financial balance summary box
      doc.setFillColor(254, 243, 199); // orange-50 / amber-100
      doc.rect(125, y + 6, 65, 17, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.rect(125, y + 6, 65, 17, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text("NET OUTSTANDING DUE", 129, y + 11);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${formatRupeeForPdf(selectedContact.balance)}`, 129, y + 18);

      y += 35;

      // Ledger Lines Table Header
      doc.setFillColor(15, 23, 42); // dark header
      doc.rect(15, y, 180, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Date", 18, y + 5);
      doc.text("Reference ID", 38, y + 5);
      doc.text("Entry Details / Notes", 70, y + 5);
      doc.text("Debit (Dr)", 125, y + 5, { align: 'right' });
      doc.text("Credit (Cr)", 155, y + 5, { align: 'right' });
      doc.text("Balance", 188, y + 5, { align: 'right' });

      y += 7;

      let currentRunBal = 0;
      let totalDr = 0;
      let totalCr = 0;
      let pageNum = 1;

      // Draw rows
      customerTx.forEach((tx) => {
        // If getting too close to the footer, add a new page
        if (y > 260) {
          doc.addPage();
          pageNum++;
          addHeaderAndFooter(pageNum);
          y = 45;

          // Re-draw table headers on new page
          doc.setFillColor(15, 23, 42);
          doc.rect(15, y, 180, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text("Date", 18, y + 5);
          doc.text("Reference ID", 38, y + 5);
          doc.text("Entry Details / Notes", 70, y + 5);
          doc.text("Debit (Dr)", 125, y + 5, { align: 'right' });
          doc.text("Credit (Cr)", 155, y + 5, { align: 'right' });
          doc.text("Balance", 188, y + 5, { align: 'right' });
          y += 7;
        }

        const isReceipt = tx.type === 'payment_received' || tx.type === 'payment_made';
        if (isReceipt) {
          currentRunBal = Math.max(0, currentRunBal - tx.amount);
          totalCr += tx.amount;
        } else {
          currentRunBal += tx.amount;
          totalDr += tx.amount;
        }

        // Draw row background for alternating styling
        doc.setFillColor(255, 255, 255);
        doc.rect(15, y, 180, 6, 'F');
        doc.setDrawColor(241, 245, 249); // split border
        doc.line(15, y + 6, 195, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(tx.date, 18, y + 4.2);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(tx.referenceId, 38, y + 4.2);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const notesStr = safeStrForPdf(tx.notes || tx.type.replace('_', ' '));
        const truncatedNotes = notesStr.length > 30 ? notesStr.substring(0, 27) + "..." : notesStr;
        doc.text(truncatedNotes, 70, y + 4.2);

        doc.setFont('helvetica', 'normal');
        if (!isReceipt) {
          doc.setTextColor(185, 28, 28); // red
          doc.text(`Rs. ${tx.amount.toLocaleString('en-IN')}`, 125, y + 4.2, { align: 'right' });
        } else {
          doc.setTextColor(120, 120, 120);
          doc.text("—", 125, y + 4.2, { align: 'right' });
        }

        if (isReceipt) {
          doc.setTextColor(5, 150, 105); // emerald
          doc.setFont('helvetica', 'bold');
          doc.text(`Rs. ${tx.amount.toLocaleString('en-IN')}`, 155, y + 4.2, { align: 'right' });
        } else {
          doc.setTextColor(120, 120, 120);
          doc.text("—", 155, y + 4.2, { align: 'right' });
        }

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${currentRunBal.toLocaleString('en-IN')}`, 188, y + 4.2, { align: 'right' });

        y += 6.2;
      });

      // Total Summaries Row
      if (y > 250) {
        doc.addPage();
        pageNum++;
        addHeaderAndFooter(pageNum);
        y = 45;
      }

      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(15, y, 180, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("TOTALS (INR)", 18, y + 5);

      doc.setTextColor(185, 28, 28);
      doc.text(`Rs. ${totalDr.toLocaleString('en-IN')}`, 125, y + 5, { align: 'right' });

      doc.setTextColor(5, 150, 105);
      doc.text(`Rs. ${totalCr.toLocaleString('en-IN')}`, 155, y + 5, { align: 'right' });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.text(`Rs. ${selectedContact.balance.toLocaleString('en-IN')}`, 188, y + 5, { align: 'right' });

      y += 12;

      // Settlement Details Block
      if (y > 230) {
        doc.addPage();
        pageNum++;
        addHeaderAndFooter(pageNum);
        y = 45;
      }

      if (showBankInStatementPrint) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text("REMITTANCE BANK DETAILS", 15, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text("Banker Profile: State Bank of India", 15, y + 5);
        doc.text("Current A/C No: 48910023819 | IFSC: SBIN0001832", 15, y + 9);
        doc.text("GPay/UPI ID: billing@rudra", 15, y + 13);
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Bank details suppressed in this statements print.", 15, y);
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(105, y, 105, y + 25);

      if (showStampInStatementPrint) {
        // Signature Block
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text("OFFICIAL AUTHORIZATION", 110, y);

        doc.setFillColor(250, 250, 250);
        doc.rect(110, y + 3, 50, 12, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.rect(110, y + 3, 50, 12, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text("AMBALA HUB VERIFIED", 114, y + 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text("RUDRA ENTERPRISES", 110, y + 21);
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Official signature block suppressed in statements.", 110, y);
      }

      // Save the PDF
      const formattedDate = new Date().toISOString().split('T')[0];
      doc.save(`${selectedContact.name.replace(/[^a-zA-Z0-9]/g, '_')}_Ledger_${formattedDate}.pdf`);
      alert("Ledger PDF compiled successfully & downloaded directly to your device browser!");
    } catch (e: any) {
      console.error(e);
      alert(`An error occurred while compiling PDF: ${e?.message || e}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Ledger navigation header tab layout */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-sm border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5 capitalize">
            <Coins className="h-5 w-5 text-orange-400" />
            {activeTab === 'customer' ? "Customer Outstandings (Debit Ledger)" : "Supplier Outstandings (Credit Ledger)"}
          </h2>
          <p className="text-xs text-slate-400">
            {activeTab === 'customer'
              ? "Identify credit sales, track customers due status, register and reconcile accounts receivable."
              : "Monitor supplier invoices, manage corporate wholesale payables, and record cash outlays."}
          </p>
        </div>

        {/* Tab selector & Add New Party */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-register-party"
            onClick={triggerAddParty}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow flex items-center gap-1.5 transition-all text-center cursor-pointer"
          >
            <UserPlus className="h-4.5 w-4.5" /> Register Party
          </button>

          <div className="bg-slate-850 p-1 rounded-xl flex">
            <button
              id="tab-ledger-customer"
              onClick={() => {
                setActiveTab('customer');
                setSelectedContact(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'customer' ? 'bg-orange-650 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" /> Customers Debit
            </button>
            <button
              id="tab-ledger-supplier"
              onClick={() => {
                setActiveTab('supplier');
                setSelectedContact(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'supplier' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="h-4 w-4" /> Suppliers Credit
            </button>
          </div>
        </div>
      </div>

      {/* Inline Add / Edit Party Form Modal overlay if triggered */}
      {(isAddingParty || isEditingParty) && (
        <div className="p-5 bg-amber-50/50 border border-amber-150 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-amber-200 pb-2">
            <h3 className="text-xs font-black uppercase text-amber-850 tracking-wider flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-orange-500" />
              {isEditingParty ? `Edit Profile: ${isEditingParty.name}` : `Register New ${activeTab}`}
            </h3>
            <button 
              onClick={() => {
                setIsAddingParty(false);
                setIsEditingParty(null);
              }} 
              className="text-slate-400 hover:text-red-500 text-xs font-bold"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handlePartySubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Company / Firm Name *</label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold focus:outline-none"
                placeholder="e.g. Radhe Electro Traders"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Mobile Contact No. *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={partyMobile}
                onChange={(e) => setPartyMobile(e.target.value.replace(/\D/g, ''))}
                className="block w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-mono focus:outline-none"
                placeholder="10 digit mobile"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Support Email</label>
              <input
                type="email"
                value={partyEmail}
                onChange={(e) => setPartyEmail(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
                placeholder="Optional corporate email"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Government GSTIN Num</label>
              <input
                type="text"
                value={partyGstin}
                maxLength={15}
                onChange={(e) => setPartyGstin(e.target.value.toUpperCase())}
                className="block w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-mono uppercase font-bold focus:outline-none"
                placeholder="e.g. 06AAAAA1111A1Z1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Registered Billing Address *</label>
              <input
                type="text"
                required
                value={partyAddress}
                onChange={(e) => setPartyAddress(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
                placeholder="Building address, city, state zip code"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Opening Statement Balance (₹)</label>
              <input
                type="number"
                value={partyOpeningBalance}
                onChange={(e) => setPartyOpeningBalance(Math.max(0, Number(e.target.value)))}
                className="block w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-mono font-bold focus:outline-none"
                placeholder="₹ Outstanding Balance"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-xl text-xs transition"
              >
                {isEditingParty ? "Save Updates" : "Add Account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingParty(false);
                  setIsEditingParty(null);
                }}
                className="bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Accounts listing vs Ledger audit trails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Contact outstanding list */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {activeTab === 'customer' ? "Total Receivables Outstanding" : "Total Procurement Payables"}
              </p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-mono">
                {formatRupee(totalOutstanding)}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                totalOutstanding > 0 ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {activeTab === 'customer' ? 'To Collect' : 'To Pay'}
              </span>
              <button
                onClick={printLedgerListPdf}
                className="flex items-center gap-1.5 text-[9px] font-extrabold bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm py-1 px-2 rounded-lg transition-colors cursor-pointer"
                title="Print Full Debit/Credit Statement List"
              >
                <Printer className="h-3 w-3" /> PRINT LIST
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3.5 h-10 w-10 text-slate-400 flex items-center justify-center pointer-events-none" />
            <input
              id="ledger-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-orange-500 font-medium"
              placeholder={`Search by company name, contact person, mobile...`}
            />
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-10 font-normal">No registered parties found in this ledger segment.</p>
            ) : (
              filteredContacts.map(c => {
                const isSelected = selectedContact?.id === c.id;
                return (
                  <div 
                    key={c.id} 
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-950 text-white shadow-md' 
                        : 'bg-white border-slate-150 hover:border-slate-250 hover:bg-slate-50/50'
                    }`}
                    onClick={() => {
                      setSelectedContact(c);
                      // Pre-fill maximum due for fast settlement receipt
                      setSettlementAmount(c.balance);
                      setSettlementNotes('');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs">{c.name}</h4>
                          {c.gstin && (
                            <span className="text-[7.5px] font-extrabold uppercase bg-orange-50 text-orange-750 px-1 py-0.2 rounded border border-orange-100 font-mono">
                              GSTIN
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] ${isSelected ? 'text-slate-450 text-slate-300' : 'text-slate-500'}`}>
                          📞 {c.mobile} • {c.address}
                        </p>
                      </div>

                      <div className="text-right space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <p className={`text-xs font-black font-mono leading-none ${
                          isSelected ? 'text-white' : c.balance > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {formatRupee(c.balance)}
                        </p>
                        
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-party-${c.id}`}
                            onClick={() => triggerEditParty(c)}
                            title="Edit customer trade profiles"
                            className={`p-1 rounded transition-colors ${
                              isSelected ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Individual selected party Ledger sheet + direct manual entry form */}
        <div className="lg:col-span-6 space-y-6">
          {selectedContact ? (
            <div className="space-y-6">
              
              {/* Selected account summary details card */}
              <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-[0.03] select-none pointer-events-none transform translate-x-5 -translate-y-5">
                  <UserCheck className="h-32 w-32" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] text-orange-400 font-extrabold tracking-widest uppercase mb-1">
                      ACTIVE {selectedContact.type.toUpperCase()} ACCOUNT
                    </p>
                    <h3 className="text-sm font-black tracking-tight">{selectedContact.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      📞 {selectedContact.mobile} • {selectedContact.email || 'No email saved'}
                    </p>
                    {selectedContact.gstin && (
                      <p className="text-[10px] text-orange-300 font-mono mt-0.5">
                        GSTIN: {selectedContact.gstin}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Statement Due</p>
                    <p className="text-lg font-black font-mono text-white mt-1">
                      {formatRupee(selectedContact.balance)}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-950/40 text-red-400 text-[8px] font-black uppercase tracking-wider rounded border border-red-900/50">
                      Unpaid Credit
                    </span>
                  </div>
                </div>

                {/* Ledger Operations Suite (Type conversion & Purging options) */}
                <div className="bg-slate-950/45 border border-slate-800/85 rounded-xl p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Account Placement</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedContact.type !== 'customer') {
                            const updated = { ...selectedContact, type: 'customer' as const };
                            onUpdateContact?.(updated);
                            setSelectedContact(updated);
                            setActiveTab('customer');
                            alert("Party moved successfully to Debit Ledger (Customers)!");
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                          selectedContact.type === 'customer'
                            ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                            : 'bg-transparent border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        Debit Ledger
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedContact.type !== 'supplier') {
                            const updated = { ...selectedContact, type: 'supplier' as const };
                            onUpdateContact?.(updated);
                            setSelectedContact(updated);
                            setActiveTab('supplier');
                            alert("Party moved successfully to Credit Ledger (Suppliers)!");
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                          selectedContact.type === 'supplier'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-transparent border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        Credit Ledger
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-stretch sm:items-end w-full sm:w-auto">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Account Management</span>
                    <button
                      type="button"
                      id="btn-delete-ledger-account"
                      onClick={handleDeleteContactClick}
                      className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-900/50 hover:border-red-650 text-red-300 hover:text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>

                {/* Actions: Download PDF, Print View, WhatsApp Shared sync */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <button
                    id="btn-direct-download-ledger"
                    onClick={downloadLedgerPdf}
                    className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
                  >
                    <Download className="h-4 w-4" /> Download Ledger PDF (Direct File)
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-trigger-print-pdf"
                      onClick={handleDirectPrintLedgerFlow}
                      className="py-1.5 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none hover:scale-102"
                    >
                      <Printer className="h-3.5 w-3.5 text-orange-400 stroke-[2.5]" /> Print Statement View
                    </button>

                    <a
                      id="btn-share-whatsapp"
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <Share2 className="h-3.5 w-3.5" /> WhatsApp Ledger Msg
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick-Adjust Ledger Statement Print Options Control Panel */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 select-none">
                      ⚙️ Ledger Statement Printable Adjustments
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Configure dynamic sections and terms on the physical printed A4 sheet.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center text-[10px] sm:text-[11px] font-extrabold text-slate-700 select-none">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200/60 flex-1 w-full justify-center">
                    <input 
                      type="checkbox" 
                      checked={showBankInStatementPrint} 
                      onChange={(e) => {
                        setShowBankInStatementPrint(e.target.checked);
                        localStorage.setItem('vyapar_show_bank_in_statement_print', String(e.target.checked));
                      }}
                      className="accent-orange-500 h-3.5 w-3.5"
                    />
                    <span>🏦 Bank Creds</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200/60 flex-1 w-full justify-center">
                    <input 
                      type="checkbox" 
                      checked={showTermsInStatementPrint} 
                      onChange={(e) => {
                        setShowTermsInStatementPrint(e.target.checked);
                        localStorage.setItem('vyapar_show_terms_in_statement_print', String(e.target.checked));
                      }}
                      className="accent-orange-500 h-3.5 w-3.5"
                    />
                    <span>📜 Audit Terms</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200/60 flex-1 w-full justify-center">
                    <input 
                      type="checkbox" 
                      checked={showStampInStatementPrint} 
                      onChange={(e) => {
                        setShowStampInStatementPrint(e.target.checked);
                        localStorage.setItem('vyapar_show_stamp_in_statement_print', String(e.target.checked));
                      }}
                      className="accent-orange-500 h-3.5 w-3.5"
                    />
                    <span>✍️ Stamp / Sign</span>
                  </label>
                </div>

                {showTermsInStatementPrint && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Edit Audit & Statement Terms text
                    </label>
                    <input 
                      type="text"
                      value={customStatementTerms}
                      onChange={(e) => {
                        setCustomStatementTerms(e.target.value);
                        localStorage.setItem('vyapar_custom_statement_terms', e.target.value);
                      }}
                      placeholder="e.g. Please report mismatch within 7 working days..."
                      className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Direct payment manual voucher entry form */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="border-b pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Post Ledger Receipt</span>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      Quick Settlement Voucher (Cash / UPI Debit or Credit)
                    </h3>
                  </div>
                  <Coins className="h-4.5 w-4.5 text-slate-400" />
                </div>

                <form onSubmit={handleSettlementSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Receipt Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs pointer-events-none">₹</span>
                      <input
                        id="settle-amount-element"
                        type="number"
                        min={1}
                        max={selectedContact.balance}
                        required
                        value={settlementAmount}
                        onChange={(e) => setSettlementAmount(Math.max(1, Number(e.target.value)))}
                        className="block w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Voucher Description / Notes</label>
                    <input
                      id="settle-notes-element"
                      type="text"
                      value={settlementNotes}
                      onChange={(e) => setSettlementNotes(e.target.value)}
                      placeholder="e.g. Cleared GPay #8283"
                      className="block w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      id="btn-register-payment-vouch"
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-2 rounded-xl text-xs tracking-wider transition-colors"
                    >
                      Post Payment Settlement Receipt
                    </button>
                  </div>
                </form>
              </div>

              {/* Transactions filtered history for the SELECTED trade party */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-2">
                  <History className="h-4.5 w-4.5 text-orange-500" />
                  Party Ledger Account Statements list
                </h3>

                {/* Inline Editing for ledger transactions if triggered */}
                {isEditingTx && (
                  <form onSubmit={handleEditTxSubmit} className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Adjust Direct Voucher</span>
                      <button type="button" onClick={() => setIsEditingTx(null)}>
                        <X className="h-3 w-3 text-slate-400" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-650">Amount (₹)</label>
                        <input
                          type="number"
                          required
                          value={editTxAmount}
                          onChange={(e) => setEditTxAmount(Number(e.target.value))}
                          className="block w-full p-1 border text-xs font-mono font-bold bg-white rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-650">Voucher Notes</label>
                        <input
                          type="text"
                          required
                          value={editTxNotes}
                          onChange={(e) => setEditTxNotes(e.target.value)}
                          className="block w-full p-1 border text-xs bg-white rounded"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-600 font-bold text-white text-[10px] py-1 rounded">
                      Apply Voucher Alterations
                    </button>
                  </form>
                )}

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {customerTx.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-10 font-normal">
                      No matching records. Post direct cash receipts or generate invoice bills to trigger ledger balance tracking.
                    </p>
                  ) : (
                    customerTx.slice().reverse().map((tx) => {
                      const isReceipt = tx.type === 'payment_received' || tx.type === 'payment_made';
                      return (
                        <div 
                          key={tx.id} 
                          className="p-3 rounded-xl bg-slate-50 border border-slate-150 text-[11px] leading-relaxed flex justify-between items-center group hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 text-[8px] font-bold uppercase rounded ${
                                isReceipt ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {tx.type === 'invoice' ? 'Invoice Bill' : 'Voucher Receipt'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">Date: {tx.date}</span>
                            </div>
                            <p className="font-bold text-slate-900 mt-1">Ref No: {tx.referenceId}</p>
                            <p className="text-[10px] text-slate-500 italic font-medium mt-0.5">{tx.notes}</p>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className={`font-mono font-bold text-xs ${isReceipt ? 'text-emerald-600' : 'text-slate-900'}`}>
                                ₹{tx.amount.toLocaleString('en-IN')}
                              </p>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Auto Posted</span>
                            </div>

                            {/* Options to edit/delete direct voucher payments */}
                            {isReceipt && (
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEditingTx(tx);
                                    setEditTxAmount(tx.amount);
                                    setEditTxNotes(tx.notes || '');
                                  }}
                                  title="Edit payment receipt"
                                  className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-black cursor-pointer"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTx(tx)}
                                  title="Delete transaction and reverse party balance"
                                  className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-slate-400 text-center">
              <UserCheck className="h-10 w-10 text-slate-300 mb-2 animate-bounce-slow" />
              <h3 className="text-xs font-bold text-slate-700">No trading partner selected</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                Click on any custom customer or wholesale distributor supplier card in the left list to review history log lines, print statement receipts or sync balances via WhatsApp.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Premium print-optimized individual billing ledger statement overlay */}
      {showPdfStatement && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            
            {/* Modal Header controls */}
            <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-400 animate-pulse" />
                <h3 className="text-xs font-extrabold tracking-wider uppercase">LEDGER STATEMENT RENDER VIEWER</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  id="btn-direct-download-action"
                  onClick={downloadLedgerPdf}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-[10px] font-black rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700/50 hover:text-orange-400"
                >
                  <Download className="h-3.5 w-3.5 text-orange-400" /> Download PDF File
                </button>
                <button
                  id="btn-print-action"
                  onClick={handlePrintLedger}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Direct Print Ledger (Save PDF)
                </button>
                <button
                  onClick={() => setShowPdfStatement(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Area content panel */}
            <div id="print-statement-area" className="p-8 bg-white text-slate-800 flex-1 overflow-y-auto space-y-6 printable-panel">
              
              {/* Header: Company Profile */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">Rudra Enterprises</h1>
                  <p className="text-[10px] text-orange-650 font-bold uppercase tracking-wider">Quality and Trust • Government SGST/CGST Compliant</p>
                  <p className="text-[10px] text-slate-500 mt-1">Billing Headquarter Address: Near Railway Station Rd, Ambala, Haryana, India</p>
                  <p className="text-[10px] text-slate-500">📞 Support: +91 9876543210 • billing@rudraenterprises.com</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-900 text-[9px] uppercase font-bold tracking-widest rounded border font-mono">
                    GSTIN: 06AAAAA1111A1Z1
                  </span>
                  <div className="mt-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Statement Period</p>
                    <p className="text-[10px] font-bold text-slate-705 font-mono">As of {new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>
              </div>

              {/* Party Profile Summary banner */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <p className="text-[8px] font-extrabold tracking-wider text-slate-400 uppercase">Statement Prepared For</p>
                  <h4 className="font-bold text-xs text-slate-900 mt-1">{selectedContact.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">📞 Contact Mobile: {selectedContact.mobile}</p>
                  <p className="text-[10px] text-slate-500">Address: {selectedContact.address}</p>
                  {selectedContact.gstin && (
                    <p className="text-[10px] text-orange-700 font-mono font-bold mt-1">GSTIN: {selectedContact.gstin}</p>
                  )}
                </div>

                <div className="text-right flex flex-col justify-between">
                  {showBankInStatementPrint ? (
                    <div>
                      <p className="text-[8px] font-extrabold tracking-wider text-slate-400 uppercase">Remittance Account Details</p>
                      <p className="text-[9px] text-slate-600 mt-1">Bank Name: State Bank of India</p>
                      <p className="text-[9px] text-slate-600 font-mono">A/C No: 48910023819 • IFSC: SBIN0001832</p>
                      <p className="text-[9px] text-slate-600 font-mono">UPI ID: billing@rudra</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 text-[8px] text-slate-400 border border-slate-200 p-2 rounded-xl font-semibold text-center italic">
                      🔒 Remittance credentials suppressed.
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Net Outstanding Due: </span>
                    <strong className="text-xs font-mono font-black text-red-650 ml-1">{formatRupee(selectedContact.balance)}</strong>
                  </div>
                </div>
              </div>

              {/* Statements ledger history list with running balances */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-500 border-b pb-1">
                  Chronological Transaction Register ledger lines
                </h4>

                <table className="min-w-full text-left text-[10px] font-medium leading-normal bg-white">
                  <thead className="bg-slate-100 text-slate-500 uppercase tracking-widest text-[8px] font-bold">
                    <tr>
                      <th className="px-2.5 py-2">Date</th>
                      <th className="px-2.5 py-2">Voucher Reference</th>
                      <th className="px-2.5 py-2">Account Entry Details</th>
                      <th className="px-2.5 py-2 text-right text-orange-700">Debit (Invoice Sale)</th>
                      <th className="px-2.5 py-2 text-right text-emerald-700">Credit (Payment Receipt)</th>
                      <th className="px-2.5 py-2 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    {/* Compute chronological running balances */}
                    {(() => {
                      let currentRunBal = 0;
                      return customerTx.map((tx, index) => {
                        const isReceipt = tx.type === 'payment_received' || tx.type === 'payment_made';
                        
                        // Running balance accumulation logic
                        if (isReceipt) {
                          currentRunBal = Math.max(0, currentRunBal - tx.amount);
                        } else {
                          currentRunBal += tx.amount;
                        }

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="px-2.5 py-2 text-slate-500 font-normal">{tx.date}</td>
                            <td className="px-2.5 py-2 text-slate-900 font-bold">{tx.referenceId}</td>
                            <td className="px-2.5 py-2 text-slate-500 font-normal capitalize">
                              {tx.notes || tx.type.replace('_', ' ')}
                            </td>
                            <td className="px-2.5 py-2 text-right text-red-600">
                              {!isReceipt ? `₹${tx.amount.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="px-2.5 py-2 text-right text-emerald-600 font-bold">
                              {isReceipt ? `₹${tx.amount.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="px-2.5 py-2 text-right text-slate-900 font-black">
                              ₹{currentRunBal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      });
                    })()}

                    {/* Grand summary row */}
                    <tr className="bg-slate-50 font-black">
                      <td colSpan={3} className="px-2.5 py-2.5 text-right uppercase text-[8px] font-black tracking-widest text-slate-500">
                        Ambala Reconciled Ledger Totals
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-red-700">
                        ₹{customerTx.filter(t => t.type === 'invoice').reduce((s,t)=>s+t.amount, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-emerald-700">
                        ₹{customerTx.filter(t => t.type !== 'invoice').reduce((s,t)=>s+t.amount, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-slate-900 text-xs text-orange-650 bg-orange-50/50">
                        {formatRupee(selectedContact.balance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Official Terms, Notes & Stamp signature */}
              {(showTermsInStatementPrint || showStampInStatementPrint) && (
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-dashed">
                  {showTermsInStatementPrint ? (
                    <div className="space-y-1.5 text-[8.5px] text-slate-400 leading-normal">
                      <p className="font-bold text-slate-600 uppercase">Terms & Audit Disclosures</p>
                      {customStatementTerms ? (
                        <p className="font-semibold text-slate-600 italic bg-slate-50 p-1 border border-slate-100 rounded">{customStatementTerms}</p>
                      ) : (
                        <p>1. Please report any discrepancies in this statement within 7 business days of release.</p>
                      )}
                      <p>2. Direct wire payments can be triggered via instant UPI pay ID (billing@rudra) for real-time reconciliation.</p>
                      <p>3. This statement acts as an official record of trade account receivable bank/general ledger entries.</p>
                    </div>
                  ) : (
                    <div></div>
                  )}

                  {showStampInStatementPrint ? (
                    <div className="text-right flex flex-col justify-between items-end">
                      <div className="h-14 w-28 border border-dashed border-slate-200 rounded flex items-center justify-center text-[7px] text-slate-400 bg-slate-50 tracking-wider font-mono">
                        Official Stamp / Sign
                      </div>
                      <div className="mt-2 text-[9px] text-slate-500">
                        <p className="font-black text-slate-900">RUDRA ENTERPRISES</p>
                        <p className="font-bold">Authorized Account Executive</p>
                      </div>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
              )}

              {/* Special print custom style block inside printable-panel */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #print-statement-area, #print-statement-area * {
                    visibility: visible !important;
                  }
                  #print-statement-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                  }
                  .playable-panel, .fixed,aside {
                    display: none !important;
                  }
                }
              `}</style>

            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 px-6 py-3 border-t flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPdfStatement(false)}
                className="bg-slate-200 hover:bg-slate-250 text-slate-700 font-bold py-1.5 px-4 rounded-xl text-[10px] transition"
              >
                Close Statement Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Programmatic Client-Side Confirmation Modals to handle standard Sandboxed iframe limits */}
      {showDeleteContactConfirm && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden select-none">
            <div className="bg-red-50 p-5 flex items-start gap-4">
              <div className="bg-red-100 p-2.5 rounded-full text-red-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                  Permanent Delete Account
                </h3>
                <p className="text-[11px] text-slate-800 leading-normal mt-1.5 animate-fadeIn">
                  Are you absolutely sure you want to permanently delete the party ledger account <strong className="text-red-700 font-extrabold">"{selectedContact.name}"</strong>?
                </p>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  ⚠️ This will instantly purge all chronological transaction logs associated with this account and restore relevant system balances. This action is irreversible.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteContactConfirm(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-extrabold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteContact}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {txToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden select-none">
            <div className="bg-red-50 p-5 flex items-start gap-4">
              <div className="bg-red-100 p-2.5 rounded-full text-red-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                  Remove Voucher Entry
                </h3>
                <p className="text-[11px] text-slate-800 leading-normal mt-1.5 animate-fadeIn">
                  Are you sure you want to delete this payment voucher of <strong className="text-slate-950 font-extrabold">₹{txToDelete.amount.toLocaleString('en-IN')}</strong>?
                </p>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  ⚠️ The associated party balances will be adjusted back automatically.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200 font-extrabold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTx}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
